"use client";

import dynamic from "next/dynamic";
import {
  Anybody,
  Bricolage_Grotesque,
  Gabarito,
  Michroma,
  Syncopate,
  Syne,
  Tomorrow,
} from "next/font/google";
import { useState } from "react";

const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

/* Declared here rather than in the root layout, so the candidates ship with
   this route and never reach the site's bundle. */
const anybody = Anybody({ subsets: ["latin"], axes: ["wdth"], style: ["normal", "italic"], variable: "--f-anybody" });
const syne = Syne({ subsets: ["latin"], variable: "--f-syne" });
const michroma = Michroma({ subsets: ["latin"], weight: "400", variable: "--f-michroma" });
const tomorrow = Tomorrow({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], style: ["normal", "italic"], variable: "--f-tomorrow" });
const syncopate = Syncopate({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-syncopate" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-bricolage" });
const gabarito = Gabarito({ subsets: ["latin"], variable: "--f-gabarito" });

type Range = { min: number; max: number; step: number };

type Candidate = {
  id: string;
  name: string;
  family: string;
  note: string;
  wght: Range;
  /** Only the variable faces carry a width axis. */
  wdth?: Range;
  italic?: boolean;
  size: number;
  track: number;
  weight: number;
  width: number;
};

const CANDIDATES: Candidate[] = [
  {
    id: "anybody",
    name: "Anybody",
    family: "var(--f-anybody)",
    wght: { min: 300, max: 900, step: 25 },
    wdth: { min: 50, max: 150, step: 2 },
    italic: true,
    weight: 700,
    width: 125,
    size: 1.0,
    track: -0.02,
    note: "A real width axis, from 50 to 150 — the only face here you can stretch. Retro-futurist bones, but continuously adjustable rather than one fixed opinion. Start wide.",
  },
  {
    id: "syne",
    name: "Syne",
    family: "var(--f-syne)",
    wght: { min: 400, max: 800, step: 25 },
    weight: 800,
    width: 100,
    size: 1.0,
    track: -0.03,
    note: "The contemporary art-and-technology face. At ExtraBold the proportions go deliberately strange — narrow round shapes against wide flat ones. Unlike anything else on the page.",
  },
  {
    id: "michroma",
    name: "Michroma",
    family: "var(--f-michroma)",
    wght: { min: 400, max: 400, step: 1 },
    weight: 400,
    width: 100,
    size: 0.82,
    track: -0.03,
    note: "Wide, square and even — futurist without Orbitron's costume. One weight only, so it stands or falls on the size and tracking.",
  },
  {
    id: "tomorrow",
    name: "Tomorrow",
    family: "var(--f-tomorrow)",
    wght: { min: 400, max: 900, step: 100 },
    italic: true,
    weight: 700,
    width: 100,
    size: 1.0,
    track: -0.02,
    note: "Technical, slightly condensed, with a true italic rather than a slanted upright. Turn the italic on — a word meaning speed is allowed to lean.",
  },
  {
    id: "syncopate",
    name: "Syncopate",
    family: "var(--f-syncopate)",
    wght: { min: 400, max: 700, step: 300 },
    weight: 700,
    width: 100,
    size: 0.82,
    track: 0.0,
    note: "Wide and architectural, drawn to be set with air around the letters. Push the tracking positive and it stops being a word and becomes signage.",
  },
  {
    id: "bricolage",
    name: "Bricolage",
    family: "var(--f-bricolage)",
    wght: { min: 300, max: 800, step: 25 },
    weight: 700,
    width: 100,
    size: 1.0,
    track: -0.03,
    note: "A contemporary grotesque with deliberate irregularities — the terminals do not all agree with each other. Modern in a 2026 way rather than a 1970s way.",
  },
  {
    id: "gabarito",
    name: "Gabarito",
    family: "var(--f-gabarito)",
    wght: { min: 400, max: 900, step: 25 },
    weight: 800,
    width: 100,
    size: 1.0,
    track: -0.03,
    note: "Geometric and warm, with flared joins that keep it from reading as another neutral sans. The friendliest of the seven, which suits an onomatopoeia.",
  },
];

type Tweak = { weight: number; width: number; size: number; track: number; italic: boolean; caps: boolean };

const defaults = (c: Candidate): Tweak => ({
  weight: c.weight,
  width: c.width,
  size: c.size,
  track: c.track,
  italic: false,
  caps: false,
});

function Slider({
  label, value, range, format, onChange,
}: {
  label: string;
  value: number;
  range: Range;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="type-label w-16 shrink-0 text-(--faint)">{label}</span>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-cursor="link"
        className="h-1 w-36 cursor-pointer appearance-none rounded-full bg-(--line-strong) accent-(--accent)"
      />
      <span className="type-label w-12 shrink-0 text-right text-(--muted)">
        {format(value)}
      </span>
    </label>
  );
}

