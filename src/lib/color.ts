import type { CSSProperties } from "react";

const HEX = /^#([0-9a-f]{6})$/i;

/** Lightens (amount > 0) or darkens (amount < 0) a 6-digit hex color. */
export function shiftColor(hex: string, amount: number): string {
  const match = HEX.exec(hex.trim());
  if (!match) return hex;
  const value = parseInt(match[1], 16);
  const channel = (v: number) =>
    Math.max(0, Math.min(255, Math.round(amount > 0 ? v + (255 - v) * amount : v * (1 + amount))));
  const r = channel((value >> 16) & 255);
  const g = channel((value >> 8) & 255);
  const b = channel(value & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export const isHex = (value: string): boolean => HEX.test(value.trim());

/** Overrides the theme accent tokens so admin color changes apply everywhere. */
export function accentStyle(accent: string): CSSProperties {
  if (!isHex(accent)) return {};
  return {
    ["--color-accent" as string]: accent,
    ["--color-accent-hover" as string]: shiftColor(accent, 0.12),
    ["--color-accent-pressed" as string]: shiftColor(accent, -0.16),
  } as CSSProperties;
}
