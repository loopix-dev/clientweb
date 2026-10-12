import { ArrowDown, Download } from "lucide-react";
import Link from "next/link";
import { PixelScene } from "@/components/graphics/PixelScene";
import { Reveal } from "@/components/ui/Reveal";
import type { Content } from "@/server/content";

export function HeroSection({ hero }: { hero: Content["hero"] }) {
  return (
    <section className="relative overflow-hidden pt-28 pb-14 sm:pt-32 lg:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-pattern" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 h-[520px] w-[520px] rounded-full bg-accent/[0.07] blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2.5 rounded-full border border-line bg-card/70 px-3 py-1.5">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="font-mono text-[10.5px] font-medium tracking-[0.2em] text-fg-2 uppercase">
                  {hero.eyebrow}
                </span>
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-6 text-[clamp(2.75rem,7vw,5rem)] leading-[0.96] font-semibold tracking-[-0.035em]">
                {hero.title}{" "}
                <span className="text-accent [text-shadow:0_0_60px_rgba(163,230,53,0.25)]">
                  {hero.accentWord}
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-fg-2">{hero.subtitle}</p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={hero.primaryCta.href}
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-medium text-ink shadow-[0_1px_0_0_rgba(255,255,255,0.28)_inset] transition-colors duration-200 hover:bg-accent-hover active:bg-accent-pressed"
                >
                  <Download className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-px" />
                  {hero.primaryCta.label}
                </Link>
                <Link
                  href={hero.secondaryCta.href}
                  className="group inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-card px-6 py-3.5 text-[15px] font-medium text-fg transition-colors duration-200 hover:border-line-2 hover:bg-card-2"
                >
                  {hero.secondaryCta.label}
                  <ArrowDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6">
                {hero.highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[13.5px] text-fg-2">
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* original artwork panel — no fake UI screenshots */}
          <Reveal delay={0.12}>
            <figure className="relative overflow-hidden rounded-2xl border border-line bg-ink-2 shadow-window">
              <figcaption className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="font-mono text-[10px] tracking-[0.2em] text-fg-3 uppercase">
                  Loopix
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-accent uppercase">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Preview
                </span>
              </figcaption>
              <div className="aspect-[16/10] w-full">
                <PixelScene />
              </div>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
