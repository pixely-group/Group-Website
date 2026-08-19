"use client";

import dynamic from "next/dynamic";
import {
  Bodoni_Moda,
  DM_Serif_Display,
  Fraunces,
  Instrument_Serif,
  Playfair_Display,
} from "next/font/google";
import { useState } from "react";

const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

/* Declared here rather than in the root layout, so the candidates ship with
   this page alone and never reach the site's own bundle. */
const fraunces = Fraunces({ subsets: ["latin"], style: ["italic"], variable: "--f-fraunces" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["italic"], variable: "--f-instrument" });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic"], variable: "--f-playfair" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", style: ["italic"], variable: "--f-dm" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["italic"], variable: "--f-bodoni" });

type Candidate = {
  id: string;
  name: string;
  family: string;
  note: string;
  /** Fraunces alone has axes worth setting; the rest ignore this. */
  variation?: string;
  /** Optical size differs enough between these to need trimming by eye. */
  scale: number;
};

const CANDIDATES: Candidate[] = [
  {
    id: "fraunces",
    name: "Fraunces",
    family: "var(--f-fraunces)",
    variation: '"opsz" 144, "SOFT" 0, "WONK" 1',
    scale: 1.02,
    note: "What is on the site. Drawn rather than set — the WONK axis gives it the single-storey forms that stop it reading as a generic italic beside Archivo.",
  },
  {
    id: "instrument",
    name: "Instrument Serif",
    family: "var(--f-instrument)",
    scale: 1.1,
    note: "What you had before. Narrower and quieter, with high contrast and a long elegant tail. Recedes more; lets the caps around it lead.",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    family: "var(--f-playfair)",
    scale: 1.0,
    note: "The familiar editorial choice. Sharp brackets, strong vertical stress. Handsome and very legible at size, but the most-used serif on the web.",
  },
  {
    id: "dm",
    name: "DM Serif Display",
    family: "var(--f-dm)",
    scale: 1.0,
    note: "Heavier and more solid. Holds its weight against the caps rather than contrasting with them — the word reads as part of the line, not an aside.",
  },
  {
    id: "bodoni",
    name: "Bodoni Moda",
    family: "var(--f-bodoni)",
    scale: 1.06,
    note: "A true Didone: hairline joins against thick stems, unmodulated. The most dramatic of the five, and the most fragile at small sizes.",
  },
];

export default function TypeLab() {
  const [id, setId] = useState("fraunces");
  const current = CANDIDATES.find((c) => c.id === id)!;

  return (
    <main
      data-theme="ink"
      className={`${fraunces.variable} ${instrument.variable} ${playfair.variable} ${dmSerif.variable} ${bodoni.variable} relative h-[100svh] min-h-[640px] overflow-hidden bg-ink text-bone`}
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
            <em
              className="font-normal"
              style={{
                fontFamily: current.family,
                fontStyle: "italic",
                fontSize: `${current.scale}em`,
                fontVariationSettings: current.variation,
                textTransform: "none",
              }}
            >
              Znap
            </em>
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
          {CANDIDATES.map((c) => {
            const on = c.id === id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setId(c.id)}
                data-cursor="link"
                className={`type-label rounded-[calc(var(--radius-panel)-6px)] px-4 py-2.5 transition-colors duration-300 ${
                  on ? "bg-signal text-bone" : "text-(--muted) hover:text-(--fg)"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <p className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-2xl px-6 text-center text-[0.8rem] leading-relaxed text-(--muted)">
        <span className="text-(--fg)">{current.name}</span> — {current.note}
      </p>
    </main>
  );
}
