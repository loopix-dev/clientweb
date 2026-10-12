/**
 * Launcher presence — which web accounts have a running launcher right now.
 *
 * The launcher pings `POST /api/v1/presence` (bearer token) every ~30s; an
 * account counts as online for 2 minutes after its last heartbeat. Kept
 * in memory on `globalThis` (same pattern as the DB cache): presence is
 * transient by design, so it is never written to disk and simply resets
 * when the server restarts.
 */

const GLOBAL_KEY = "__loopixPresence__";

interface PresenceStore {
  lastSeen: Record<string, number>;
}

/** Heartbeats older than this are dropped (2 missed beats at 30s each). */
const ONLINE_WINDOW_MS = 120_000;

/** Recommended heartbeat interval advertised to the launcher. */
export const HEARTBEAT_SECONDS = 30;

function store(): PresenceStore {
  const g = globalThis as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = { lastSeen: {} } satisfies PresenceStore;
  return g[GLOBAL_KEY] as PresenceStore;
}

export function markOnline(userId: string): void {
  store().lastSeen[userId] = Date.now();
}

export function markOffline(userId: string): void {
  delete store().lastSeen[userId];
}

/** Distinct users with a heartbeat inside the online window. */
export function onlineCount(): number {
  const lastSeen = store().lastSeen;
  const cutoff = Date.now() - ONLINE_WINDOW_MS;
  let count = 0;
  for (const [userId, seenAt] of Object.entries(lastSeen)) {
    if (seenAt < cutoff) delete lastSeen[userId];
    else count += 1;
  }
  return count;
}
