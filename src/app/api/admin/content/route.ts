import { revalidatePath } from "next/cache";
import { bad, json, unauthorized } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { db, saveDb, type Database } from "@/server/db";
import { getContent, type Content } from "@/server/content";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  return json({ content: getContent() });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  let body: { content?: Content };
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }
  if (!body?.content || typeof body.content !== "object") {
    return bad("Missing `content` object.");
  }

  const incoming = body.content;
  if (typeof incoming.brand?.accent === "string" && !/^#[0-9a-fA-F]{6}$/.test(incoming.brand.accent)) {
    return bad("Accent color must be a 6-digit hex value like #A3E635.");
  }
  const updateUrl = typeof incoming.updater?.downloadUrl === "string" ? incoming.updater.downloadUrl.trim() : "";
  if (updateUrl && !/^(https?:\/\/|\/(?!\/))/.test(updateUrl)) {
    return bad("Update URL must start with https://, http:// or a / path.");
  }

  const d: Database = db();
  d.content = sanitize(incoming);
  saveDb();

  // Public pages are statically rendered; refresh them so edits appear immediately.
  revalidatePath("/", "layout");
  return json({ content: getContent() });
}

/** Keeps the stored shape predictable even when the client posts extra keys. */
function sanitize(input: Content): Content {
  const base = getContent();
  return {
    brand: { ...base.brand, ...input.brand },
    hero: {
      ...base.hero,
      ...input.hero,
      primaryCta: { ...base.hero.primaryCta, ...input.hero?.primaryCta },
      secondaryCta: { ...base.hero.secondaryCta, ...input.hero?.secondaryCta },
      highlights: asArray(input.hero?.highlights, base.hero.highlights),
    },
    features: {
      ...base.features,
      ...input.features,
      items: asArray(input.features?.items, base.features.items),
    },
    faq: {
      ...base.faq,
      ...input.faq,
      items: asArray(input.faq?.items, base.faq.items),
    },
    download: {
      ...base.download,
      ...input.download,
      platforms: {
        pc: { ...base.download.platforms.pc, ...input.download?.platforms?.pc },
        mobile: { ...base.download.platforms.mobile, ...input.download?.platforms?.mobile },
      },
      steps: asArray(input.download?.steps, base.download.steps),
    },
    screenshots: {
      pc: asUrlArray(input.screenshots?.pc, base.screenshots.pc),
      mobile: asUrlArray(input.screenshots?.mobile, base.screenshots.mobile),
    },
    seo: {
      metaTitle: typeof input.seo?.metaTitle === "string" ? input.seo.metaTitle : base.seo.metaTitle,
      metaDescription:
        typeof input.seo?.metaDescription === "string" ? input.seo.metaDescription : base.seo.metaDescription,
      keywords: asArray(input.seo?.keywords, base.seo.keywords),
      ogImageUrl: typeof input.seo?.ogImageUrl === "string" ? input.seo.ogImageUrl : null,
    },
    updater: {
      enabled: input.updater?.enabled === true,
      latestVersion: trimmed(input.updater?.latestVersion, 40),
      minVersion: trimmed(input.updater?.minVersion, 40),
      noticeTitle: trimmed(input.updater?.noticeTitle, 120),
      noticeBody: trimmed(input.updater?.noticeBody, 500),
      downloadUrl: trimmed(input.updater?.downloadUrl, 300),
    },
    footer: { ...base.footer, ...input.footer },
  };
}

function asArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

/** Trims a string field and caps its length; non-strings become empty. */
function trimmed(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Accepts the current array shape and the legacy single-URL string. */
function asUrlArray(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    return value.filter((u): u is string => typeof u === "string" && u.length > 0);
  }
  if (typeof value === "string" && value.length > 0) return [value];
  return fallback;
}
