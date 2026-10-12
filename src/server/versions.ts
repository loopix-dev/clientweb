/**
 * Minimal dotted-version helpers for the launcher update gate.
 *
 * - "v1.2.3" and "1.2" are accepted (missing parts count as 0).
 * - A version with no digits at all ("beta") is *unknown*, not "old".
 * - Pre-release labels aren't distinguished: "1.0.0-beta" compares as 1.0.0.
 */

/** Dotted numeric segments, or null when the string carries no digits at all. */
export function parseVersion(raw: string): number[] | null {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/^[vV]/, "");
  if (!cleaned) return null;
  const segments = cleaned.split(".").map((seg) => {
    const match = /^\d+/.exec(seg.trim());
    return match ? Number(match[0]) : null;
  });
  if (segments.every((s) => s === null)) return null;
  return segments.map((s) => s ?? 0);
}

/**
 * < 0 when `a` is older than `b`, 0 when equal, > 0 when newer.
 * Returns null when either side is unparsable (the caller shows no notice).
 */
export function compareVersions(a: string, b: string): number | null {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return null;
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
