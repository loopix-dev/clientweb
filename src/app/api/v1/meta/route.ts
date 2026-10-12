import { json } from "@/server/http";
import { getContent } from "@/server/content";
import { db } from "@/server/db";

/**
 * Public metadata for the launcher: build info and published docs.
 * Only published data is exposed.
 */
export async function GET() {
  const content = getContent();
  const docs = db()
    .docs.filter((d) => d.published)
    .map((d) => ({ slug: d.slug, title: d.title, url: `/docs/${d.slug}` }));

  const platform = (p: typeof content.download.platforms.pc) =>
    p.url
      ? { label: p.label, url: p.url, version: p.version, fileSize: p.fileSize }
      : null;

  return json({
    name: `${content.brand.name} ${content.brand.suffix}`.trim(),
    apiVersion: 1,
    downloads: {
      pc: platform(content.download.platforms.pc),
      mobile: platform(content.download.platforms.mobile),
    },
    docs,
  });
}

export const dynamic = "force-dynamic";
