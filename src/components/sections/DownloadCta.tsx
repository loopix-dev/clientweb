import { ArrowRight, Download, Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function DownloadCta() {
  return (
    <section className="border-t border-line bg-ink-2 py-18 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-line-2 bg-gradient-to-br from-moss/60 via-ink-3 to-ink-2 p-8 sm:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-accent/10 blur-[90px]"
            />
            <div aria-hidden="true" className="grid-pattern pointer-events-none absolute inset-0" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-lg">
                <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
                  Your next session <span className="text-accent">starts here.</span>
                </h2>
                <p className="mt-3 text-[16px] text-fg-2">
                  Get Loopix for PC or Mobile and make Minecraft your own.
                </p>
                <div className="mt-6 flex items-center gap-5 text-[13px] text-fg-3">
                  <span className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-accent" aria-hidden="true" />
                    PC
                  </span>
                  <span className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-accent" aria-hidden="true" />
                    Mobile
                  </span>
                </div>
              </div>

              <Link
                href="/download"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-medium text-ink shadow-[0_1px_0_0_rgba(255,255,255,0.28)_inset] transition-colors duration-200 hover:bg-accent-hover"
              >
                <Download className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-px" />
                Go to download
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
