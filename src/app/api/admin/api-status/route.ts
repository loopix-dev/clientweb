import fs from "node:fs";
import path from "node:path";
import { json, unauthorized } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { HEARTBEAT_SECONDS, onlineCount } from "@/server/presence";
import { API_CATALOG } from "@/server/apiCatalog";

/** Total size of data/uploads (how much storage the site is actually using). */
function uploadsBytes(): number {
  const root = path.join(process.cwd(), "data", "uploads");
  let total = 0;
  const walk = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        try {
          total += fs.statSync(full).size;
        } catch {
          // file vanished mid-walk — ignore
        }
      }
    }
  };
  walk(root);
  return total;
}

/** GET /api/admin/api-status — live stats + the API catalog for the admin panel. */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const d = db();
  return json({
    online: onlineCount(),
    heartbeatSeconds: HEARTBEAT_SECONDS,
    origin: new URL(request.url).origin,
    now: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    counts: {
      users: d.users.length,
      admins: d.users.filter((u) => u.role === "admin").length,
      sessions: d.sessions.length,
      launcherAccounts: d.users.reduce((n, u) => n + u.launcherAccounts.length, 0),
      docs: d.docs.length,
      servers: d.servers.length,
      serversEnabled: d.servers.filter((s) => s.enabled).length,
    },
    uploadsBytes: uploadsBytes(),
    endpoints: API_CATALOG,
  });
}

/**
 * POST /api/admin/api-status — health-check every documented endpoint by
 * probing this server itself. Status + latency per route; the expected
 * status for protected routes is 401 (proves auth is enforced).
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const origin = new URL(request.url).origin;
  const probed = API_CATALOG.filter((endpoint) => endpoint.probe);
  const started = Date.now();

  const results = await Promise.all(
    probed.map(async (endpoint) => {
      const probe = endpoint.probe!;
      const at = Date.now();
      try {
        const res = await fetch(origin + endpoint.path, {
          method: probe.method,
          ...(probe.body ? { headers: { "content-type": "application/json" }, body: probe.body } : {}),
          cache: "no-store",
        });
        return {
          path: endpoint.path,
          method: endpoint.method,
          status: res.status,
          expect: probe.expect,
          ms: Date.now() - at,
          ok: res.status === probe.expect,
        };
      } catch {
        return {
          path: endpoint.path,
          method: endpoint.method,
          status: 0,
          expect: probe.expect,
          ms: Date.now() - at,
          ok: false,
        };
      }
    }),
  );

  return json({ results, totalMs: Date.now() - started, checkedAt: new Date().toISOString() });
}
