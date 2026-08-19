"use client";

import { useEffect, useRef, useState } from "react";
import { CURSOR_DOT_LINK_PX } from "@/components/chrome/CustomCursor";
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
  const pinnedRef = useRef<number | null>(null);
  const beamElRef = useRef<SVGCircleElement | null>(null);
  // Where the scroll says the request should be. The timeline drives this
  // rather than the element, so a held selection can take the element over
  // without the scrub being disabled and left stale.
  const beamPos = useRef({ cy: 0, opacity: 0 });
  /** What is actually drawn. It eases toward the scroll's value every frame,
   *  so control can change hands without the request ever teleporting. */
  const beamRender = useRef({ cy: 0 });
  const registerRef = useRef<HTMLOListElement>(null);
  const registerDotRef = useRef<HTMLSpanElement>(null);
  const registerDotPlaced = useRef(false);
  /** Armed a moment after a selection, so the ticks that immediately follow
   *  a click cannot cancel it before the request has arrived. */
  const releaseArmed = useRef(true);

  const selectLayer = (i: number) => {
    const next = pinnedRef.current === i ? null : i;
    pinnedRef.current = next;
    releaseArmed.current = false;
    window.setTimeout(() => {
      releaseArmed.current = true;
    }, 400);
    setActiveLayer(next ?? i);

    if (next === null) {
      // Nothing to animate: the per-frame ease resumes from where the
      // request already is and carries it back to the scroll's position.
      return;
    }
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    gsap.to(beamRender.current, {
      cy: layerY(next),
      duration: reduced ? 0 : 0.6,
      ease: "expo.out",
      overwrite: true,
    });
  };

  // One marker that travels down the register to whichever layer is
  // current — the same idea as the nav's, at the same size as the cursor's
  // own dot so the two read as one language.
  useEffect(() => {
    const ol = registerRef.current;
    const dot = registerDotRef.current;
    if (!ol || !dot) return;
    const heading = ol.querySelectorAll("h3")[activeLayer];
    if (!heading) return;

    const olBox = ol.getBoundingClientRect();
    const box = heading.getBoundingClientRect();
    const y = box.top - olBox.top + box.height / 2 - CURSOR_DOT_LINK_PX / 2;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (registerDotPlaced.current && !reduced) {
      gsap.to(dot, { y, opacity: 1, duration: 0.45, ease: "expo.out", overwrite: true });
    } else {
      gsap.set(dot, { y });
      gsap.to(dot, { opacity: 1, duration: reduced ? 0 : 0.25, overwrite: true });
    }
    registerDotPlaced.current = true;
  }, [activeLayer]);

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

        // Triggered on the diagram, not the section: anchored to the section
        // the request began travelling while only the heading was on screen,
        // so most of its journey happened out of sight.
        const stack = section.querySelector("[data-stack]") ?? section;
        beamPos.current.cy = travelFrom;
        beamRender.current.cy = travelFrom;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stack,
            start: "top 70%",
            end: "bottom 30%",
            scrub: 0.6,
          },
        });

        // The scrub only moves the target. Nothing writes to the circle here.
        tl.to(
          beamPos.current,
          {
            cy: travelTo,
            duration: 1,
            ease: "none",
            onUpdate: () => {
              const t = tl.progress();
              const fade = 0.06;
              beamPos.current.opacity =
                t < fade
                  ? t / fade
                  : t > 1 - fade
                    ? Math.max(0, (1 - t) / fade)
                    : 1;
            },
          },
          0,
        );

        // One writer, every frame. Because the drawn value only ever eases
        // toward its target, releasing a held layer rejoins the scroll from
        // where the request is rather than jumping to where the scroll got
        // to while it was held.
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        let lastIndex = -1;
        const draw = () => {
          // A held layer is being tweened directly; leave it alone.
          if (pinnedRef.current === null) {
            const gap = beamPos.current.cy - beamRender.current.cy;
            beamRender.current.cy += reduced ? gap : gap * 0.12;
          }
          gsap.set(beam, {
            attr: { cy: beamRender.current.cy },
            opacity: beamPos.current.opacity,
          });
          const i = nearestLayer(beamRender.current.cy);
          if (i !== lastIndex) {
            lastIndex = i;
            setActiveLayer(i);
          }
        };
        gsap.ticker.add(draw);

        // Genuine scrolling hands control back. Guarded by a moment's grace
        // so the ticks that follow a click cannot cancel it before the
        // request has even arrived.
        const releaseOnScroll = () => {
          if (pinnedRef.current === null || !releaseArmed.current) return;
          pinnedRef.current = null;
        };
        window.addEventListener("scroll", releaseOnScroll, { passive: true });

        return () => {
          gsap.ticker.remove(draw);
          window.removeEventListener("scroll", releaseOnScroll);
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
          <div data-stack className="relative">
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
                  <g
                    key={layer.name}
                    data-plate
                    onClick={() => selectLayer(i)}
                    data-cursor="link"
                    className="cursor-pointer"
                  >
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
                ref={beamElRef}
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
          <ol ref={registerRef} className="relative">
            <span
              ref={registerDotRef}
              aria-hidden
              style={{
                width: CURSOR_DOT_LINK_PX,
                height: CURSOR_DOT_LINK_PX,
                opacity: 0,
              }}
              className="pointer-events-none absolute top-0 left-0 rounded-full bg-accent"
            />
            {LAYERS.map((layer, i) => {
              const on = activeLayer === i;
              return (
                <li key={layer.name} className="border-t border-(--line) last:border-b">
                  <button
                    type="button"
                    onClick={() => selectLayer(i)}
                    aria-current={on ? "true" : undefined}
                    data-cursor="link"
                    className={`group block w-full py-5 pl-5 text-left transition-opacity duration-500 ${
                      on ? "opacity-100" : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    <div>
                      <h3
                        className={`flex items-center gap-2 text-[1.05rem] font-semibold tracking-[-0.01em] transition-colors duration-300 group-hover:text-accent ${
                          on ? "text-accent" : ""
                        }`}
                      >
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
