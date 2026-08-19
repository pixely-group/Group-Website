"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CURSOR_DOT_LINK_PX } from "@/components/chrome/CustomCursor";
import { gsap } from "@/lib/gsap";

/**
 * This chapter is always bone-themed, so the trace colours are literals rather
 * than `var(--accent)`: SVG presentation attributes need real values to
 * transition, and there is no dark variant of this section to serve.
 * `REFUSED_TEXT` is the darker of the pair — the vivid one clears AA as a mark
 * but not as body text on bone.
 */
const ACCENT = "#2d46ff";
const REFUSED = "#c2402d";
const REFUSED_TEXT = "#9c2d18";

/**
 * A card authorisation, layer by layer. The timings are the story: four
 * layers of our own take 4.5 ms between them, and then the scheme takes the
 * other 179.5 — which is why refusing costs nothing and settling does.
 */
type Layer = {
  index: string;
  /** Register title and the lettering set into the plate's face. */
  name: string;
  face: string;
  spec: string;
  note: string;
  /** What this layer stamps when it lets the request through. */
  pass: string;
  /** Only the layer that refuses carries one. */
  fail?: string;
  ms: number;
};

const LAYERS: readonly Layer[] = [
  {
    index: "L1",
    name: "Application",
    face: "APP",
    spec: "Scoped keys · mTLS · replay windows",
    note: "Every call is signed, scoped and replay-protected.",
    pass: "Signature valid",
    ms: 0.4,
  },
  {
    index: "L2",
    name: "Identity",
    face: "IDENT",
    spec: "Device binding · token vault · KYC",
    note: "Who is asking, proven before anything is asked.",
    pass: "Device bound",
    ms: 1.1,
  },
  {
    index: "L3",
    name: "Policy",
    face: "POLICY",
    spec: "Limits · merchant rules · velocity",
    note: "What they may do, evaluated in under a millisecond.",
    pass: "Within limits",
    fail: "Card frozen in app",
    ms: 0.7,
  },
  {
    index: "L4",
    name: "Ledger",
    face: "LEDGER",
    spec: "Append-only · hash-linked · dual control",
    note: "What actually happened, in a record nobody can edit.",
    pass: "Hold posted",
    ms: 2.3,
  },
  {
    index: "L5",
    name: "Rails",
    face: "RAILS",
    spec: "Scheme · SEPA · RTP · FPS · book transfer",
    note: "Where value finally settles, under our own memberships.",
    pass: "Authorised",
    ms: 179.5,
  },
];

/** Running totals, so the clock can be read straight off a position. */
const CUMULATIVE = LAYERS.reduce<number[]>((acc, layer, i) => {
  acc.push((acc[i - 1] ?? 0) + layer.ms);
  return acc;
}, []);

/** Policy is the layer that refuses. Everything under it is never reached. */
const BLOCK_AT = 2;

/** Isometric plate geometry — a 2:1 diamond per layer. */
const HW = 168;
const HH = 84;
const GAP = 82;
const CX = 210;
const TOP = 96;
const VB_W = 620;
const VB_H = TOP + HH + GAP * (LAYERS.length - 1) + HH + 40;

const layerY = (i: number) => TOP + i * GAP;

const TRAVEL_FROM = layerY(0) - HH;
const TRAVEL_TO = layerY(LAYERS.length - 1) + HH;

function diamond(cx: number, cy: number, hw: number, hh: number) {
  return `${cx - hw},${cy} ${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh}`;
}

/** Milliseconds spent by the time the request has reached `cy`. */
function elapsedAt(cy: number, declined: boolean) {
  const last = declined ? BLOCK_AT : LAYERS.length - 1;
  if (cy <= TRAVEL_FROM) return 0;
  if (cy >= layerY(last)) return CUMULATIVE[last];
  if (cy <= layerY(0)) {
    return (
      ((cy - TRAVEL_FROM) / (layerY(0) - TRAVEL_FROM)) * CUMULATIVE[0]
    );
  }
  const i = Math.min(last - 1, Math.floor((cy - layerY(0)) / GAP));
  const t = (cy - layerY(i)) / GAP;
  return CUMULATIVE[i] + t * (CUMULATIVE[i + 1] - CUMULATIVE[i]);
}

