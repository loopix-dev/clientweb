import type { Metadata } from "next";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { DownloadCta } from "@/components/sections/DownloadCta";
import { getContent } from "@/server/content";

export function generateMetadata(): Metadata {
  const content = getContent();
  return {
    title: "Features",
    description: `${content.features.title} ${content.features.subtitle}`.trim(),
  };
}

export default function FeaturesPage() {
  const content = getContent();
  return (
    <>
      <div className="pt-28 sm:pt-32" />
      <FeaturesSection features={content.features} />
      <DownloadCta />
    </>
  );
}
