import { db } from "./db";

export interface Content {
  brand: {
    name: string;
    suffix: string;
    tagline: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    /** Hex accent color used across the site. */
    accent: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    accentWord: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    highlights: string[];
  };
  features: {
    label: string;
    title: string;
    subtitle: string;
    items: { icon: string; title: string; body: string }[];
  };
  faq: {
    label: string;
    title: string;
    subtitle: string;
    items: { q: string; a: string }[];
  };
  download: {
    heading: string;
    sub: string;
    platforms: {
      pc: { label: string; description: string; url: string | null; version: string | null; fileSize: string | null };
      mobile: { label: string; description: string; url: string | null; version: string | null; fileSize: string | null };
    };
    steps: { title: string; body: string }[];
    helpText: string;
    helpHref: string | null;
    installationGuideUrl: string | null;
  };
  /** Uploaded launcher previews shown on the download page (auto-swiping carousel). */
  screenshots: { pc: string[]; mobile: string[] };
  /** Site-wide SEO managed from the admin panel. */
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImageUrl: string | null;
  };
  /** Launcher update notice — entirely managed from the admin panel. */
  updater: {
    /** Master switch: when off, no launcher ever sees the notice. */
    enabled: boolean;
    /** Newest published launcher version, e.g. "2.0.0". Empty = nothing published. */
    latestVersion: string;
    /** Oldest supported version — older launchers are flagged `required`. Empty = no gate. */
    minVersion: string;
    noticeTitle: string;
    noticeBody: string;
    /** Where to get the update: absolute (https://…) or site-relative (/download). */
    downloadUrl: string;
  };
  footer: { blurb: string };
}

/** Seed values mirror the original hand-written copy of the site. */
export const defaultContent: Content = {
  brand: {
    name: "Loopix",
    suffix: "Client",
    tagline: "A cleaner Minecraft launcher with convenient customization.",
    logoUrl: null,
    faviconUrl: null,
    accent: "#A3E635",
  },
  hero: {
    eyebrow: "Introducing Loopix Client",
    title: "Minecraft,",
    accentWord: "Refined.",
    subtitle: "A better way to launch, customize, and experience Minecraft.",
    primaryCta: { label: "Download Loopix", href: "/download" },
    secondaryCta: { label: "Explore Features", href: "/features" },
    highlights: ["Easy setup", "Customizable", "Built for Minecraft"],
  },
  features: {
    label: "The experience",
    title: "Everything in Its Place.",
    subtitle: "The important things close, the distractions out of the way.",
    items: [
      { icon: "launcher", title: "A cleaner launcher", body: "One screen for your version, your profile, and Play." },
      { icon: "sliders", title: "Personalization", body: "Adjust the client to your taste in one settings surface." },
      { icon: "blocks", title: "Minecraft-focused", body: "Version choices up front. Supported versions listed with each release." },
      { icon: "tools", title: "Convenient management", body: "Switch versions and manage profiles in a couple of clicks." },
      { icon: "refresh", title: "Clear updates", body: "Every build ships with plain-language release notes." },
      { icon: "community", title: "Community", body: "Get help and follow announcements where the team reads them." },
    ],
  },
  faq: {
    label: "Support",
    title: "Questions, answered.",
    subtitle: "Short, honest answers. Anything unpublished is marked as such.",
    items: [
      { q: "What is Loopix Client?", a: "A Minecraft client and launcher with a cleaner interface and a simpler everyday workflow." },
      { q: "How do I download it?", a: "Use the Download page. Until the installer is published, that page says so plainly — it never links to unofficial builds." },
      { q: "How do I install it?", a: "Download the installer for your platform and follow the official installation guide." },
      { q: "Which Minecraft versions are supported?", a: "The supported list ships with each release and is shown in the client." },
      { q: "Which operating systems are supported?", a: "PC and Mobile builds are planned. Confirmed platforms are always listed on the Download page." },
      { q: "Is Loopix Client free?", a: "Pricing is announced with the official release." },
      { q: "How do I update the client?", a: "Update details and release notes are published with every release." },
      { q: "Where can I get support?", a: "Through the community channels linked in the footer." },
      { q: "How can I report a bug?", a: "Use the bug-report channel and include the steps to reproduce." },
    ],
  },
  download: {
    heading: "Get Loopix for your device.",
    sub: "Two builds, one client. Choose PC or Mobile.",
    platforms: {
      pc: { label: "PC", description: "Desktop launcher", url: null, version: null, fileSize: null },
      mobile: { label: "Mobile", description: "Play on the go", url: null, version: null, fileSize: null },
    },
    steps: [
      { title: "Download", body: "Pick your device and get the official installer." },
      { title: "Install", body: "Follow the installation guide for your platform." },
      { title: "Play", body: "Open Loopix and start your session." },
    ],
    helpText: "Need help installing?",
    helpHref: null,
    installationGuideUrl: null,
  },
  screenshots: { pc: [], mobile: [] },
  seo: {
    metaTitle: "Loopix Client — A Better Minecraft Experience",
    metaDescription:
      "A cleaner Minecraft launcher with convenient customization and a smoother everyday workflow.",
    keywords: ["Loopix Client", "Minecraft client", "Minecraft launcher", "Minecraft customization", "PvP client"],
    ogImageUrl: null,
  },
  updater: {
    enabled: false,
    latestVersion: "",
    minVersion: "",
    noticeTitle: "",
    noticeBody: "",
    downloadUrl: "",
  },
  footer: { blurb: "A cleaner Minecraft launcher with convenient customization." },
};

export function getContent(): Content {
  // Runtime merge keeps older databases compatible with newly added fields.
  // Stored content is normalized at DB load time (see db.ts).
  const stored = db().content;
  return deepMerge(
    structuredClone(defaultContent) as unknown as Record<string, unknown>,
    stored as unknown as Record<string, unknown>,
  ) as unknown as Content;
}

function deepMerge(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const current = base[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      deepMerge(current as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      base[key] = value;
    }
  }
  return base;
}
