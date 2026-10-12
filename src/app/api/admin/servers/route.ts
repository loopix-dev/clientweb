import { bad, json, unauthorized } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { db, saveDb, uid, type GameServer } from "@/server/db";
import { getStatuses } from "@/server/minecraft";
import { cleanServerFields, serverFieldErrors } from "@/server/servers";

type ServerRow = GameServer & {
  status: import("@/server/minecraft").ServerStatus | null;
};

/** Server list with live status (parallel pings, 30 s cache per server). */
async function listWithStatus(force: boolean): Promise<ServerRow[]> {
  const servers = db().servers;
  const statuses = await getStatuses(servers, force);
  return servers.map((server) => ({ ...server, status: statuses[server.id] ?? null }));
}

/** GET /api/admin/servers — every server (enabled or not) + live status. `?fresh=1` re-pings. */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const force = new URL(request.url).searchParams.get("fresh") === "1";
  return json({ servers: await listWithStatus(force) });
}

/** POST /api/admin/servers — create a server. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const fields = cleanServerFields(body);
  const error = serverFieldErrors(fields);
  if (error) return bad(error);

  const server: GameServer = {
    id: uid(),
    ...fields,
    iconUrl: null,
    enabled: body.enabled !== false,
    createdAt: new Date().toISOString(),
  };

  const d = db();
  d.servers.push(server);
  saveDb();

  const statuses = await getStatuses([server]);
  return json({ server: { ...server, status: statuses[server.id] ?? null } });
}
