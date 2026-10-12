import {
  Blocks,
  MessagesSquare,
  MonitorSmartphone,
  RefreshCw,
  SlidersHorizontal,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Reveal, SectionLabel } from "@/components/ui/Reveal";
import type { Content } from "@/server/content";

const ICONS: Record<string, LucideIcon> = {
  launcher: MonitorSmartphone,
  sliders: SlidersHorizontal,
  blocks: Blocks,
  tools: Wrench,
  refresh: RefreshCw,
  community: MessagesSquare,
};

export function FeaturesSection({ features }: { features: Content["features"] }) {
  return (
    <section className="border-t border-line bg-ink py-18 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-xl">
          <SectionLabel>{features.label}</SectionLabel>
          <h2 className="mt-5 text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
            {features.title}
          </h2>
          <p className="mt-3 text-[16px] text-fg-2">{features.subtitle}</p>
        </Reveal>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((feature, index) => {
            const Icon = ICONS[feature.icon] ?? Blocks;
            return (
              <Reveal key={`${feature.title}-${index}`} delay={index * 0.04}>
                <li className="group h-full bg-card p-6 transition-colors duration-300 hover:bg-card-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-2 bg-ink-2 text-accent transition-colors duration-300 group-hover:border-accent/40">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-[16px] font-semibold tracking-tight text-fg">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{feature.body}</p>
                </li>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
