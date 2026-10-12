import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LoopixLogo } from "@/components/brand/Logo";
import { siteConfig } from "@/config/site";

type Brand = { name: string; suffix: string; logoUrl: string | null };

const productLinks = [
  { label: "Features", href: "/features" },
  { label: "Download", href: "/download" },
  { label: "Docs", href: "/docs" },
  { label: "FAQ", href: "/faq" },
  { label: "Dashboard", href: "/dashboard" },
];

const supportLinks = (installationGuideUrl: string | null) => [
  { label: "Installation guide", href: installationGuideUrl ?? siteConfig.links.support },
  { label: "Bug reports", href: siteConfig.links.bugReport },
  { label: "Changelog", href: siteConfig.links.changelog },
];

function FooterLink({ label, href }: { label: string; href: string | null }) {
  if (!href) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13.5px] text-fg-3" aria-disabled="true">
        {label}
        <span className="font-mono text-[9px] tracking-[0.12em] text-fg-3 uppercase">soon</span>
      </span>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link href={href} className="text-[13.5px] text-fg-2 transition-colors duration-200 hover:text-fg">
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1 text-[13.5px] text-fg-2 transition-colors duration-200 hover:text-fg"
    >
      {label}
      <ArrowUpRight
        className="h-3 w-3 text-fg-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    </a>
  );
}

export function Footer({
  brand,
  blurb,
  legalDocs,
  installationGuideUrl,
}: {
  brand: Brand;
  blurb: string;
  legalDocs: { privacy: boolean; terms: boolean };
  installationGuideUrl: string | null;
}) {
  return (
    <footer className="border-t border-line bg-ink-2">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="max-w-sm">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt={`${brand.name} logo`} className="h-7 w-auto max-w-[180px] object-contain" />
            ) : (
              <LoopixLogo name={brand.name} suffix={brand.suffix} />
            )}
            <p className="mt-4 text-[13.5px] leading-relaxed text-fg-2">{blurb}</p>
          </div>

          <nav aria-label="Product">
            <h2 className="font-mono text-[10px] font-medium tracking-[0.2em] text-fg-3 uppercase">
              Product
            </h2>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink label={link.label} href={link.href} />
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Support">
            <h2 className="font-mono text-[10px] font-medium tracking-[0.2em] text-fg-3 uppercase">
              Support
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <FooterLink label="Discord" href={siteConfig.links.discord ?? "/faq"} />
              </li>
              {supportLinks(installationGuideUrl).map((link) => (
                <li key={link.label}>
                  <FooterLink label={link.label} href={link.href} />
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-[10px] font-medium tracking-[0.2em] text-fg-3 uppercase">
              Legal
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <FooterLink
                  label="Privacy policy"
                  href={siteConfig.links.privacy ?? (legalDocs.privacy ? "/docs/privacy" : null)}
                />
              </li>
              <li>
                <FooterLink
                  label="Terms of service"
                  href={siteConfig.links.terms ?? (legalDocs.terms ? "/docs/terms" : null)}
                />
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[12.5px] text-fg-3">© Loopix Client. All rights reserved.</p>
          <p className="text-[11.5px] text-fg-3">{siteConfig.legal.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
