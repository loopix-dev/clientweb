"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = { q: string; a: string };

export function FAQList({ items, limit }: { items: FaqItem[]; limit?: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const visible = typeof limit === "number" ? items.slice(0, limit) : items;

  return (
    <ul className="divide-y divide-line border-y border-line">
      {visible.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <li key={item.q}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="group flex w-full items-center justify-between gap-6 py-4 text-left"
              >
                <span className="flex items-baseline gap-3.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "font-mono text-[11px] tracking-[0.14em] tabular-nums-strict transition-colors duration-200",
                      isOpen ? "text-accent" : "text-fg-3",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "text-[15.5px] font-medium tracking-tight transition-colors duration-200",
                      isOpen ? "text-fg" : "text-fg-2 group-hover:text-fg",
                    )}
                  >
                    {item.q}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-200",
                    isOpen
                      ? "border-line-2 bg-moss text-accent"
                      : "border-line bg-card text-fg-3 group-hover:border-line-2 group-hover:text-fg-2",
                  )}
                >
                  <Plus
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-300",
                      isOpen && "rotate-45",
                    )}
                  />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              data-open={isOpen}
              className="reveal-grid"
            >
              <div>
                <p className="max-w-2xl pr-10 pb-5 pl-[2.35rem] text-[14.5px] leading-relaxed text-fg-2">
                  {item.a}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
