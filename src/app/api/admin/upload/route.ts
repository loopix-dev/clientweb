import { revalidatePath } from "next/cache";
import { bad, json, unauthorized } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { db, saveDb, uid } from "@/server/db";
import { removeUpload, saveImageUpload } from "@/server/uploads";
import { type Content } from "@/server/content";

/** Per-platform cap so the carousel stays fast. */
export const MAX_SCREENSHOTS = 12;

/**
 * `fixed` kinds replace the stored image on re-upload (logo, favicon, OG).
 * Screenshot kinds are appended to the platform's carousel (unique file names).
 */
const KINDS: Record<string, { dir: string; name: string; target: "logo" | "favicon" | "og" | "screenshot-pc" | "screenshot-mobile" }> = {
  logo: { dir: "site", name: "logo", target: "logo" },
  favicon: { dir: "site", name: "favicon", target: "favicon" },
  "og-image": { dir: "site", name: "og-image", target: "og" },
  "screenshot-pc": { dir: "site", name: "launcher-pc", target: "screenshot-pc" },
  "screenshot-mobile": { dir: "site", name: "launcher-mobile", target: "screenshot-mobile" },
};

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Expected multipart form data.");
  }

  const kind = String(form.get("kind") ?? "");
  const spec = KINDS[kind];
  if (!spec) {
    return bad(`Unknown upload kind. Expected one of: ${Object.keys(KINDS).join(", ")}.`);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return bad("Missing `file` field.");

  const d = db();

  // Screenshots append to the platform's carousel; each gets a unique name.
  const baseName =
    spec.target === "screenshot-pc" || spec.target === "screenshot-mobile"
      ? `${spec.name}-${uid()}`
      : spec.name;

  const result = await saveImageUpload(file as File, spec.dir, baseName);
  if ("error" in result) return bad(result.error);

  if (spec.target === "logo") {
    d.content.brand.logoUrl = result.url;
  } else if (spec.target === "favicon") {
    d.content.brand.faviconUrl = result.url;
  } else if (spec.target === "og") {
    d.content.seo.ogImageUrl = result.url;
  } else {
    const list = d.content.screenshots[spec.target === "screenshot-pc" ? "pc" : "mobile"];
    list.push(result.url);
    if (list.length > MAX_SCREENSHOTS) list.shift();
  }
  saveDb();

  revalidatePath("/", "layout");
  return json({ url: result.url, content: d.content });
}

/**
 * Removes a screenshot (or the OG image) from the content store and deletes
 * the file from disk. Body: `{ url }`.
 */
export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }
  const url = String(body?.url ?? "");
  if (!url.startsWith("/uploads/")) return bad("Invalid image URL.");

  const d = db();
  const content = d.content as Content;

  let removed = false;
  for (const key of ["pc", "mobile"] as const) {
    const index = content.screenshots[key].indexOf(url);
    if (index !== -1) {
      content.screenshots[key].splice(index, 1);
      removed = true;
    }
  }
  if (!removed && content.seo.ogImageUrl === url) {
    content.seo.ogImageUrl = null;
    removed = true;
  }
  if (!removed) return bad("That image is not managed here.", 404);

  removeUpload(url);
  saveDb();
  revalidatePath("/", "layout");
  return json({ ok: true, content: d.content });
}
