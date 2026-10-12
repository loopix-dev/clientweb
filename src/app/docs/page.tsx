import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: "Docs",
  description: "Guides and policies for Loopix Client.",
};

export const dynamic = "force-dynamic";

export default function DocsPage() {
  const docs = db().docs.filter((d) => d.published).sort((a, b) => a.title.localeCompare(b.title));

  return (
    <section className="mx-auto max-w-3xl px-5 py-24 lg:py-28">
      <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-semibold tracking-tight">Docs</h1>
      <p className="mt-2 text-[15px] text-fg-2">Guides and policies, published by the team.</p>

      {docs.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line-2 bg-card px-6 py-10 text-center text-[14px] text-fg-2">
          No documents have been published yet.
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {docs.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/docs/${doc.slug}`}
                className="group flex items-center justify-between gap-4 py-4"
              >
                <span className="text-[15.5px] font-medium tracking-tight text-fg-2 group-hover:text-fg">
                  {doc.title}
                </span>
                <span className="font-mono text-[11px] text-fg-3">
                  Updated {new Date(doc.updatedAt).toLocaleDateString("en-GB")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
