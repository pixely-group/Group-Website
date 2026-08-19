"use client";

import { useState } from "react";
import ZnapSignature, { GRID } from "@/components/ui/ZnapSignature";

/* Guides for tuning the curves — the letterforms are drawn to this grid, so
   seeing it is the difference between adjusting and guessing. */
function Guides() {
  const rows: [number, string][] = [
    [GRID.capTop, "cap"],
    [GRID.xTop, "x-height"],
    [GRID.baseline, "baseline"],
    [GRID.descender, "descender"],
  ];
  return (
    <svg viewBox={GRID.viewBox} className="pointer-events-none absolute inset-0 h-full w-full">
      {rows.map(([y, label]) => (
        <g key={label}>
          <line x1="0" y1={y} x2="640" y2={y} stroke="var(--accent)" strokeWidth="1" opacity="0.35" />
          <text x="4" y={y - 5} fill="var(--accent)" fontSize="11" opacity="0.6">{label}</text>
        </g>
      ))}
    </svg>
  );
}

export default function TypeLab() {
  const [weight, setWeight] = useState(13);
  const [duration, setDuration] = useState(1.5);
  const [guides, setGuides] = useState(true);
  const [take, setTake] = useState(0);

  return (
    <main data-theme="ink" className="min-h-[100svh] bg-ink px-6 py-24 text-bone sm:px-10 lg:px-14">
      <p className="type-label section-index mb-10 text-(--muted)">
        Znapy — Signature lettering
      </p>

      {/* Large, for judging the curves. */}
      <div className="relative mx-auto max-w-5xl">
        {guides && <Guides />}
        <ZnapSignature
          key={`a${take}`}
          weight={weight}
          duration={duration}
          className="w-full text-bone"
        />
      </div>

      {/* At the size it will actually be used, beside the caps it has to live with. */}
      <div className="mt-16 border-t border-(--line) pt-12">
        <h1 className="type-display text-[clamp(2.5rem,7vw,5.5rem)] -ml-[0.06em] leading-[0.92]">
          <span className="block">Money should</span>
          <span className="flex items-baseline gap-[0.18em]">
            move in a
            <ZnapSignature
              key={`b${take}`}
              weight={weight}
              duration={duration}
              className="w-[2.9em] translate-y-[0.2em] text-bone"
            />
          </span>
        </h1>
      </div>

      <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-(--radius-panel) border border-(--line-strong) bg-ink/85 px-5 py-3.5 backdrop-blur-xl">
          <label className="flex items-center gap-3">
            <span className="type-label w-14 text-(--faint)">Weight</span>
            <input type="range" min={6} max={26} step={0.5} value={weight}
              onChange={(e) => setWeight(Number(e.target.value))} data-cursor="link"
              className="h-1 w-32 cursor-pointer appearance-none rounded-full bg-(--line-strong) accent-(--accent)" />
            <span className="type-label w-10 text-right text-(--muted)">{weight}</span>
          </label>
          <label className="flex items-center gap-3">
            <span className="type-label w-14 text-(--faint)">Speed</span>
            <input type="range" min={0.6} max={4} step={0.1} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))} data-cursor="link"
              className="h-1 w-32 cursor-pointer appearance-none rounded-full bg-(--line-strong) accent-(--accent)" />
            <span className="type-label w-10 text-right text-(--muted)">{duration.toFixed(1)}s</span>
          </label>
          <button type="button" onClick={() => setTake((n) => n + 1)} data-cursor="link"
            className="type-label rounded-(--radius-chip) bg-signal px-4 py-2 text-bone">
            Replay
          </button>
          <button type="button" onClick={() => setGuides((g) => !g)} data-cursor="link"
            className={`type-label rounded-(--radius-chip) px-4 py-2 transition-colors duration-300 ${
              guides ? "bg-signal text-bone" : "text-(--muted) hover:text-(--fg)"
            }`}>
            Guides
          </button>
        </div>
      </div>
    </main>
  );
}
