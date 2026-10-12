import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { DownloadCta } from "@/components/sections/DownloadCta";
import { FAQList } from "@/components/sections/FaqSection";
import { Reveal, SectionLabel } from "@/components/ui/Reveal";
import { getContent } from "@/server/content";

export default function Home() {
  const content = getContent();

  return (
    <>
      <HeroSection hero={content.hero} />
      <FeaturesSection features={content.features} />

      <section className="border-t border-line bg-ink py-18 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
          <Reveal>
            <SectionLabel>{content.faq.label}</SectionLabel>
            <h2 className="mt-5 text-[clamp(1.9rem,3.6vw,2.6rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
              {content.faq.title}
            </h2>
            <Link
              href="/faq"
              className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-accent transition-colors duration-200 hover:text-accent-hover"
            >
              All questions
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal delay={0.06}>
            <FAQList items={content.faq.items} limit={4} />
          </Reveal>
        </div>
      </section>

      <DownloadCta />
    </>
  );
}
