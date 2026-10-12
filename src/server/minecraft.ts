import net from "node:net";

/**
 * Live server status gathered with the vanilla Server List Ping protocol —
 * the same handshake the multiplayer menu uses. Nothing here is simulated:
 * a server that does not answer is reported offline.
 */
export interface ServerStatus {
  online: boolean;
  latencyMs: number | null;
  /** Version reported by the server, e.g. "1.21.4". */
  version: string | null;
  players: { online: number; max: number } | null;
  motd: string | null;
  checkedAt: string;
}

const DEFAULT_PORT = 25565;
const TIMEOUT_MS = 4_000;
const CACHE_TTL_MS = 30_000;
const CACHE_KEY = "__loopixServerStatus__";

/** Accepts `host`, `host:port` or `[v6]:port`. Returns null for anything else. */
export function parseAddress(raw: string): { host: string; port: number } | null {
  const address = String(raw ?? "").trim();
  if (!address || address.length > 255) return null;

  const v6 = /^\[([0-9a-fA-F:.]+)\](?::(\d{1,5}))?$/.exec(address);
  if (v6) {
    const port = v6[2] ? Number(v6[2]) : DEFAULT_PORT;
    return port >= 1 && port <= 65535 ? { host: v6[1], port } : null;
  }

  const withPort = /^([a-zA-Z0-9.-]+):(\d{1,5})$/.exec(address);
  if (withPort) {
    const port = Number(withPort[2]);
    return port >= 1 && port <= 65535 ? { host: withPort[1], port } : null;
  }

  return /^[a-zA-Z0-9.-]+$/.test(address) ? { host: address, port: DEFAULT_PORT } : null;
}

/* ---------------- varint / packet helpers ---------------- */

function writeVarint(value: number): Buffer {
  const bytes: number[] = [];
  let rest = value;
  do {
    let b = rest & 0x7f;
    rest >>>= 7;
    if (rest !== 0) b |= 0x80;
    bytes.push(b);
  } while (rest !== 0);
  return Buffer.from(bytes);
}

function readVarint(buf: Buffer, offset: number): { value: number; next: number } | null {
  let value = 0;
  let shift = 0;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos++];
    value |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) return { value, next: pos };
    shift += 7;
    if (shift > 35) return null;
  }
  return null; // need more bytes
}

interface StatusJson {
  version?: { name?: string };
  players?: { online?: number; max?: number };
  description?: unknown;
}

type ParsedPacket = StatusJson | null | "incomplete";

/** Decodes the single status-response packet; "incomplete" until it fully arrives. */
function parseStatusPacket(buf: Buffer): ParsedPacket {
  const length = readVarint(buf, 0);
  if (!length) return "incomplete";
  if (buf.length < length.next + length.value) return "incomplete";

  const id = readVarint(buf, length.next);
  if (!id) return "incomplete";
  if (id.value !== 0) return null;

  const strLen = readVarint(buf, id.next);
  if (!strLen) return "incomplete";
  if (buf.length < strLen.next + strLen.value) return "incomplete";

  try {
    return JSON.parse(buf.subarray(strLen.next, strLen.next + strLen.value).toString("utf8")) as StatusJson;
  } catch {
    return null;
  }
}

/** The description field can be a string or a chat-component tree. */
function flattenMotd(description: unknown): string | null {
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node === "string") {
      parts.push(node);
      return;
    }
    if (!node || typeof node !== "object") return;
    const obj = node as { text?: unknown; extra?: unknown[] };
    if (typeof obj.text === "string") parts.push(obj.text);
    if (Array.isArray(obj.extra)) obj.extra.forEach(walk);
  };
  walk(description);
  const text = parts.join("").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 160) : null;
}

function offlineStatus(latencyMs: number | null = null): ServerStatus {
  return {
    online: false,
    latencyMs,
    version: null,
    players: null,
    motd: null,
    checkedAt: new Date().toISOString(),
  };
}

/* ---------------- ping ---------------- */

function ping(host: string, port: number): Promise<ServerStatus> {
  const started = Date.now();
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let buffer = Buffer.alloc(0);
    let settled = false;

    const finish = (status: ServerStatus) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(TIMEOUT_MS);
    socket.on("connect", () => {
      // Handshake (next state 1 = status), then an empty status request.
      const hostBytes = Buffer.from(host, "utf8");
      const handshake = Buffer.concat([
        writeVarint(0x00),
        writeVarint(hostBytes.length),
        hostBytes,
        Buffer.from([(port >> 8) & 0xff, port & 0xff]),
        writeVarint(1),
      ]);
      const request = writeVarint(0x00);
      socket.write(
        Buffer.concat([writeVarint(handshake.length), handshake, writeVarint(request.length), request]),
      );
    });

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const parsed = parseStatusPacket(buffer);
      if (parsed === "incomplete") return;
      if (!parsed) return finish(offlineStatus());

      const players = parsed.players;
      finish({
        online: true,
        latencyMs: Date.now() - started,
        version: typeof parsed.version?.name === "string" ? parsed.version.name.slice(0, 40) : null,
        players:
          players && typeof players.online === "number" && typeof players.max === "number"
            ? { online: players.online, max: players.max }
            : null,
        motd: flattenMotd(parsed.description),
        checkedAt: new Date().toISOString(),
      });
    });

    socket.on("timeout", () => finish(offlineStatus()));
    socket.on("error", () => finish(offlineStatus()));
    socket.on("close", () => finish(offlineStatus()));
  });
}

/* ---------------- cache ---------------- */

interface StatusCache {
  entries: Record<string, { at: number; status: ServerStatus }>;
}

/** In-memory on globalThis (same pattern as the DB cache): statuses are transient. */
function cache(): StatusCache {
  const g = globalThis as Record<string, unknown>;
  if (!g[CACHE_KEY]) g[CACHE_KEY] = { entries: {} } satisfies StatusCache;
  return g[CACHE_KEY] as StatusCache;
}

/** Status for one server, cached for 30 s unless `force`. */
export async function getStatus(id: string, address: string, force = false): Promise<ServerStatus> {
  const entries = cache().entries;
  const hit = entries[id];
  if (!force && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.status;

  const target = parseAddress(address);
  const status = target ? await ping(target.host, target.port) : offlineStatus();
  entries[id] = { at: Date.now(), status };
  return status;
}

/** Status for many servers, pinging in parallel (30 s cache per server). */
export async function getStatuses(
  servers: readonly { id: string; address: string }[],
  force = false,
): Promise<Record<string, ServerStatus>> {
  const pairs = await Promise.all(
    servers.map(
      async (server): Promise<[string, ServerStatus]> => [server.id, await getStatus(server.id, server.address, force)],
    ),
  );
  return Object.fromEntries(pairs);
}