function nearestLayer(cy: number) {
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
}

type Scenario = "approved" | "declined";

export default function SecurityArchitecture() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeLayer, setActiveLayer] = useState(0);
  /** Layers the request has actually crossed. Distinct from `activeLayer`,
   *  which is merely the nearest one — at rest that is L1, and stamping it
   *  before the request has arrived contradicts a clock reading 0.0. */
  const [reached, setReached] = useState(0);
  const [scenario, setScenario] = useState<Scenario>("approved");
  const declined = scenario === "declined";

  // A layer the reader has chosen. While one is held the descending request
  // stops driving the highlight, so their selection is not overwritten a
  // moment later. Read from a ref inside the ticker, which outlives renders.
  const pinnedRef = useRef<number | null>(null);
  const scenarioRef = useRef<Scenario>("approved");
  const beamElRef = useRef<SVGCircleElement>(null);
  const pulseRef = useRef<SVGEllipseElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  // Where the scroll says the request should be. The timeline drives this
  // rather than the element, so a held selection can take the element over
  // without the scrub being disabled and left stale.
  const beamPos = useRef({ cy: TRAVEL_FROM, opacity: 0 });
  /** What is actually drawn. */
  const beamRender = useRef({ cy: TRAVEL_FROM });
  /** Distance between the drawn position and the scroll's own, captured the
   *  moment control returns and then kept. Without it the request eases
   *  toward wherever the scroll target sat when the layer was picked —
   *  travelling backwards to a stale position before following the scroll. */
  const beamOffset = useRef(0);
  /** How far down the request may go. Tweened rather than switched so that
   *  refusing pulls it back up to policy instead of snapping. */
  const ceiling = useRef({ v: TRAVEL_TO });
  const registerRef = useRef<HTMLOListElement>(null);
  const registerDotRef = useRef<HTMLSpanElement>(null);
  const registerDotPlaced = useRef(false);
  /** Armed a moment after a selection, so the ticks that immediately follow
   *  a click cannot cancel it before the request has arrived. */
  const releaseArmed = useRef(true);

  /** The clock and the verdict, written straight to the DOM — they change
   *  every frame and have no business going through React. */
  const paintReadout = useCallback((cy: number) => {
    const isDeclined = scenarioRef.current === "declined";
    const last = isDeclined ? BLOCK_AT : LAYERS.length - 1;
    if (clockRef.current) {
      clockRef.current.textContent = elapsedAt(cy, isDeclined).toFixed(1);
    }
    const status = statusRef.current;
    if (!status) return;
    const done = cy >= layerY(last) - 2;
    const text = done ? (isDeclined ? "Refused" : "Authorised") : "In flight";
    if (status.textContent === text) return;
    status.textContent = text;
    status.style.color = !done
      ? "var(--muted)"
      : isDeclined
        ? REFUSED_TEXT
        : ACCENT;
  }, []);

  const selectLayer = (i: number) => {
    if (scenarioRef.current === "declined" && i > BLOCK_AT) return;
    const next = pinnedRef.current === i ? null : i;
    pinnedRef.current = next;
    releaseArmed.current = false;
    window.setTimeout(() => {
      releaseArmed.current = true;
    }, 400);
    setActiveLayer(next ?? i);

    if (next === null) return;
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

  // Switching the run retargets the ceiling; the ticker does the rest.
  useEffect(() => {
    scenarioRef.current = scenario;
    const isDeclined = scenario === "declined";
    if (isDeclined && (pinnedRef.current ?? 0) > BLOCK_AT) {
      pinnedRef.current = null;
    }
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    gsap.to(ceiling.current, {
      v: isDeclined ? layerY(BLOCK_AT) : TRAVEL_TO,
      duration: reduced ? 0 : 0.7,
      ease: "expo.out",
      overwrite: true,
    });
    paintReadout(beamRender.current.cy);
  }, [scenario, paintReadout]);

  // One marker that travels down the register to whichever layer is
  // current — the same idea as the nav's, at the same size and the same
  // distance from its label, so the two read as one language.
  useEffect(() => {
    const ol = registerRef.current;
    const dot = registerDotRef.current;
    if (!ol || !dot) return;
    const heading = ol.querySelectorAll("[data-reg-title]")[activeLayer];
    if (!heading) return;

    const olBox = ol.getBoundingClientRect();
    const box = heading.getBoundingClientRect();
    const y = box.top - olBox.top + box.height / 2 - CURSOR_DOT_LINK_PX / 2;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (registerDotPlaced.current && !reduced) {
      gsap.to(dot, {
        y,
        opacity: 1,
        duration: 0.45,
        ease: "expo.out",
        overwrite: true,
      });
    } else {
      gsap.set(dot, { y });
      gsap.to(dot, { opacity: 1, duration: reduced ? 0 : 0.25, overwrite: true });
    }
    registerDotPlaced.current = true;
  }, [activeLayer]);

  // A ring in the plane of the plate each time the request lands on one.
  useEffect(() => {
    const pulse = pulseRef.current;
    if (!pulse) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.set(pulse, { attr: { cy: layerY(activeLayer) } });
    gsap.fromTo(
      pulse,
      { opacity: 0.5, attr: { rx: 12, ry: 6 } },
      {
        opacity: 0,
        attr: { rx: 182, ry: 91 },
        duration: 1.1,
        ease: "expo.out",
        overwrite: true,
      },
    );
  }, [activeLayer]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const plates = section.querySelectorAll("[data-plate]");
      const beam = section.querySelector("[data-beam]");
      const wake = section.querySelector("[data-wake]");
      const mm = gsap.matchMedia();
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

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
        // own: scrubbed against the diagram, not the section — anchored to
        // the section it began travelling while only the heading was on
        // screen, so most of its journey happened out of sight.
        const stack = section.querySelector("[data-stack]") ?? section;
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
            cy: TRAVEL_TO,
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

        // Genuine scrolling hands control back. Guarded by a moment's grace
        // so the ticks that follow a click cannot cancel it before the
        // request has even arrived.
        const releaseOnScroll = () => {
          if (pinnedRef.current === null || !releaseArmed.current) return;
          pinnedRef.current = null;
        };
        window.addEventListener("scroll", releaseOnScroll, { passive: true });

        return () => {
          window.removeEventListener("scroll", releaseOnScroll);
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      // Nothing to scrub against: show the completed trace and let selection
      // be the only thing that moves it.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        beamPos.current.cy = TRAVEL_TO;
        beamPos.current.opacity = 1;
      });

      // One writer, every frame, in both motion modes.
      let lastIndex = -1;
      let lastReached = -1;
      let wasHeld = false;
      const draw = () => {
        const held = pinnedRef.current !== null;
        if (wasHeld && !held) {
          // Control just came back. Keep the request exactly where it is
          // and let it follow the scroll from here.
          beamOffset.current = beamRender.current.cy - beamPos.current.cy;
        }
        wasHeld = held;

        if (!held) {
          if (reduced) beamOffset.current = 0;
          // The offset is kept rather than closed. Anything that closes it
          // walks the request back toward where the scroll happened to be
          // when the layer was picked, which is the position it was moved
          // away from.
          beamRender.current.cy = Math.max(
            TRAVEL_FROM,
            beamPos.current.cy + beamOffset.current,
          );
        }
        // Applied after the hold too: refusing has to pull a held selection
        // back up as well as a scrolled one.
        beamRender.current.cy = Math.min(
          ceiling.current.v,
          beamRender.current.cy,
        );

        const cy = beamRender.current.cy;
        gsap.set(beam, { attr: { cy }, opacity: beamPos.current.opacity });
        gsap.set(wake, {
          attr: { y2: cy },
          opacity: beamPos.current.opacity,
        });
        paintReadout(cy);

        const i = nearestLayer(cy);
        if (i !== lastIndex) {
          lastIndex = i;
          setActiveLayer(i);
        }
        const crossed = LAYERS.reduce(
          (n, _, j) => (cy >= layerY(j) - 1 ? j + 1 : n),
          0,
        );
        if (crossed !== lastReached) {
          lastReached = crossed;
          setReached(crossed);
        }
      };
      gsap.ticker.add(draw);

      return () => {
        gsap.ticker.remove(draw);
        mm.revert();
      };
    }, section);

    return () => ctx.revert();
  }, [paintReadout]);

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
            Security here is structural, not a feature. Every tap, transfer and
            top-up crosses all five layers in order, and any one of them can
            refuse. Below is a real authorisation making the trip.
          </p>
        </div>

        {/* — The authorisation under trace, and the run to replay */}
        <div className="mt-14 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-t border-(--line) pt-6">
          <div>
            <p className="type-label text-(--faint)">
              Authorisation 8F2C·41D9
            </p>
            <p className="type-mono mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[1.7rem] leading-none tracking-[-0.03em]">
                €48.20
              </span>
              <span className="text-[0.85rem] text-(--muted)">
                Contactless · Lisbon, PT
              </span>
              <span className="text-[0.85rem] text-(--faint)">•••• 4021</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="type-label text-(--faint)">Replay as</span>
            <div
              role="radiogroup"
              aria-label="Authorisation outcome"
              className="inline-flex items-center gap-1 rounded-(--radius-chip) border border-(--line-strong) p-1"
            >
              {(
                [
                  ["approved", "Approved"],
                  ["declined", "Refused"],
                ] as const
              ).map(([value, label]) => {
                const on = scenario === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setScenario(value)}
                    data-cursor="link"
                    style={
                      on
                        ? {
                            background:
                              value === "declined" ? REFUSED_TEXT : ACCENT,
                          }
                        : undefined
                    }
                    className={`type-label rounded-[2px] px-3 py-2 transition-colors duration-300 ${
                      on
                        ? "text-bone"
                        : "text-(--muted) hover:text-(--fg)"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
          {/* — The stack */}
          <div>
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
                  {/* The trail is faintest where the request has been
                      longest, so it reads as travelled distance. */}
                  <linearGradient
                    id="sec-wake"
                    gradientUnits="userSpaceOnUse"
                    x1={CX}
                    y1={TRAVEL_FROM}
                    x2={CX}
                    y2={TRAVEL_TO}
                  >
                    <stop offset="0" stopColor="currentColor" stopOpacity="0" />
                    <stop
                      offset="1"
                      stopColor="currentColor"
                      stopOpacity="0.55"
                    />
                  </linearGradient>
                  <filter
                    id="sec-glow"
                    x="-25%"
                    y="-70%"
                    width="150%"
                    height="240%"
                  >
                    <feGaussianBlur stdDeviation="9" />
                  </filter>
                </defs>

                {/* spine */}
                <line
                  x1={CX}
                  y1={TRAVEL_FROM - 18}
                  x2={CX}
                  y2={TRAVEL_TO + 20}
                  stroke="currentColor"
                  strokeOpacity="0.22"
                  strokeDasharray="3 5"
                />

                {LAYERS.map((layer, i) => {
                  const refusedHere = declined && i === BLOCK_AT;
                  const unreached = declined && i > BLOCK_AT;
                  const active = activeLayer === i && !unreached;
                  const passed = i < activeLayer && !unreached;
                  const tone = refusedHere ? REFUSED : ACCENT;
                  const cy = layerY(i);

                  // Surface, not just outline: cleared plates carry a tint of
                  // the trace and the one being crossed carries a lit face.
                  const surface = unreached
                    ? 0
                    : active
                      ? 0.2
                      : passed
                        ? 0.09
                        : 0;
                  const hatch = unreached
                    ? 0.12
                    : active
                      ? 0.3
                      : passed
                        ? 0.22
                        : 0.42;
                  const wall = unreached
                    ? 0.04
                    : active
                      ? 0.16
                      : passed
                        ? 0.1
                        : 0.07;
                  const edge = active
                    ? { c: tone, o: 1, w: 1.8 }
                    : passed
                      ? { c: tone, o: 0.55, w: 1.1 }
                      : unreached
                        ? { c: "currentColor", o: 0.16, w: 1 }
                        : { c: "currentColor", o: 0.42, w: 1 };

                  return (
                    <g
                      key={layer.name}
                      data-plate
                      onClick={() => selectLayer(i)}
                      data-cursor={unreached ? undefined : "link"}
                      className={
                        unreached ? "cursor-default" : "cursor-pointer"
                      }
                    >
                      {active && (
                        <polygon
                          points={diamond(CX, cy, HW, HH)}
                          fill={tone}
                          fillOpacity="0.5"
                          filter="url(#sec-glow)"
                        />
                      )}
                      {/* side wall, gives the plate thickness */}
                      <path
                        d={`M ${CX - HW} ${cy} L ${CX} ${cy + HH} L ${CX + HW} ${cy} L ${CX + HW} ${cy + 11} L ${CX} ${cy + HH + 11} L ${CX - HW} ${cy + 11} Z`}
                        fill={passed || active ? tone : "currentColor"}
                        fillOpacity={wall}
                        className="transition-all duration-500"
                      />
                      <polygon
                        points={diamond(CX, cy, HW, HH)}
                        fill={tone}
                        fillOpacity={surface}
                        className="transition-all duration-500"
                      />
                      <polygon
                        points={diamond(CX, cy, HW, HH)}
                        fill="url(#sec-hatch)"
                        fillOpacity={hatch}
                        className="transition-[fill-opacity] duration-500"
                      />
                      {/* Set in the plane of the face, the way a drawing
                          would letter it. */}
                      <text
                        transform={`matrix(1 0.5 -1 0.5 ${CX} ${cy})`}
                        x="0"
                        y="58"
                        textAnchor="middle"
                        fontSize="13"
                        fontFamily="var(--font-mono)"
                        letterSpacing="2"
                        fill={passed || active ? tone : "currentColor"}
                        fillOpacity={
                          unreached ? 0.2 : active ? 0.9 : passed ? 0.6 : 0.34
                        }
                        className="transition-all duration-500"
                      >
                        {layer.face}
                      </text>
                      <polygon
                        points={diamond(CX, cy, HW, HH)}
                        fill="none"
                        stroke={edge.c}
                        strokeOpacity={edge.o}
                        strokeWidth={edge.w}
                        strokeDasharray={unreached ? "4 6" : undefined}
                        className="transition-all duration-500"
                      />
                      {/* leader line out to the label column */}
                      <line
                        x1={CX + HW}
                        y1={cy}
                        x2={VB_W - 34}
                        y2={cy - 26}
                        stroke={active || passed ? tone : "currentColor"}
                        strokeOpacity={
                          unreached ? 0.14 : active ? 0.95 : passed ? 0.5 : 0.38
                        }
                        strokeWidth={active ? 1.4 : 1}
                        className="transition-all duration-500"
                      />
                      <text
                        x={VB_W - 4}
                        y={cy - 31}
                        textAnchor="end"
                        fontSize="13"
                        fill={active || passed ? tone : "currentColor"}
                        fillOpacity={
                          unreached ? 0.2 : active ? 1 : passed ? 0.6 : 0.5
                        }
                        fontFamily="var(--font-mono)"
                        letterSpacing="1.6"
                        className="transition-all duration-500"
                      >
                        {layer.index}
                      </text>
                    </g>
                  );
                })}

                {/* the distance already travelled */}
                <line
                  data-wake
                  x1={CX}
                  y1={TRAVEL_FROM}
                  x2={CX}
                  y2={TRAVEL_FROM}
                  stroke="url(#sec-wake)"
                  strokeWidth="2"
                  opacity="0"
                  style={{ color: declined ? REFUSED : ACCENT }}
                />
                <ellipse
                  ref={pulseRef}
                  cx={CX}
                  cy={layerY(0)}
                  rx="12"
                  ry="6"
                  fill="none"
                  stroke={declined ? REFUSED : ACCENT}
                  strokeWidth="1.2"
                  opacity="0"
                />
                <circle
                  ref={beamElRef}
                  data-beam
                  cx={CX}
                  cy={TRAVEL_FROM}
                  r="5.5"
                  opacity="0"
                  style={{
                    fill: declined ? REFUSED : ACCENT,
                    transition: "fill 400ms var(--ease-out-expo)",
                  }}
                />
              </svg>
            </div>

            {/* — What the trip cost */}
            <div className="mt-6 flex items-end justify-between gap-6 border-t border-(--line) pt-6">
              <div>
                <p className="type-label text-(--faint)">Elapsed</p>
                <p className="type-mono mt-3 flex items-baseline gap-2 text-[clamp(2.4rem,5.2vw,3.8rem)] leading-none tracking-[-0.04em]">
                  <span ref={clockRef}>0.0</span>
                  <span className="type-label text-(--muted)">ms</span>
                </p>
              </div>
              <div className="text-right">
                <p className="type-label text-(--faint)">Verdict</p>
                <p
                  ref={statusRef}
                  aria-live="polite"
                  className="type-label mt-3 text-[0.8rem] text-(--muted)"
                >
                  In flight
                </p>
              </div>
            </div>
          </div>

          {/* — The register */}
          <div>
            <p className="type-label mb-5 text-(--faint)">
              Trace — select a layer to hold it
            </p>
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
                const refusedHere = declined && i === BLOCK_AT;
                const unreached = declined && i > BLOCK_AT;
                const on = activeLayer === i && !unreached;
                const stamped = i < reached && !unreached;
                return (
                  <li
                    key={layer.name}
                    className="border-t border-(--line) last:border-b"
                  >
                    <button
                      type="button"
                      onClick={() => selectLayer(i)}
                      aria-current={on ? "true" : undefined}
                      disabled={unreached}
                      data-cursor={unreached ? undefined : "link"}
                      className={`group block w-full py-5 pr-1 pl-3 text-left transition-opacity duration-500 ${
                        unreached
                          ? "opacity-30"
                          : on
                            ? "opacity-100"
                            : "opacity-60 hover:opacity-90"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <h3
                          data-reg-title
                          className={`text-[1.05rem] font-semibold tracking-[-0.01em] transition-colors duration-300 ${
                            on
                              ? refusedHere
                                ? ""
                                : "text-accent"
                              : "group-hover:text-accent"
                          }`}
                          style={
                            on && refusedHere ? { color: REFUSED_TEXT } : undefined
                          }
                        >
                          {layer.name}
                        </h3>
                        {/* Always rendered so it can fade in — a mounting
                            element has nothing to transition from. */}
                        <span
                          aria-hidden={!stamped}
                          className={`type-label shrink-0 text-[0.65rem] transition-all duration-500 ${
                            stamped
                              ? "translate-x-0 opacity-100"
                              : "-translate-x-1 opacity-0"
                          }`}
                          style={{
                            color: refusedHere ? REFUSED_TEXT : "var(--muted)",
                          }}
                        >
                          {refusedHere ? layer.fail : layer.pass} ·{" "}
                          {layer.ms.toFixed(1)} ms
                        </span>
                      </div>
                      <p className="mt-1.5 text-[0.9rem] leading-relaxed text-(--muted)">
                        {layer.note}
                      </p>
                      <p className="type-label mt-3 text-(--faint)">
                        {layer.spec}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
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
