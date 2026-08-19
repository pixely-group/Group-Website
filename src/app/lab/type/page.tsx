"use client";

import { useState } from "react";
import ZnapSignature, { GRID, HAND_LIST, type Hand } from "@/components/ui/ZnapSignature";

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
          <line x1="0" y1={y} x2="760" y2={y} stroke="var(--accent)" strokeWidth="1" opacity="0.3" />
          <text x="4" y={y - 5} fill="var(--accent)" fontSize="11" opacity="0.55">{label}</text>
        </g>
      ))}
    </svg>
  );
}

export default function TypeLab() {
  const [slant, setSlant] = useState(0);
  const [scale, setScale] = useState(1);
  const [duration, setDuration] = useState(1.5);
  const [guides, setGuides] = useState(false);
  const [take, setTake] = useState(0);

  return (
    <main data-theme="ink" className="min-h-[100svh] bg-ink px-6 pt-16 pb-40 text-bone sm:px-10 lg:px-14">
      <p className="type-label section-index mb-3 text-(--muted)">
        Znapy — Signature lettering
      </p>
      <p className="mb-12 max-w-xl text-[0.9rem] leading-relaxed text-(--muted)">
        Four hands, all drawn rather than set. Same animation on each — the word
        is one unbroken stroke and writes itself, then the mark follows.
      </p>

      <div className="space-y-14">
        {HAND_LIST.map((h) => (
          <section key={h.id}>
            <div className="mb-2 flex items-baseline gap-4">
              <span className="type-label text-(--fg)">{h.label}</span>
              <span className="text-[0.82rem] text-(--muted)">{h.note}</span>
            </div>
            <div className="relative max-w-4xl">
              {guides && <Guides />}
              <ZnapSignature
                key={`${h.id}-${take}`}
                hand={h.id as Hand}
                weight={h.weight * scale}
                slant={slant}
                duration={duration}
                className="w-full text-bone"
              />
            </div>
          </section>
        ))}
      </div>

      {/* At the size it is actually used, against the caps it has to live with. */}
      <div className="mt-20 border-t border-(--line) pt-12">
        <p className="type-label mb-6 text-(--faint)">In place, at size</p>
        {HAND_LIST.map((h) => (
          <h1 key={h.id} className="type-display mb-4 -ml-[0.06em] text-[clamp(2rem,5vw,3.6rem)] leading-[0.95]">
            move in a{" "}
            <span className="relative -ml-[0.22em] inline-block h-[0.8em] w-[3.4em] align-baseline">
              <ZnapSignature
                key={`${h.id}-inline-${take}`}
                hand={h.id as Hand}
                weight={h.weight * scale}
                slant={slant}
                duration={duration}
                className="absolute bottom-[-0.51em] left-0 w-full"
              />
            </span>
          </h1>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-(--radius-panel) border border-(--line-strong) bg-ink/85 px-5 py-3.5 backdrop-blur-xl">
          <label className="flex items-center gap-3">
            <span className="type-label w-14 text-(--faint)">Weight</span>
            <input type="range" min={0.5} max={1.8} step={0.05} value={scale}
              onChange={(e) => setScale(Number(e.target.value))} data-cursor="link"
              className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-(--line-strong) accent-(--accent)" />
            <span className="type-label w-10 text-right text-(--muted)">{scale.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-3">
            <span className="type-label w-14 text-(--faint)">Slant</span>
            <input type="range" min={-6} max={16} step={0.5} value={slant}
              onChange={(e) => setSlant(Number(e.target.value))} data-cursor="link"
              className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-(--line-strong) accent-(--accent)" />
            <span className="type-label w-10 text-right text-(--muted)">{slant}°</span>
          </label>
          <label className="flex items-center gap-3">
            <span className="type-label w-14 text-(--faint)">Speed</span>
            <input type="range" min={0.6} max={4} step={0.1} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))} data-cursor="link"
              className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-(--line-strong) accent-(--accent)" />
            <span className="type-label w-10 text-right text-(--muted)">{duration.toFixed(1)}s</span>
          </label>
          <button type="button" onClick={() => setTake((n) => n + 1)} data-cursor="link"
            className="type-label rounded-(--radius-chip) bg-signal px-4 py-2 text-bone">
            Replay all
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
