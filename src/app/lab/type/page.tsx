"use client";

import { useState } from "react";
import ZnapDots from "@/components/ui/ZnapDots";

export default function TypeLab() {
  const [weight, setWeight] = useState(1.35);
  const [duration, setDuration] = useState(1.4);
  const [scatter, setScatter] = useState(0.35);
  const [take, setTake] = useState(0);

  return (
    <main data-theme="ink" className="min-h-[100svh] bg-ink px-6 py-16 text-bone sm:px-10 lg:px-14">
      <p className="type-label section-index mb-3 text-(--muted)">Pixely — Bitcount</p>
      <p className="mb-14 max-w-xl text-[0.9rem] leading-relaxed text-(--muted)">
        The dots are read out of the font itself, then drawn and animated one at
        a time — left to right, jittered so it reads as dots coming on rather
        than as a wipe.
      </p>

      <div className="text-[clamp(3rem,12vw,9rem)] leading-none">
        <ZnapDots key={`big-${take}`} width={3.4} weight={weight} duration={duration} scatter={scatter} />
      </div>

      <div className="mt-24 border-t border-(--line) pt-12">
        <p className="type-label mb-6 text-(--faint)">In place, at size</p>
        <h1 className="type-display -ml-[0.06em] text-[clamp(2rem,5vw,3.6rem)] leading-[0.95]">
          move in a{" "}
          <ZnapDots key={`inline-${take}`} weight={weight} duration={duration} scatter={scatter} className="align-baseline" />
        </h1>
      </div>

      <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-(--radius-panel) border border-(--line-strong) bg-ink/85 px-5 py-3.5 backdrop-blur-xl">
          {([["Dot", weight, setWeight, 0.6, 2.4, 0.05],
             ["Speed", duration, setDuration, 0.4, 4, 0.1],
             ["Scatter", scatter, setScatter, 0, 1, 0.05]] as const).map(([label, val, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-3">
              <span className="type-label w-14 text-(--faint)">{label}</span>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={(e) => (set as (n: number) => void)(Number(e.target.value))} data-cursor="link"
                className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-(--line-strong) accent-(--accent)" />
              <span className="type-label w-10 text-right text-(--muted)">{val.toFixed(2)}</span>
            </label>
          ))}
          <button type="button" onClick={() => setTake((n) => n + 1)} data-cursor="link"
            className="type-label rounded-(--radius-chip) bg-signal px-4 py-2 text-bone">
            Replay
          </button>
        </div>
      </div>
    </main>
  );
}
