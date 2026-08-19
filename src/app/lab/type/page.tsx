"use client";

import dynamic from "next/dynamic";
import {
  Alex_Brush,
  Birthstone,
  Caveat,
  Great_Vibes,
  Mrs_Saint_Delafield,
  Ms_Madi,
  Nothing_You_Could_Do,
  Sacramento,
  Style_Script,
} from "next/font/google";
import { useState } from "react";

const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

/* Declared here rather than in the root layout, so the candidates ship with
   this route and never reach the site's bundle. */
const msMadi = Ms_Madi({ subsets: ["latin"], weight: "400", variable: "--f-msmadi" });
const birthstone = Birthstone({ subsets: ["latin"], weight: "400", variable: "--f-birthstone" });
const alexBrush = Alex_Brush({ subsets: ["latin"], weight: "400", variable: "--f-alexbrush" });
const delafield = Mrs_Saint_Delafield({ subsets: ["latin"], weight: "400", variable: "--f-delafield" });
const caveat = Caveat({ subsets: ["latin"], variable: "--f-caveat" });
const sacramento = Sacramento({ subsets: ["latin"], weight: "400", variable: "--f-sacramento" });
const styleScript = Style_Script({ subsets: ["latin"], weight: "400", variable: "--f-stylescript" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--f-greatvibes" });
const scrawl = Nothing_You_Could_Do({ subsets: ["latin"], weight: "400", variable: "--f-scrawl" });

type Range = { min: number; max: number; step: number };

type Candidate = {
  id: string;
  name: string;
  family: string;
  note: string;
  /** Only Caveat has a weight axis; the rest are single-weight by nature. */
  wght?: Range;
  weight: number;
  size: number;
  rotate: number;
  lift: number;
  lead: number;
  track: number;
};

const CANDIDATES: Candidate[] = [
  {
    id: "msmadi",
    name: "Ms Madi",
    family: "var(--f-msmadi)",
    weight: 400,
    size: 1.52,
    rotate: -4,
    lift: 0.04,
    lead: -0.06,
    track: 0,
    note: "A modern monoline signature — even stroke, no calligraphic contrast. The one most likely to read as a brand rather than a wedding invitation.",
  },
  {
    id: "birthstone",
    name: "Birthstone",
    family: "var(--f-birthstone)",
    weight: 400,
    size: 1.46,
    rotate: -4,
    lift: 0.03,
    lead: -0.06,
    track: 0,
    note: "Contemporary signature script with a little more pen pressure than Ms Madi. Warmer, and the ascenders loop rather than stand.",
  },
  {
    id: "alexbrush",
    name: "Alex Brush",
    family: "var(--f-alexbrush)",
    weight: 400,
    size: 1.5,
    rotate: -5,
    lift: 0.05,
    lead: -0.08,
    track: 0,
    note: "A brush signature laid down in one confident stroke. Thick-to-thin comes from speed rather than a nib, which suits a word meaning speed.",
  },
  {
    id: "delafield",
    name: "Delafield",
    family: "var(--f-delafield)",
    weight: 400,
    size: 1.78,
    rotate: -5,
    lift: 0.06,
    lead: -0.1,
    track: 0,
    note: "The closest thing here to an actual signed name — high contrast, connected, slightly unruly. Needs the most size because its x-height is tiny.",
  },
  {
    id: "caveat",
    name: "Caveat",
    family: "var(--f-caveat)",
    wght: { min: 400, max: 700, step: 25 },
    weight: 700,
    size: 1.16,
    rotate: -3,
    lift: 0.02,
    lead: -0.04,
    track: 0,
    note: "Handwriting rather than calligraphy — a marker, not a pen, and barely connected. Reads as a person wrote it rather than a brand commissioned it.",
  },
  {
    id: "sacramento",
    name: "Sacramento",
    family: "var(--f-sacramento)",
    weight: 400,
    size: 1.44,
    rotate: -3,
    lift: 0.03,
    lead: -0.05,
    track: 0,
    note: "Monoline and quiet, with almost no flourish. The most restrained of the nine — it signs without raising its voice.",
  },
  {
    id: "stylescript",
    name: "Style Script",
    family: "var(--f-stylescript)",
    weight: 400,
    size: 1.38,
    rotate: -4,
    lift: 0.04,
    lead: -0.07,
    track: 0,
    note: "Retro brush, closer to a 1950s shopfront than a signed cheque. Bolder on the page than anything else here, and the least formal.",
  },
  {
    id: "greatvibes",
    name: "Great Vibes",
    family: "var(--f-greatvibes)",
    weight: 400,
    size: 1.56,
    rotate: -4,
    lift: 0.05,
    lead: -0.09,
    track: 0,
    note: "Formal copperplate with full flourishes. Included as the far end — beautiful, and the one most at risk of reading as a certificate.",
  },
  {
    id: "scrawl",
    name: "Scrawl",
    family: "var(--f-scrawl)",
    weight: 400,
    size: 1.2,
    rotate: -2,
    lift: 0.02,
    lead: -0.03,
    track: 0,
    note: "Genuinely scrawled ballpoint — unconnected, uneven, no elegance at all. The most human and the least designed, which is either the point or the problem.",
  },
];

type Tweak = {
  weight: number; size: number; rotate: number;
  lift: number; lead: number; track: number; accent: boolean;
};

const defaults = (c: Candidate): Tweak => ({
  weight: c.weight,
  size: c.size,
  rotate: c.rotate,
  lift: c.lift,
  lead: c.lead,
  track: c.track,
  accent: false,
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
      <span className="type-label w-14 shrink-0 text-(--faint)">{label}</span>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-cursor="link"
        className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-(--line-strong) accent-(--accent)"
      />
      <span className="type-label w-12 shrink-0 text-right text-(--muted)">
        {format(value)}
      </span>
    </label>
  );
}

export default function TypeLab() {
  const [id, setId] = useState("msmadi");
  const [tweaks, setTweaks] = useState<Record<string, Tweak>>({});

  const c = CANDIDATES.find((x) => x.id === id)!;
  const t = tweaks[id] ?? defaults(c);
  const set = (patch: Partial<Tweak>) =>
    setTweaks((prev) => ({ ...prev, [id]: { ...t, ...patch } }));

  /* Rotation needs a block box, and the em nudges then scale with the word
     rather than with the headline — which is what you want when resizing. */
  const face = {
    fontFamily: c.family,
    fontWeight: t.weight,
    fontSize: `${t.size}em`,
    letterSpacing: `${t.track}em`,
    textTransform: "none" as const,
    display: "inline-block" as const,
    marginLeft: `${t.lead}em`,
    transform: `translateY(${t.lift}em) rotate(${t.rotate}deg)`,
  };

  /* So a choice can be applied to the site verbatim rather than re-guessed. */
  const declaration = [
    `font-family: ${c.name}`,
    ...(c.wght ? [`font-weight: ${t.weight}`] : []),
    `font-size: ${t.size}em`,
    ...(t.track ? [`letter-spacing: ${t.track}em`] : []),
    `margin-left: ${t.lead}em`,
    `transform: translateY(${t.lift}em) rotate(${t.rotate}deg)`,
  ].join("; ");

  return (
    <main
      data-theme="ink"
      className={`${msMadi.variable} ${birthstone.variable} ${alexBrush.variable} ${delafield.variable} ${caveat.variable} ${sacramento.variable} ${styleScript.variable} ${greatVibes.variable} ${scrawl.variable} relative h-[100svh] min-h-[640px] overflow-hidden bg-ink text-bone`}
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
          {/* The site clips this line for the reveal, so the lab clips it too —
              a script that overflows here would overflow there. The padding
              grows the mask around the script's ascender and descender; the
              negative margin puts the line back where it was, so the reveal
              still slides up from a mask edge that sits on the baseline. */}
          <span className="-my-[0.34em] block overflow-hidden py-[0.34em]">
            in a
            <span style={face}>
              Znap<span className={t.accent ? undefined : "text-accent"}>!</span>
            </span>
          </span>
        </h1>

        <div className="mt-6 flex flex-col gap-8 border-t border-(--line) pt-7 md:flex-row md:items-end md:justify-between">
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
                className={`type-label rounded-[calc(var(--radius-panel)-6px)] px-3.5 py-2.5 transition-colors duration-300 ${
                  on ? "bg-signal text-bone" : "text-(--muted) hover:text-(--fg)"
                }`}
              >
                {x.name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-(--radius-panel) border border-(--line-strong) bg-ink/85 px-5 py-3.5 backdrop-blur-xl">
          {c.wght && (
            <Slider label="Weight" value={t.weight} range={c.wght}
              format={String} onChange={(v) => set({ weight: v })} />
          )}
          <Slider label="Size" value={t.size} range={{ min: 0.9, max: 2.3, step: 0.02 }}
            format={(v) => v.toFixed(2)} onChange={(v) => set({ size: v })} />
          {/* A signature is never perfectly level. */}
          <Slider label="Angle" value={t.rotate} range={{ min: -12, max: 4, step: 0.5 }}
            format={(v) => `${v}°`} onChange={(v) => set({ rotate: v })} />
          <Slider label="Lift" value={t.lift} range={{ min: -0.2, max: 0.2, step: 0.01 }}
            format={(v) => v.toFixed(2)} onChange={(v) => set({ lift: v })} />
          {/* Signatures do not respect the box they are given. */}
          <Slider label="Tuck" value={t.lead} range={{ min: -0.35, max: 0.15, step: 0.01 }}
            format={(v) => v.toFixed(2)} onChange={(v) => set({ lead: v })} />
          <Slider label="Track" value={t.track} range={{ min: -0.04, max: 0.1, step: 0.005 }}
            format={(v) => v.toFixed(3)} onChange={(v) => set({ track: v })} />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => set({ accent: !t.accent })}
              data-cursor="link"
              className={`type-label rounded-(--radius-chip) px-3.5 py-2 transition-colors duration-300 ${
                t.accent ? "bg-signal text-bone" : "text-(--muted) hover:text-(--fg)"
              }`}
            >
              Plain !
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
