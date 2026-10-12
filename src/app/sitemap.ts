import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { db } from "@/server/db";

/** Dynamic so docs published from the admin panel appear immediately. */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url ?? "https://loopix.example";
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/features`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/download`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const docs = db()
    .docs.filter((d) => d.published)
    .map((doc) => ({
      url: `${base}/docs/${doc.slug}`,
      lastModified: new Date(doc.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    }));

  return [...routes, ...docs];
}