export default function TypeLab() {
  const [id, setId] = useState("anybody");
  const [tweaks, setTweaks] = useState<Record<string, Tweak>>({});

  const c = CANDIDATES.find((x) => x.id === id)!;
  const t = tweaks[id] ?? defaults(c);
  const set = (patch: Partial<Tweak>) =>
    setTweaks((prev) => ({ ...prev, [id]: { ...t, ...patch } }));

  const face = {
    fontFamily: c.family,
    fontWeight: t.weight,
    fontStyle: t.italic ? ("italic" as const) : ("normal" as const),
    fontSize: `${t.size}em`,
    letterSpacing: `${t.track}em`,
    textTransform: t.caps ? ("uppercase" as const) : ("none" as const),
    ...(c.wdth ? { fontVariationSettings: `"wdth" ${t.width}` } : {}),
  };

  /* So a choice can be applied to the site verbatim rather than re-guessed. */
  const declaration = [
    `font-family: ${c.name}`,
    `font-weight: ${t.weight}`,
    ...(c.wdth ? [`font-variation-settings: "wdth" ${t.width}`] : []),
    ...(t.italic ? ["font-style: italic"] : []),
    `font-size: ${t.size}em`,
    `letter-spacing: ${t.track}em`,
    ...(t.caps ? ["text-transform: uppercase"] : []),
  ].join("; ");

  return (
    <main
      data-theme="ink"
      className={`${anybody.variable} ${syne.variable} ${michroma.variable} ${tomorrow.variable} ${syncopate.variable} ${bricolage.variable} ${gabarito.variable} relative h-[100svh] min-h-[640px] overflow-hidden bg-ink text-bone`}
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
        {/* Archivo keeps the headline; the candidate carries the last word only. */}
        <h1 className="type-display text-hero -ml-[0.06em] lg:pr-[30%] lg:text-hero-aside">
          <span className="block">Money</span>
          <span className="block">should</span>
          <span className="block">move</span>
          <span className="block">
            in a{" "}
            <span style={face}>
              Znap<span className="text-accent">!</span>
            </span>
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

      <div className="fixed inset-x-0 top-5 z-50 flex flex-col items-center gap-2 px-4">
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

        {/* Two fixed rounds were rejected, so this one is dialled, not picked. */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-(--radius-panel) border border-(--line-strong) bg-ink/85 px-5 py-3.5 backdrop-blur-xl">
          {c.wght.min !== c.wght.max && (
            <Slider
              label="Weight"
              value={t.weight}
              range={c.wght}
              format={String}
              onChange={(v) => set({ weight: v })}
            />
          )}
          {c.wdth && (
            <Slider
              label="Width"
              value={t.width}
              range={c.wdth}
              format={(v) => `${v}`}
              onChange={(v) => set({ width: v })}
            />
          )}
          <Slider
            label="Size"
            value={t.size}
            range={{ min: 0.7, max: 1.25, step: 0.01 }}
            format={(v) => v.toFixed(2)}
            onChange={(v) => set({ size: v })}
          />
          <Slider
            label="Track"
            value={t.track}
            range={{ min: -0.08, max: 0.14, step: 0.005 }}
            format={(v) => v.toFixed(3)}
            onChange={(v) => set({ track: v })}
          />
          <div className="flex items-center gap-1">
            {c.italic && (
              <button
                type="button"
                onClick={() => set({ italic: !t.italic })}
                data-cursor="link"
                className={`type-label rounded-(--radius-chip) px-3.5 py-2 transition-colors duration-300 ${
                  t.italic ? "bg-signal text-bone" : "text-(--muted) hover:text-(--fg)"
                }`}
              >
                Italic
              </button>
            )}
            <button
              type="button"
              onClick={() => set({ caps: !t.caps })}
              data-cursor="link"
              className={`type-label rounded-(--radius-chip) px-3.5 py-2 transition-colors duration-300 ${
                t.caps ? "bg-signal text-bone" : "text-(--muted) hover:text-(--fg)"
              }`}
            >
              Caps
            </button>
            <button
              type="button"
              onClick={() => set(defaults(c))}
              data-cursor="link"
              className="type-label rounded-(--radius-chip) px-3.5 py-2 text-(--faint) transition-colors duration-300 hover:text-(--fg)"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-3xl px-6 text-center">
        <p className="text-[0.8rem] leading-relaxed text-(--muted)">
          <span className="text-(--fg)">{c.name}</span> — {c.note}
        </p>
        <p className="type-label mt-2 text-(--faint)">{declaration}</p>
      </div>
    </main>
  );
}
