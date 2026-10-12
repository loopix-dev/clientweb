import { json } from "@/server/http";
import { getContent } from "@/server/content";
import { compareVersions } from "@/server/versions";

/**
 * GET /api/v1/update?version=<launcher version> — public update check.
 *
 * Everything (enabled flag, latest/minimum version, notice text, download URL)
 * is managed from the admin panel → **Updates** tab. The launcher sends its
 * own version and gets back the decided flags:
 *
 * - `updateAvailable` — older than `latestVersion` (factual; null if unknown)
 * - `required`        — older than `minVersion` (block old builds; null if the
 *                       version is unparsable, false when no gate is set)
 * - `showNotice`      — display the update notice: `enabled && updateAvailable`
 *                       (false when off/no version published, null when unknown)
 *
 * New versions never see the notice; old versions always do.
 */
export async function GET(request: Request) {
  const updater = getContent().updater;
  const raw = new URL(request.url).searchParams.get("version");
  const version = typeof raw === "string" ? raw.trim().slice(0, 40) : "";

  // Factual comparisons — null whenever either side can't be parsed.
  const hasLatest = Boolean(updater.latestVersion);
  const cmpLatest = hasLatest && version ? compareVersions(version, updater.latestVersion) : null;
  const cmpMin = updater.minVersion && version ? compareVersions(version, updater.minVersion) : null;

  const updateAvailable = cmpLatest === null ? null : cmpLatest < 0;

  return json({
    enabled: updater.enabled,
    latestVersion: updater.latestVersion,
    minVersion: updater.minVersion,
    notice: { title: updater.noticeTitle, body: updater.noticeBody },
    downloadUrl: updater.downloadUrl || null,
    downloadPath: "/download",
    version: version || null,
    updateAvailable,
    // Never block anyone while the feature is off or nothing is published.
    required: !updater.enabled || !updater.minVersion ? false : cmpMin === null ? null : cmpMin < 0,
    showNotice: !updater.enabled || !hasLatest ? false : updateAvailable === null ? null : updateAvailable,
  });
}
