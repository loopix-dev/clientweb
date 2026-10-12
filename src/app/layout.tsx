import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { getContent } from "@/server/content";
import { db } from "@/server/db";
import { accentStyle } from "@/lib/color";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Absolute base for social/OG image URLs: real site URL, env override, then localhost in dev. */
const metadataBase = new URL(
  siteConfig.url ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

export function generateMetadata(): Metadata {
  const content = getContent();
  const brandName = `${content.brand.name} ${content.brand.suffix}`.trim();
  const seo = content.seo;
  const pageTitle = seo.metaTitle?.trim() || `${brandName} — A Better Minecraft Experience`;
  const pageDescription = seo.metaDescription?.trim() || siteConfig.description;
  const keywords = seo.keywords?.length ? seo.keywords : undefined;
  const ogImage = seo.ogImageUrl || "/opengraph-image";
  return {
    metadataBase,
    title: {
      default: pageTitle,
      template: `%s · ${brandName}`,
    },
    description: pageDescription,
    applicationName: brandName,
    keywords,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: brandName,
      title: pageTitle,
      description: pageDescription,
      ...(siteConfig.url ? { url: siteConfig.url } : {}),
      images: [{ url: ogImage, width: 1200, height: 630, alt: brandName }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [ogImage],
    },
    icons: { icon: "/icon" },
    robots: { index: true, follow: true },
    ...(siteConfig.url ? { alternates: { canonical: "/" } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#080A07",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const content = getContent();
  const published = new Set(db().docs.filter((d) => d.published).map((d) => d.slug));

  return (
    <html
      lang="en"
      /* The inline script below adds a `js` class before hydration, so the
         client className intentionally differs from the server-rendered one. */
      suppressHydrationWarning
      style={accentStyle(content.brand.accent)}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Enables the hidden start state of entrance transitions; without JS the
            server-rendered content simply stays visible. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js");`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-ink text-fg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
        >
          Skip to content
        </a>
        <Navbar brand={{ name: content.brand.name, suffix: content.brand.suffix, logoUrl: content.brand.logoUrl }} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer
          brand={{ name: content.brand.name, suffix: content.brand.suffix, logoUrl: content.brand.logoUrl }}
          blurb={content.footer.blurb}
          legalDocs={{ privacy: published.has("privacy"), terms: published.has("terms") }}
          installationGuideUrl={content.download.installationGuideUrl}
        />
      </body>
    </html>
  );
}
