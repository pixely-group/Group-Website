"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

const LAYERS = [
  {
    index: "L1",
    name: "Application",
    spec: "Your product · scoped API keys · mTLS",
    note: "Every call is signed, scoped and replay-protected.",
  },
  {
    index: "L2",
    name: "Identity",
    spec: "KYB · beneficial ownership · device binding",
    note: "Who is asking, proven before anything is asked.",
  },
  {
    index: "L3",
    name: "Policy",
    spec: "Limits · allowlists · n-of-m approvals",
    note: "What they may do, evaluated in under a millisecond.",
  },
  {
    index: "L4",
    name: "Ledger",
    spec: "Append-only · hash-linked · dual control",
    note: "What actually happened, in a record nobody can edit.",
  },
  {
    index: "L5",
    name: "Rails",
    spec: "Fedwire · SEPA · RTP · FPS · book transfer",
    note: "Where value finally settles, under our own memberships.",
  },
] as const;

/** Isometric plate geometry — a 2:1 diamond per layer. */
const HW = 168;
const HH = 84;
const GAP = 82;
const CX = 210;
const TOP = 96;
const VB_W = 620;
const VB_H = TOP + HH + GAP * (LAYERS.length - 1) + HH + 40;

const layerY = (i: number) => TOP + i * GAP;

function diamond(cx: number, cy: number, hw: number, hh: number) {
  return `${cx - hw},${cy} ${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh}`;
}

