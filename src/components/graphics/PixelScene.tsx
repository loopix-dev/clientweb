import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Original, procedurally drawn voxel-style landscape (SVG only — no external
 * images, no third-party game assets). Used as the launcher backdrop and for
 * the experience section visual.
 */

const COLS = 40;
const ROWS = 25;
const BLOCK = 8;

function buildTerrain(seed: number, amplitude: number, base: number): number[] {
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const heights: number[] = [];
  let h = base;
  for (let x = 0; x < COLS; x++) {
    h += (rnd() - 0.5) * amplitude;
    h = Math.max(base - 4, Math.min(base + 3, h));
    heights.push(Math.round(h));
  }
  return heights;
}

const NEAR = buildTerrain(20261011, 3.4, 15);
const FAR = buildTerrain(98765431, 2.2, 12);

const STARS = Array.from({ length: 26 }, (_, i) => {
  const s = (i * 2654435761) % 4294967296;
  const x = (s % 320) + 4;
  const y = ((s >> 7) % 90) + 6;
  const o = 0.12 + ((s >> 4) % 40) / 200;
  return { x, y, o };
});

const TREES = [
  { col: 6, height: 3 },
  { col: 21, height: 4 },
  { col: 33, height: 3 },
];

export function PixelScene({ className }: { className?: string }) {
  const id = useId();
  const skyId = `${id}-sky`;
  const glowId = `${id}-glow`;

  return (
    <svg
      viewBox={`0 0 ${COLS * BLOCK} ${ROWS * BLOCK}`}
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#090C07" />
          <stop offset="55%" stopColor="#0E130B" />
          <stop offset="100%" stopColor="#141B0F" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#A3E635" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#A3E635" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* sky */}
      <rect width={COLS * BLOCK} height={ROWS * BLOCK} fill={`url(#${skyId})`} />

      {/* stars */}
      {STARS.map((star, i) => (
        <rect
          key={i}
          x={star.x}
          y={star.y}
          width={2}
          height={2}
          fill="#F5F7F2"
          opacity={star.o}
        />
      ))}

      {/* moon + halo */}
      <rect x={180} y={12} width={64} height={64} fill={`url(#${glowId})`} />
      <rect x={198} y={30} width={16} height={16} rx={2} fill="#A3E635" opacity={0.5} />
      <rect x={202} y={34} width={4} height={4} fill="#0E130B" opacity={0.35} />
      <rect x={206} y={40} width={3} height={3} fill="#0E130B" opacity={0.25} />

      {/* far ridge */}
      {FAR.map((h, x) => (
        <rect
          key={`far-${x}`}
          x={x * BLOCK}
          y={h * BLOCK}
          width={BLOCK}
          height={(ROWS - h) * BLOCK}
          fill="#141B0F"
        />
      ))}

      {/* near terrain */}
      {NEAR.map((surface, x) => (
        <g key={`near-${x}`}>
          <rect
            x={x * BLOCK}
            y={surface * BLOCK}
            width={BLOCK}
            height={BLOCK}
            fill={x % 7 === 0 ? "#2C3F1D" : "#26361A"}
          />
          <rect
            x={x * BLOCK}
            y={(surface + 1) * BLOCK}
            width={BLOCK}
            height={(ROWS - surface - 1) * BLOCK}
            fill="#1A2412"
          />
        </g>
      ))}

      {/* scattered detail blocks */}
      {NEAR.map((surface, x) =>
        x % 9 === 4 ? (
          <rect
            key={`detail-${x}`}
            x={x * BLOCK}
            y={(surface - 1) * BLOCK}
            width={BLOCK}
            height={BLOCK}
            fill="#212E15"
          />
        ) : null,
      )}

      {/* trees */}
      {TREES.map((tree) => {
        const surface = NEAR[tree.col] ?? 15;
        const top = surface - tree.height;
        return (
          <g key={`tree-${tree.col}`}>
            <rect
              x={tree.col * BLOCK + 3}
              y={(top + 1) * BLOCK}
              width={2.5 * (BLOCK / 4)}
              height={tree.height * BLOCK}
              fill="#241F14"
            />
            <rect
              x={(tree.col - 2) * BLOCK}
              y={top * BLOCK}
              width={5 * BLOCK}
              height={BLOCK}
              fill="#1F3016"
            />
            <rect
              x={(tree.col - 1) * BLOCK}
              y={(top - 1) * BLOCK}
              width={3 * BLOCK}
              height={BLOCK}
              fill="#253A1A"
            />
          </g>
        );
      })}

      {/* foreground band */}
      <rect x={0} y={(ROWS - 2) * BLOCK} width={COLS * BLOCK} height={2 * BLOCK} fill="#0D1209" />
      {NEAR.map((_, x) =>
        x % 11 === 2 ? (
          <rect
            key={`fg-${x}`}
            x={x * BLOCK + 2}
            y={(ROWS - 3) * BLOCK + 2}
            width={4}
            height={4}
            fill="#A3E635"
            opacity={0.28}
          />
        ) : null,
      )}
    </svg>
  );
}
