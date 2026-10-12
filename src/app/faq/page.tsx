import type { Metadata } from "next";
import { FAQList } from "@/components/sections/FaqSection";
import { Reveal, SectionLabel } from "@/components/ui/Reveal";
import { getContent } from "@/server/content";

export function generateMetadata(): Metadata {
  const content = getContent();
  return {
    title: "FAQ",
    description: content.faq.subtitle || "Answers about Loopix Client.",
  };
}

export default function FAQPage() {
  const content = getContent();
  return (
    <section className="py-28 lg:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
        <Reveal>
          <SectionLabel>{content.faq.label}</SectionLabel>
          <h1 className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
            {content.faq.title}
          </h1>
          <p className="mt-4 max-w-sm text-[15.5px] leading-relaxed text-fg-2">{content.faq.subtitle}</p>
        </Reveal>
        <Reveal delay={0.06}>
          <FAQList items={content.faq.items} />
        </Reveal>
      </div>
    </section>
  );
}
