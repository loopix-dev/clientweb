/**
 * Official configuration for the Loopix Client website.
 *
 * Site content (text, screenshots, downloads, docs, users) is managed in the
 * admin panel at /admin and stored in data/db.json. This file only holds the
 * static project identity and official external links.
 *
 * Set a real URL and the site shows it; leave it null and the site shows an
 * honest "not published yet" state. Nothing is ever invented.
 */

export type SiteLinks = {
  discord: string | null;
  support: string | null;
  bugReport: string | null;
  changelog: string | null;
  privacy: string | null;
  terms: string | null;
};

export type SiteConfig = {
  name: string;
  shortName: string;
  description: string;
  url: string | null;
  nav: { label: string; href: string }[];
  links: SiteLinks;
  legal: { disclaimer: string };
};

export const siteConfig: SiteConfig = {
  name: "Loopix Client",
  shortName: "Loopix",
  description:
    "A cleaner Minecraft launcher with convenient customization and a smoother everyday workflow.",
  url: null,

  nav: [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "Docs", href: "/docs" },
    { label: "FAQ", href: "/faq" },
  ],

  links: {
    discord: null,
    support: null,
    bugReport: null,
    changelog: null,
    privacy: null,
    terms: null,
  },

  legal: {
    disclaimer:
      "Loopix Client is an independent project. Not affiliated with Mojang Studios or Microsoft.",
  },
};
