"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Auto-swiping screenshot carousel (slides move right → left).
 *
 * - advances every 4.2s, pauses on hover/focus
 * - dot indicators + touch/pointer swipe on mobile
 * - honors `prefers-reduced-motion`: no auto-advance, instant jumps
 */
const INTERVAL_MS = 4200;
const SWIPE_THRESHOLD_PX = 40;

export function ScreenshotCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);
  const pointerStart = useRef<number | null>(null);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Auto-advance (skipped for reduced motion and while hovered/focused).
  useEffect(() => {
    if (paused || images.length < 2 || reducedMotion.current) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, images.length]);

  if (images.length === 0) return null;

  const goTo = (next: number) => setIndex(((next % images.length) + images.length) % images.length);

  const onPointerDown = (event: React.PointerEvent) => {
    pointerStart.current = event.clientX;
  };
  const onPointerUp = (event: React.PointerEvent) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    goTo(index + (delta < 0 ? 1 : -1));
  };

  const single = images.length === 1;

  return (
    <div
      className="group/carousel relative h-full w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={single ? undefined : onPointerDown}
      onPointerUp={single ? undefined : onPointerUp}
    >
      <div
        className={`flex h-full w-full${single ? "" : " transition-transform duration-700 ease-out"}`}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${alt} — screenshot ${i + 1} of ${images.length}`}
            className="h-full w-full min-w-full shrink-0 object-cover"
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
          />
        ))}
      </div>

      {single ? null : (
        <div
          className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1.5 opacity-90 backdrop-blur-sm transition-opacity duration-200 group-hover/carousel:opacity-100"
          role="group"
          aria-label="Screenshot navigation"
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show screenshot ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => goTo(i)}
              className={
                i === index
                  ? "h-1.5 w-4 rounded-full bg-accent transition-all duration-300"
                  : "h-1.5 w-1.5 rounded-full bg-fg-3 transition-colors duration-200 hover:bg-fg-2"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
