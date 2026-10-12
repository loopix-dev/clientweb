"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Transition delay in ms. */
  delay?: number;
  /** Travel distance in px (default 18). */
  y?: number;
};

/**
 * Subtle, one-time entrance transition.
 *
 * Built on IntersectionObserver + CSS instead of a motion library:
 *  - the server-rendered HTML stays visible when JS is unavailable,
 *  - the hidden start state is only applied once the `.js` class is present,
 *  - `prefers-reduced-motion` disables the movement entirely (see globals.css).
 */
export function Reveal({ children, className, delay = 0, y = 18 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("reveal-in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            observer.disconnect();
          }
        }
      },
      { rootMargin: "-60px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties = {
    ...(y ? { "--reveal-y": `${y}px` } : null),
    ...(delay ? { transitionDelay: `${delay}ms` } : null),
  };

  return (
    <div ref={ref} className={cn("reveal", className)} style={style}>
      {children}
    </div>
  );
}

/** Small uppercase section label with a lime indicator. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1 font-mono text-[11px] font-medium tracking-[0.18em] text-fg-2 uppercase",
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </span>
  );
}
