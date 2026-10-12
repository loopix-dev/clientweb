import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const doc = db().docs.find((d) => d.slug === slug && d.published);
  if (!doc) return { title: "Docs" };
  return { title: doc.title, description: `${doc.title} — Loopix Client documentation.` };
}

export default async function DocPage({ params }: Params) {
  const { slug } = await params;
  const doc = db().docs.find((d) => d.slug === slug && d.published);
  if (!doc) notFound();

  return (
    <section className="mx-auto max-w-3xl px-5 py-24 lg:py-28">
      <Link href="/docs" className="text-[13px] font-medium text-accent hover:text-accent-hover">
        ← All docs
      </Link>
      <article
        className="prose-loopix mt-8"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.body) }}
      />
      <p className="mt-12 border-t border-line pt-6 text-[12.5px] text-fg-3">
        Last updated {new Date(doc.updatedAt).toLocaleDateString("en-GB")}
      </p>
    </section>
  );
}
