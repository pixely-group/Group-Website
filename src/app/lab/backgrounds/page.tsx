"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import BackgroundLab, {
  LAB_VARIANTS,
  type LabVariant,
} from "@/components/three/BackgroundLab";
import RotatingWord from "@/components/ui/RotatingWord";

const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

/**
 * A place to look at background candidates in the frame they have to work in,
 * rather than describing them and hoping. The headline, the closing row and
 * the real device are all here at the hero's own sizes, so what you see is
 * what the hero would be — which only holds while the copy here is the copy
 * Hero.tsx ships, so it is kept in step with it.
 */
export default function BackgroundsLab() {
  const [variant, setVariant] = useState<LabVariant>("aurora");
  const current = LAB_VARIANTS.find((v) => v.id === variant)!;

  return (
    <main
      data-theme="ink"
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-ink text-bone"
    >
      <BackgroundLab variant={variant} />

      {/* The same scrim the hero uses, so legibility is judged fairly. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[6] bg-[radial-gradient(150%_115%_at_10%_86%,rgba(10,10,11,0.97)_0%,rgba(10,10,11,0.82)_30%,rgba(10,10,11,0.4)_52%,transparent_76%)]"
      />

      <div className="absolute top-[88px] right-[13.6%] bottom-[164px] z-20 hidden items-center lg:flex">
        <HeroDevice shift={28} className="h-full max-h-[560px]" />
      </div>

      <div className="relative z-30 flex h-full flex-col justify-end px-6 pb-9 sm:px-10 lg:px-14">
        <p className="type-label section-index mb-7 text-(--muted)">
          Pixely — Financial infrastructure for Algeria
        </p>
        <h1 className="type-display text-hero -ml-[0.06em] lg:pr-[30%] lg:text-hero-aside">
          <span className="block">AI-powered</span>
          <span className="block">fintech</span>
          <span className="block">platform</span>
          <span className="block">
            for <RotatingWord className="type-serif-inherit text-signal normal-case" />
          </span>
        </h1>

        <div className="mt-10 flex flex-col gap-8 border-t border-(--line) pt-7 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-[0.95rem] leading-relaxed text-(--muted)">
            Pixely combines payments, digital identity and artificial
            intelligence into one platform — secure transactions, trusted
            verification and intelligent financial services, built for Algeria.
          </p>
          <p className="type-label hidden leading-relaxed text-(--faint) sm:block md:text-right">
            Financial inclusion
            <br />
            Intelligent innovation
            <br />
            Trust &amp; security
          </p>
        </div>
      </div>

      {/* — Picker */}
      <div className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-(--radius-panel) border border-(--line-strong) bg-ink/85 p-1.5 backdrop-blur-xl">
          {LAB_VARIANTS.map((v) => {
            const on = v.id === variant;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariant(v.id)}
                data-cursor="link"
                className={`type-label rounded-[calc(var(--radius-panel)-6px)] px-4 py-2.5 transition-colors duration-300 ${
                  on ? "bg-signal text-bone" : "text-(--muted) hover:text-(--fg)"
                }`}
              >
                {v.name}
              </button>
            );
          })}
        </div>
      </div>

      <p className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-xl px-6 text-center text-[0.8rem] leading-relaxed text-(--muted)">
        <span className="text-(--fg)">{current.name}</span> — {current.note}
      </p>
    </main>
  );
}
