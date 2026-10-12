import { bad, json, unauthorized } from "@/server/http";
import { currentUserFromRequest } from "@/server/auth";
import { HEARTBEAT_SECONDS, markOffline, markOnline, onlineCount } from "@/server/presence";

/**
 * Launcher presence heartbeat. The launcher calls this every ~30 seconds
 * while it is running (`Authorization: Bearer <token>`):
 *
 *   POST /api/v1/presence            → mark this account online
 *   POST /api/v1/presence {"status":"offline"} → launcher closed
 *
 * The live count is what the website header shows as "N online".
 */
export async function POST(request: Request) {
  const user = await currentUserFromRequest(request);
  if (!user) return unauthorized();

  let body: { status?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body = heartbeat (online).
  }

  const status = String(body?.status ?? "online");
  if (status !== "online" && status !== "offline") {
    return bad("Status must be `online` or `offline`.");
  }

  if (status === "offline") markOffline(user.id);
  else markOnline(user.id);

  return json({
    ok: true,
    status,
    online: onlineCount(),
    heartbeatSeconds: HEARTBEAT_SECONDS,
  });
}
