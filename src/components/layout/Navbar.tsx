"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Download, Menu, User, X } from "lucide-react";
import { LoopixLogo } from "@/components/brand/Logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type Brand = { name: string; suffix: string; logoUrl: string | null };
type SessionUser = { username: string } | null;

export function Navbar({ brand }: { brand: Brand }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser>(null);
  // Launcher-online count; null until the first fetch (avoids SSR mismatch).
  const [online, setOnline] = useState<number | null>(null);
  const pathname = usePathname();

  const refreshSession = useCallback(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ? { username: d.user.username } : null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    refreshSession();
  }, [pathname, refreshSession]);

  useEffect(() => {
    window.addEventListener("loopix:user", refreshSession);
    return () => window.removeEventListener("loopix:user", refreshSession);
  }, [refreshSession]);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/online", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && typeof d?.online === "number") setOnline(d.online);
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 30_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const allLinks = [
    ...siteConfig.nav,
    user
      ? { label: `Dashboard · ${user.username}`, href: "/dashboard" }
      : { label: "Sign in", href: "/login" },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled || menuOpen
          ? "border-line bg-ink/85 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8"
      >
        <Link
          href="/"
          className="rounded-md transition-opacity duration-200 hover:opacity-85"
          aria-label={`${brand.name} — home`}
        >
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={`${brand.name} logo`} className="h-7 w-auto max-w-[160px] object-contain" />
          ) : (
            <LoopixLogo name={brand.name} suffix={brand.suffix} />
          )}
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {siteConfig.nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-3.5 py-2 text-[13.5px] font-medium tracking-tight transition-colors duration-200",
                    isActive ? "text-fg" : "text-fg-2 hover:text-fg",
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-3.5 -bottom-0.5 h-px bg-accent transition-opacity duration-200",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          {online !== null ? (
            <span
              title="Players online in the launcher right now"
              className="hidden items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-[7px] text-[12px] font-medium text-fg-2 sm:inline-flex"
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              {online} online
            </span>
          ) : null}
          <Link
            href={user ? "/dashboard" : "/login"}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-fg-2 transition-colors duration-200 hover:text-fg sm:inline-flex"
          >
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            {user ? user.username : "Sign in"}
          </Link>
          <Link
            href="/download"
            className="group/dl inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-ink shadow-[0_1px_0_0_rgba(255,255,255,0.28)_inset] transition-colors duration-200 hover:bg-accent-hover active:bg-accent-pressed"
          >
            <Download className="h-3.5 w-3.5 transition-transform duration-200 group-hover/dl:translate-y-px" />
            Download
          </Link>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-fg-2 transition-colors duration-200 hover:text-fg md:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* compact mobile drawer */}
      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="border-b border-line bg-ink-2/95 backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto max-w-6xl px-5 py-3 sm:px-8">
          {online !== null ? (
            <li className="flex items-center gap-2 border-b border-line/60 px-3 py-2.5 text-[13px] text-fg-2">
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              {online} {online === 1 ? "player" : "players"} online in the launcher
            </li>
          ) : null}
          {allLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors duration-200",
                    isActive ? "bg-card text-fg" : "text-fg-2 hover:bg-card/60 hover:text-fg",
                  )}
                >
                  {item.label}
                  {isActive ? (
                    <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Now
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}
