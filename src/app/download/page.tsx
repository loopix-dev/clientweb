import type { Metadata } from "next";
import { ArrowUpRight, Download, LifeBuoy, Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { Reveal, SectionLabel } from "@/components/ui/Reveal";
import { ScreenshotCarousel } from "@/components/ui/ScreenshotCarousel";
import { getContent, type Content } from "@/server/content";

type Platform = Content["download"]["platforms"]["pc"];

export function generateMetadata(): Metadata {
  return {
    title: "Download",
    description: "Get Loopix Client for PC or Mobile.",
  };
}

export default function DownloadPage() {
  const content = getContent();
  const { download, screenshots } = content;

  return (
    <section className="relative overflow-hidden pt-28 pb-16 lg:pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-pattern" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionLabel>Download</SectionLabel>
          <h1 className="mt-5 max-w-2xl text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.035em]">
            {download.heading}
          </h1>
          <p className="mt-4 max-w-md text-[16.5px] leading-relaxed text-fg-2">{download.sub}</p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Reveal>
            <PlatformCard
              platform={download.platforms.pc}
              screenshots={screenshots.pc}
              Icon={Monitor}
            />
          </Reveal>
          <Reveal delay={0.06}>
            <PlatformCard
              platform={download.platforms.mobile}
              screenshots={screenshots.mobile}
              Icon={Smartphone}
            />
          </Reveal>
        </div>

        {/* install steps */}
        <Reveal delay={0.1}>
          <ol className="mt-14 grid gap-6 border-t border-line pt-10 sm:grid-cols-3">
            {download.steps.map((step, index) => (
              <li key={step.title}>
                <span className="font-mono text-[12px] tracking-[0.2em] text-accent tabular-nums-strict">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-2 text-[16px] font-semibold tracking-tight text-fg">{step.title}</h2>
                <p className="mt-1 text-[13.5px] leading-relaxed text-fg-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-line bg-card px-6 py-5">
            <span className="flex items-center gap-2.5 text-[14px] font-medium text-fg">
              <LifeBuoy className="h-4 w-4 text-accent" aria-hidden="true" />
              {download.helpText}
            </span>
            {download.installationGuideUrl ? (
              <a
                href={download.installationGuideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-accent transition-colors duration-200 hover:text-accent-hover"
              >
                Installation guide
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <Link
                href="/faq"
                className="text-[13.5px] font-medium text-accent transition-colors duration-200 hover:text-accent-hover"
              >
                Read the FAQ
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PlatformCard({
  platform,
  screenshots,
  Icon,
}: {
  platform: Platform;
  screenshots: string[];
  Icon: typeof Monitor;
}) {
  const ready = Boolean(platform.url);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition-colors duration-300 hover:border-line-2">
      {/* launcher previews uploaded from the admin panel (auto-swiping carousel) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-line bg-ink-2">
        {screenshots.length > 0 ? (
          <ScreenshotCarousel images={screenshots} alt={`${platform.label} launcher preview`} />
        ) : (
          <div className="grid-pattern flex h-full w-full items-center justify-center">
            <Icon className="h-10 w-10 text-fg-3/50" aria-hidden="true" />
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-full border border-line bg-ink/85 px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-fg-2 uppercase backdrop-blur-sm">
          {platform.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line-2 bg-ink-2 text-accent">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span
            className={
              ready
                ? "rounded-full border border-accent/40 bg-moss px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-accent uppercase"
                : "rounded-full border border-line bg-ink-2 px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-fg-3 uppercase"
            }
          >
            {ready ? "Available" : "Not published yet"}
          </span>
        </div>

        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-fg">{platform.label}</h2>
        <p className="mt-1 text-[14px] text-fg-2">{platform.description}</p>

        <div className="mt-6 flex-1">
          {ready ? (
            <a
              href={platform.url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-medium text-ink shadow-[0_1px_0_0_rgba(255,255,255,0.28)_inset] transition-colors duration-200 hover:bg-accent-hover"
            >
              <Download className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-px" />
              Download for {platform.label}
            </a>
          ) : (
            <div className="rounded-xl border border-dashed border-line-2 bg-ink-2/60 px-5 py-6 text-center">
              <p className="text-[13.5px] leading-relaxed text-fg-2">
                The official {platform.label} build is not available yet. It will appear here the
                moment it is published.
              </p>
            </div>
          )}
        </div>

        {(platform.version || platform.fileSize) && (
          <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-[12.5px]">
            {platform.version ? (
              <div className="flex gap-2">
                <dt className="text-fg-3">Version</dt>
                <dd className="font-medium text-fg">{platform.version}</dd>
              </div>
            ) : null}
            {platform.fileSize ? (
              <div className="flex gap-2">
                <dt className="text-fg-3">Size</dt>
                <dd className="font-medium text-fg">{platform.fileSize}</dd>
              </div>
            ) : null}
          </dl>
        )}
      </div>
    </article>
  );
}
