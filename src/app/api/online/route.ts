import { onlineCount } from "@/server/presence";

/**
 * Public live count of launchers online, shown in the site header.
 * Always fresh (no-store) — the number changes with every heartbeat.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { online: onlineCount() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