export default function SecurityArchitecture() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeLayer, setActiveLayer] = useState(0);
  // A layer the reader has chosen. While one is held the descending request
  // stops driving the highlight, so their selection is not overwritten a
  // moment later. Read from a ref inside the timeline, which outlives renders.
  const [pinned, setPinned] = useState<number | null>(null);
  const pinnedRef = useRef<number | null>(null);

  const selectLayer = (i: number) => {
    const next = pinnedRef.current === i ? null : i;
    pinnedRef.current = next;
    setPinned(next);
    setActiveLayer(next ?? i);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const plates = section.querySelectorAll("[data-plate]");
      const beam = section.querySelector("[data-beam]");
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Plates assemble as the section arrives.
        gsap.from(plates, {
          opacity: 0,
          y: 46,
          duration: 1.1,
          stagger: 0.09,
          ease: "expo.out",
          scrollTrigger: { trigger: section, start: "top 72%" },
        });

        // Exploded view: the stack separates slightly as you scroll past.
        plates.forEach((plate, i) => {
          gsap.to(plate, {
            y: (i - (LAYERS.length - 1) / 2) * 26,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top 60%",
              end: "bottom 40%",
              scrub: 0.6,
            },
          });
        });

        // The request travels with the scroll rather than looping on its
        // own: scrubbed against the section, so it descends as you read down
        // and climbs back if you scroll up.
        if (!beam) return;
        const travelFrom = layerY(0) - HH;
        const travelTo = layerY(LAYERS.length - 1) + HH;

        const nearestLayer = (cy: number) => {
          let best = 0;
          let bestGap = Infinity;
          LAYERS.forEach((_, i) => {
            const gap = Math.abs(cy - layerY(i));
            if (gap < bestGap) {
              bestGap = gap;
              best = i;
            }
          });
          return best;
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 72%",
            end: "bottom 28%",
            scrub: 0.6,
          },
        });

        tl.fromTo(
          beam,
          { attr: { cy: travelFrom }, opacity: 0 },
          {
            attr: { cy: travelTo },
            opacity: 1,
            duration: 1,
            ease: "none",
            onUpdate: () => {
              // Read the beam itself, so the highlight follows the smoothed
              // position rather than the raw scroll value.
              const cy = Number(gsap.getProperty(beam, "cy"));
              if (pinnedRef.current === null) setActiveLayer(nearestLayer(cy));
            },
          },
          0,
        );
        // Only the ends fade; the middle of the run stays lit.
        tl.to(beam, { opacity: 1, duration: 0.06, ease: "none" }, 0);
        tl.to(beam, { opacity: 0, duration: 0.06, ease: "none" }, 0.94);

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="security"
      data-theme="bone"
      className="relative bg-theme px-6 py-[16vh] text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="type-label section-index mb-6 text-(--muted)">
              04 — Security
            </p>
            <h2 className="type-headline text-big max-w-[15ch] text-balance">
              Five layers stand between intent and settlement.
            </h2>
          </div>
          <p className="max-w-sm pb-2 text-[0.95rem] leading-relaxed text-(--muted)">
            Security here is structural, not a feature. A payment crosses every
            layer in order, and any layer can refuse — in about the time it
            takes to render this sentence.
          </p>
        </div>

        <p className="type-label mt-10 text-(--faint)">
          Select a layer to hold it
        </p>

        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-6">
          {/* — The stack */}
          <div className="relative">
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className="w-full"
              role="img"
              aria-label="Isometric diagram: application, identity, policy, ledger and rails layers stacked in order"
            >
              <defs>
                <pattern
                  id="sec-hatch"
                  width="7"
                  height="7"
                  patternTransform="rotate(45)"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="7"
                    stroke="currentColor"
                    strokeWidth="0.6"
                    opacity="0.28"
                  />
                </pattern>
              </defs>

              {/* spine */}
              <line
                x1={CX}
                y1={layerY(0) - HH - 18}
                x2={CX}
                y2={layerY(LAYERS.length - 1) + HH + 20}
                stroke="currentColor"
                strokeOpacity="0.22"
                strokeDasharray="3 5"
              />

              {LAYERS.map((layer, i) => {
                const cy = layerY(i);
                const on = activeLayer === i;
                return (
                  <g key={layer.name} data-plate>
                    {/* side wall, gives the plate thickness */}
                    <path
                      d={`M ${CX - HW} ${cy} L ${CX} ${cy + HH} L ${CX + HW} ${cy} L ${CX + HW} ${cy + 11} L ${CX} ${cy + HH + 11} L ${CX - HW} ${cy + 11} Z`}
                      fill="currentColor"
                      fillOpacity={on ? 0.14 : 0.07}
                      className="transition-[fill-opacity] duration-500"
                    />
                    <polygon
                      points={diamond(CX, cy, HW, HH)}
                      fill="url(#sec-hatch)"
                      fillOpacity={on ? 0.9 : 0.34}
                      className="transition-[fill-opacity] duration-500"
                    />
                    <polygon
                      points={diamond(CX, cy, HW, HH)}
                      fill="none"
                      stroke={on ? "#2d46ff" : "currentColor"}
                      strokeOpacity={on ? 1 : 0.42}
                      strokeWidth={on ? 1.6 : 1}
                      className="transition-all duration-500"
                    />
                    {/* inner iso guides */}
                    <polygon
                      points={diamond(CX, cy, HW * 0.52, HH * 0.52)}
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity="0.2"
                    />
                    {/* leader line out to the label column */}
                    <line
                      x1={CX + HW}
                      y1={cy}
                      x2={VB_W - 34}
                      y2={cy - 26}
                      stroke={on ? "#2d46ff" : "currentColor"}
                      strokeOpacity={on ? 0.95 : 0.38}
                      strokeWidth={on ? 1.4 : 1}
                      className="transition-all duration-500"
                    />
                    <text
                      x={VB_W - 4}
                      y={cy - 31}
                      textAnchor="end"
                      fontSize="13"
                      fill={on ? "#2d46ff" : "currentColor"}
                      fillOpacity={on ? 1 : 0.5}
                      fontFamily="var(--font-mono)"
                      letterSpacing="1.6"
                      className="transition-all duration-500"
                    >
                      {layer.index}
                    </text>
                  </g>
                );
              })}

              <circle
                data-beam
                cx={CX}
                cy={layerY(0) - HH}
                r="5.5"
                fill="#2d46ff"
                opacity="0"
              />
            </svg>
          </div>

          {/* — The register */}
          <ol className="relative">
            {LAYERS.map((layer, i) => {
              const on = activeLayer === i;
              return (
                <li key={layer.name} className="border-t border-(--line) last:border-b">
                  <button
                    type="button"
                    onClick={() => selectLayer(i)}
                    aria-current={on ? "true" : undefined}
                    data-cursor="link"
                    className={`group grid w-full grid-cols-[3.2rem_1fr] gap-4 py-5 text-left transition-opacity duration-500 ${
                      on ? "opacity-100" : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    <span
                      className={`type-label flex items-start gap-1.5 pt-1 transition-colors duration-500 ${
                        on ? "text-accent" : "text-(--faint) group-hover:text-accent"
                      }`}
                    >
                      {layer.index}
                      {pinned === i && (
                        <span
                          aria-hidden
                          className="mt-px inline-block size-1 rotate-45 bg-accent"
                        />
                      )}
                    </span>
                    <div>
                      <h3 className="text-[1.05rem] font-semibold tracking-[-0.01em] transition-colors duration-300 group-hover:text-accent">
                        {layer.name}
                      </h3>
                      <p className="mt-1.5 text-[0.9rem] leading-relaxed text-(--muted)">
                        {layer.note}
                      </p>
                      <p className="type-label mt-3 text-(--faint)">
                        {layer.spec}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <ul className="mt-14 flex flex-wrap gap-x-10 gap-y-3 border-t border-(--line) pt-6">
          {[
            "SOC 2 Type II",
            "PCI DSS Level 1",
            "ISO 27001",
            "GDPR · DPF",
            "Funds held at Tier-1 custodians",
          ].map((item) => (
            <li key={item} className="type-label text-(--faint)">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
