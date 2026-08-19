"use client";

import dynamic from "next/dynamic";
import {
  Chakra_Petch,
  Orbitron,
  Sora,
  Space_Grotesk,
  Unbounded,
} from "next/font/google";
import { useState } from "react";

const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

/* Declared here rather than in the root layout, so the candidates ship with
   this route and never reach the site's bundle. */
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--f-grotesk" });
const chakra = Chakra_Petch({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--f-chakra" });
const sora = Sora({ subsets: ["latin"], variable: "--f-sora" });
const unbounded = Unbounded({ subsets: ["latin"], variable: "--f-unbounded" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--f-orbitron" });

type Candidate = {
  id: string;
  name: string;
  family: string;
  note: string;
  weight: number;
  /** x-heights differ enough that 1em would compare metrics, not shapes. */
  scale: number;
  tracking: string;
};

const CANDIDATES: Candidate[] = [
  {
    id: "mono",
    name: "Plex Mono",
    family: "var(--font-plex-mono)",
    weight: 500,
    scale: 0.92,
    tracking: "-0.02em",
    note: "Already in the system as the machine voice — every micro-label on the site is set in it, and it costs nothing to add. The one word the sentence is about, set in the typeface the machine speaks in.",
  },
  {
    id: "grotesk",
    name: "Space Grotesk",
    family: "var(--f-grotesk)",
    weight: 700,
    scale: 1.0,
    tracking: "-0.03em",
    note: "The current default for technology brands, and deservedly so: geometric underneath with just enough irregularity in the g and the a to not read as generic. Modern without costume.",
  },
  {
    id: "chakra",
    name: "Chakra Petch",
    family: "var(--f-chakra)",
    weight: 700,
    scale: 1.0,
    tracking: "-0.01em",
    note: "Squared terminals and clipped corners — an instrument-panel feel without going full science fiction. The most overtly technical of the five that still behaves as text.",
  },
  {
    id: "sora",
    name: "Sora",
    family: "var(--f-sora)",
    weight: 700,
    scale: 0.98,
    tracking: "-0.03em",
    note: "Drawn for technology products specifically. Cleaner and more even than Space Grotesk, with a wider aperture — confident rather than characterful.",
  },
  {
    id: "unbounded",
    name: "Unbounded",
    family: "var(--f-unbounded)",
    weight: 700,
    scale: 0.9,
    tracking: "-0.04em",
    note: "Contemporary display, very wide and very present. Reads as a brand mark rather than a word, which may be exactly right for the one word carrying the name.",
  },
  {
    id: "orbitron",
    name: "Orbitron",
    family: "var(--f-orbitron)",
    weight: 700,
    scale: 0.88,
    tracking: "-0.02em",
    note: "The far end, included for calibration. Unmistakably futuristic and unmistakably a costume — worth seeing so you know where the line is, even if it sits past it.",
  },
];

export default function TypeLab() {
  const [id, setId] = useState("grotesk");
  const c = CANDIDATES.find((x) => x.id === id)!;

  const face = {
    fontFamily: c.family,
    fontWeight: c.weight,
    fontStyle: "normal" as const,
    letterSpacing: c.tracking,
    textTransform: "none" as const,
  };

  return (
    <main
      data-theme="ink"
      className={`${grotesk.variable} ${chakra.variable} ${sora.variable} ${unbounded.variable} ${orbitron.variable} relative h-[100svh] min-h-[640px] overflow-hidden bg-ink text-bone`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_78%_38%,rgba(45,70,255,0.20),transparent_62%)]"
      />

      <div className="absolute top-[88px] right-[12.4%] bottom-[192px] z-20 hidden items-center lg:flex">
        <HeroDevice shift={24} className="h-full max-h-[620px]" />
      </div>

      <div className="relative z-30 flex h-full flex-col justify-end px-6 pb-9 sm:px-10 lg:px-14">
        <p className="type-label section-index mb-7 text-(--muted)">
          Znapy — Financial infrastructure
        </p>
        <h1 className="type-display text-hero -ml-[0.06em] lg:pr-[30%] lg:text-hero-aside">
          <span className="block">Money</span>
          <span className="block">should</span>
          <span className="block">move</span>
          <span className="block">
            in a{" "}
            <span style={{ ...face, fontSize: `${c.scale}em` }}>Znap</span>
            <span className="text-accent">!</span>
          </span>
        </h1>

        <div className="mt-10 flex flex-col gap-8 border-t border-(--line) pt-7 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-[0.95rem] leading-relaxed text-(--muted)">
            Znapy is the settlement layer for companies that operate at internet
            speed — money that arrives in milliseconds, in any currency,
            governed entirely by code.
          </p>
          <p className="type-label hidden leading-relaxed text-(--faint) sm:block md:text-right">
            142 currencies
            <br />
            99.995% uptime
            <br />
            24/7/365 settlement
          </p>
        </div>
      </div>

      <div className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-(--radius-panel) border border-(--line-strong) bg-ink/85 p-1.5 backdrop-blur-xl">
          {CANDIDATES.map((x) => {
            const on = x.id === id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => setId(x.id)}
                data-cursor="link"
                className={`type-label rounded-[calc(var(--radius-panel)-6px)] px-4 py-2.5 transition-colors duration-300 ${
                  on ? "bg-signal text-bone" : "text-(--muted) hover:text-(--fg)"
                }`}
              >
                {x.name}
              </button>
            );
          })}
        </div>

      </div>

      <p className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-2xl px-6 text-center text-[0.8rem] leading-relaxed text-(--muted)">
        <span className="text-(--fg)">{c.name}</span> — {c.note}
      </p>
    </main>
  );
}
