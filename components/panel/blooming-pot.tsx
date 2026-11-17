"use client";

import { useEffect, useEffectEvent, useRef, type CSSProperties } from "react";

const MIN_GROW_MS = 1400;
const BUD_HOLD_MS = 600;
const BLOOM_MS = 800;
const LEAF_STOPS = [0.3, 0.55];
const PETAL_ANGLES = [0, 72, 144, 216, 288];

type BloomingPotProps = {
  progress: number;
  uploaded: boolean;
  saved: boolean;
  paused: boolean;
  onBud: () => void;
  onBloom: () => void;
  className?: string;
};

export function BloomingPot({ progress, uploaded, saved, paused, onBud, onBloom, className }: BloomingPotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const stemRef = useRef<SVGPathElement>(null);
  const growth = useRef({ shown: 0, base: 0, start: -1, wasPaused: false, budAt: -1 });

  const tick = useEffectEvent((now: number, dt: number, calm: boolean): boolean => {
    const svg = svgRef.current;
    const stem = stemRef.current;
    if (!svg || !stem) return false;
    const g = growth.current;

    if (g.start < 0 || (g.wasPaused && !paused)) {
      g.start = now;
      g.base = g.shown;
    }
    g.wasPaused = paused;

    if (!paused) {
      const cap = calm ? 1 : Math.min(1, g.base + (now - g.start) / MIN_GROW_MS);
      const target = Math.min(progress, cap);
      if (target > g.shown) {
        g.shown = calm ? target : g.shown + (target - g.shown) * (1 - Math.exp(-dt / 170));
        if (target - g.shown < 0.002) g.shown = target;
      }
    }

    stem.style.strokeDashoffset = String(1 - g.shown);
    svg.dataset.leaves = String(LEAF_STOPS.filter((stop) => g.shown >= stop).length);

    if (!paused && uploaded && g.budAt < 0 && g.shown >= 0.995) {
      g.budAt = now;
      svg.dataset.stage = "bud";
      onBud();
    }
    if (saved && g.budAt >= 0 && now - g.budAt >= (calm ? 0 : BUD_HOLD_MS)) {
      svg.dataset.stage = "bloom";
      return true;
    }
    return false;
  });

  const finish = useEffectEvent(() => onBloom());

  useEffect(() => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now();
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const loop = (now: number) => {
      const bloomed = tick(now, Math.min(64, now - last), calm);
      last = now;
      if (bloomed) {
        timer = setTimeout(finish, calm ? 0 : BLOOM_MS);
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);

  return (
    <svg ref={svgRef} viewBox="0 0 200 250" aria-hidden="true" focusable="false" className={`overflow-visible ${className ?? ""}`}>
      <path ref={stemRef} className="bloom-stem" pathLength={1} d="M100 178 C 97 150, 105 122, 100 96 S 98 60, 100 46" />
      <g className="bloom-leaf bloom-leaf-a">
        <path d="M100 140 C 86 139, 74 130, 71 115 C 85 116, 97 125, 100 140 Z" fill="var(--color-sage-deep)" />
        <path className="bloom-vein" d="M98 137 C 90 131, 81 124, 75 118" />
      </g>
      <g className="bloom-leaf bloom-leaf-b">
        <path d="M101.5 108 C 114 104, 125 94, 127 80 C 114 82, 103 92, 101.5 108 Z" fill="var(--color-glaze-deep)" />
        <path className="bloom-vein" d="M103 105 C 110 99, 118 91, 123 85" />
      </g>
      <g transform="translate(100 46)">
        <g className="bloom-sway">
          <g className="bloom-bud">
            <path d="M0 2 C -9 -3, -8 -15, 0 -23 C 8 -15, 9 -3, 0 2 Z" fill="var(--color-coral-deep)" />
            <path
              d="M0 2 C -7 0, -8 -7, -6 -11 C -3 -7, -1 -3, 0 2 Z M0 2 C 7 0, 8 -7, 6 -11 C 3 -7, 1 -3, 0 2 Z"
              fill="var(--color-sage-deep)"
            />
          </g>
        </g>
      </g>
      <g transform="translate(100 40)">
        {PETAL_ANGLES.map((deg, index) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <ellipse className="bloom-petal" style={{ "--i": index } as CSSProperties} cx="0" cy="-15" rx="10" ry="14" />
          </g>
        ))}
        <circle className="bloom-center" r="8.5" />
      </g>
      <g transform="translate(50 160)">
        <path d="M40 14h20v8c0 5 16 13 16 33 0 19-9 31-26 31S24 74 24 55c0-20 16-28 16-33z" fill="var(--color-glaze-light)" />
        <path d="M24 55c0-5 2-9 3.5-12.5h45C74 46 76 50 76 55c0 19-9 31-26 31S24 74 24 55z" fill="var(--color-btn)" />
        <circle cx="38" cy="64" r="3.5" fill="var(--color-surface)" />
        <circle cx="50" cy="72" r="3.5" fill="var(--color-surface)" />
        <circle cx="62" cy="64" r="3.5" fill="var(--color-surface)" />
        <path d="M36 14h28" stroke="var(--color-btn)" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
