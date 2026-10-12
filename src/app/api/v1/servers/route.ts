import { json, unauthorized } from "@/server/http";
import { currentUserFromRequest } from "@/server/auth";
import { db } from "@/server/db";
import { getStatuses } from "@/server/minecraft";

/**
 * GET /api/v1/servers — the launcher's server list (bearer token).
 *
 * Returns every *enabled* server in admin order with live status measured
 * via the Minecraft Server List Ping (online/offline, ping, players, MOTD).
 * Statuses are cached server-side for 30 seconds.
 */
export async function GET(request: Request) {
  const user = await currentUserFromRequest(request);
  if (!user) return unauthorized();

  const servers = db().servers.filter((s) => s.enabled);
  const statuses = await getStatuses(servers);

  return json({
    servers: servers.map((server) => ({
      id: server.id,
      name: server.name,
      address: server.address,
      description: server.description,
      version: server.version,
      iconUrl: server.iconUrl,
      status: statuses[server.id] ?? null,
    })),
    checkedAt: new Date().toISOString(),
  });
}
