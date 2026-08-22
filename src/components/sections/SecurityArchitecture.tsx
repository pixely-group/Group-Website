"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CURSOR_DOT_LINK_PX } from "@/components/chrome/CustomCursor";
import { useMediaQuery } from "@/lib/hooks";
import { gsap } from "@/lib/gsap";

/**
 * This chapter is always bone-themed, so the trace colours are literals rather
 * than `var(--accent)`: SVG presentation attributes need real values to
 * transition, and there is no dark variant of this section to serve.
 * `REFUSED_TEXT` is the darker of the pair — the vivid one clears AA as a mark
 * but not as body text on bone.
 */
const ACCENT = "#2d46ff";
/**
 * The accent at an alpha. Tailwind's `/opacity` modifier does not apply to
 * the custom `bg-accent` utility — `bg-accent/15` matches no rule at all and
 * paints nothing — so tinted fills are written out. Derived from ACCENT so
 * the two cannot drift apart.
 */
const accentA = (a: number) =>
  `rgb(${parseInt(ACCENT.slice(1, 3), 16)} ${parseInt(ACCENT.slice(3, 5), 16)} ${parseInt(ACCENT.slice(5, 7), 16)} / ${a})`;
const REFUSED = "#c2402d";
const REFUSED_TEXT = "#9c2d18";

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

/**
 * A card authorisation, layer by layer. The timings are the story: four
 * layers of our own take 4.5 ms between them, and then the scheme takes the
 * other 179.5 — which is why refusing costs nothing and settling does.
 */
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

const TOTAL_MS = CUMULATIVE[LAYERS.length - 1];
/** Everything before the rail — the part of the wait that is ours. */
const OURS_MS = CUMULATIVE[LAYERS.length - 2];

/** Policy is the layer that refuses. Everything under it is never reached. */
const BLOCK_AT = 2;

/** The request's own radius, in drawing units. Named because the moment it
 *  touches a plate is a question about its leading edge, not its centre. */
const MARK_R = 5.5;

/**
 * Isometric plate geometry — a 2:1 diamond per layer.
 *
 * Two of them, because the register cannot share the drawing's rhythm at one
 * fixed size. Plate spacing scales with the column's width; a row of prose
 * does not scale at all, so the two can only agree at a single viewport. Wide,
 * the register is lifted out of the flow and hung on the drawing at the same
 * viewBox fractions that place the plates, which makes them agree everywhere;
 * that needs plates spaced far enough apart to seat a row between them.
 * Narrow, the register goes back under the drawing as an ordinary list and the
 * plates close back up into a stack.
 */
type Geo = {
  HW: number;
  HH: number;
  GAP: number;
  CX: number;
  TOP: number;
  VB_W: number;
  VB_H: number;
};

// VB_H is written as its arithmetic rather than a literal: headroom above
// the first plate, the gaps between, the last plate's lower half, then a
// margin. Changing a gap has to carry the drawing's height — and with it
// every register entry, which hangs on a fraction of that height — or the
// two silently part company.
// One drawing, at every width. There were two — a NARROW set with smaller
// plates and a tighter gap, on the reasoning that a phone has less room. It
// does, but the drawing is an SVG in a full-width box: it scales. All the
// second geometry bought was a different picture, close enough to look like
// the same one drawn badly, and tight enough that the plates overlapped and
// the face lettering had to be dropped. So a phone got a stack with no words
// on it and a spacing nobody chose.
//
// The gap is not the plates' to give. Wide, every register entry hangs at the
// same fraction of the drawing that places its plate, and those entries are
// 74px tall against a 103px pitch — closing the stack up would run the words
// of one layer into the next. So the plates come down and the spacing stays.
const PLATES: Geo = {
  HW: 144,
  HH: 72,
  GAP: 118,
  CX: 260,
  TOP: 98,
  VB_W: 520,
  VB_H: 98 + 118 * (LAYERS.length - 1) + 72 + 40,
};

const layerY = (g: Geo, i: number) => g.TOP + i * g.GAP;
const travelFrom = (g: Geo) => layerY(g, 0) - g.HH;
const travelTo = (g: Geo) => layerY(g, LAYERS.length - 1) + g.HH;

/** How far the stack closes up as the reader scrolls down it. The bottom
 *  plate is the anchor and never moves; every plate above gives up this
 *  share of its distance from it, so the top one travels furthest and the
 *  run reads as depth rather than as a list sliding. At 0.64 the top plate
 *  comes down 170 units and the pitch closes from 118 to 76.
 *
 *  What stops it going further is the face lettering, and not where you
 *  would expect. The word is set left of the plate's centre, where the
 *  plate below has narrowed towards its top vertex and sits lower — so it
 *  keeps 8 units of daylight here, and does not touch until 0.62. Measured
 *  along the word's real box against that plate's rising edge, not against
 *  its centre line, which is the mistake that had the lettering fading out
 *  of the way for a while. */
const SQUEEZE = 0.64;

/** Where a y sits once the stack has closed up by `s`. Affine and monotonic,
 *  which is what lets the request keep its own honest coordinates and still
 *  be drawn on the plate it is actually crossing. */
const squeezeY = (g: Geo, y: number, s: number) => {
  const anchor = layerY(g, LAYERS.length - 1);
  return anchor + (y - anchor) * s;
};

/** Where a register entry hangs, as a share of the drawing's height. */
const rowTop = (g: Geo, i: number) => `${(layerY(g, i) / g.VB_H) * 100}%`;

function diamond(cx: number, cy: number, hw: number, hh: number) {
  return `${cx - hw},${cy} ${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh}`;
}

/** Milliseconds spent by the time the request has reached `cy`. */
function elapsedAt(g: Geo, cy: number, declined: boolean) {
  const last = declined ? BLOCK_AT : LAYERS.length - 1;
  const from = travelFrom(g);
  if (cy <= from) return 0;
  if (cy >= layerY(g, last)) return CUMULATIVE[last];
  if (cy <= layerY(g, 0)) {
    return ((cy - from) / (layerY(g, 0) - from)) * CUMULATIVE[0];
  }
  const i = Math.min(last - 1, Math.floor((cy - layerY(g, 0)) / g.GAP));
  const t = (cy - layerY(g, i)) / g.GAP;
  return CUMULATIVE[i] + t * (CUMULATIVE[i + 1] - CUMULATIVE[i]);
}

function nearestLayer(g: Geo, cy: number) {
  let best = 0;
  let bestGap = Infinity;
  LAYERS.forEach((_, i) => {
    const gap = Math.abs(cy - layerY(g, i));
    if (gap < bestGap) {
      bestGap = gap;
      best = i;
    }
  });
  return best;
}

type Scenario = "approved" | "declined";

export default function SecurityArchitecture() {
  const wide = useMediaQuery("(min-width: 1024px)");
  const geo = PLATES;

  const sectionRef = useRef<HTMLElement>(null);
  const [activeLayer, setActiveLayer] = useState(0);
  const toggleRef = useRef<HTMLDivElement>(null);
  /** Where the sliding pill sits, measured off the option it is under. */
  const [pill, setPill] = useState({ x: 0, w: 0 });
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
  const railFillRef = useRef<HTMLDivElement>(null);
  const oursFillRef = useRef<HTMLDivElement>(null);
  // Where the scroll says the request should be. The timeline drives this
  // rather than the element, so a held selection can take the element over
  // without the scrub being disabled and left stale.
  const beamPos = useRef({ cy: travelFrom(PLATES), opacity: 0 });
  /** What is actually drawn. */
  const beamRender = useRef({ cy: travelFrom(PLATES) });
  /** Distance between the drawn position and the scroll's own, captured the
   *  moment control returns and then kept. Without it the request eases
   *  toward wherever the scroll target sat when the layer was picked —
   *  travelling backwards to a stale position before following the scroll. */
  const beamOffset = useRef(0);
  /** How far down the request may go. Tweened rather than switched so that
   *  refusing pulls it back up to policy instead of snapping. */
  const ceiling = useRef({ v: travelTo(PLATES) });
  /** How far the stack has closed up, 1 being open. Scrubbed by the same
   *  timeline that walks the request down, so the two share one progress. */
  const squeeze = useRef({ s: 1 });
  const registerRef = useRef<HTMLOListElement>(null);
  const registerDotRef = useRef<HTMLSpanElement>(null);
  const registerDotPlaced = useRef(false);
  /** The mark's current fill, so the frame loop is not writing a colour it
   *  already wrote. Reading it back off the element is no use — the browser
   *  hands back rgb() and the comparison never matches. */
  const beamFill = useRef("");
  /** Armed a moment after a selection, so the ticks that immediately follow
   *  a click cannot cancel it before the request has arrived. */
  const releaseArmed = useRef(true);

  /** The clock, the verdict and the two bars — all written straight to the
   *  DOM. They change every frame and have no business going through React. */
  const paintReadout = useCallback(
    (cy: number) => {
      const isDeclined = scenarioRef.current === "declined";
      const last = isDeclined ? BLOCK_AT : LAYERS.length - 1;
      const ms = elapsedAt(geo, cy, isDeclined);

      /* The mark turns on arrival, not on the toggle. Refusing is something
         that happens at policy — the request leaves as any other request
         does and is turned back when it gets there. Colouring it red at the
         top of the stack tells the reader the outcome before the drawing
         has made its argument, and makes the four layers above policy look
         as though they refused it too. */
      const mark = beamElRef.current;
      if (mark) {
        /* Contact, not arrival. The request runs down the spine, and on the
           spine a plate begins at its top vertex — HH above the centre line
           the register hangs on. Measuring to the centre held the mark blue
           across the whole plate it had already landed on. Its own leading
           edge is what touches, so the radius comes off too.

           Divided by the squeeze, and that is the part worth being careful
           about: closing the stack moves the plates but does not shrink
           them. Positions are squeezed, sizes are not — so a gap of HH on
           screen is HH/s in the coordinates this comparison is written in.
           Subtracting a flat HH held the mark blue until it was eighty
           pixels into the plate. */
        const s = squeeze.current.s || 1;
        const refused =
          isDeclined && cy >= layerY(geo, BLOCK_AT) - (geo.HH + MARK_R) / s;
        const want = refused ? REFUSED : ACCENT;
        if (beamFill.current !== want) {
          beamFill.current = want;
          mark.style.fill = want;
        }
      }

      if (clockRef.current) clockRef.current.textContent = ms.toFixed(1);
      if (railFillRef.current) {
        railFillRef.current.style.transform = `scaleX(${ms / TOTAL_MS})`;
      }
      if (oursFillRef.current) {
        oursFillRef.current.style.transform = `scaleX(${
          Math.min(ms, OURS_MS) / OURS_MS
        })`;
      }

      const status = statusRef.current;
      if (!status) return;
      const done = cy >= layerY(geo, last) - 2;
      const text = done ? (isDeclined ? "Refused" : "Authorised") : "In flight";
      if (status.textContent === text) return;
      status.textContent = text;
      status.style.color = !done
        ? "var(--muted)"
        : isDeclined
          ? REFUSED_TEXT
          : ACCENT;
    },
    [geo],
  );

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
      cy: layerY(geo, next),
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
      v: isDeclined ? layerY(geo, BLOCK_AT) : travelTo(geo),
      duration: reduced ? 0 : 0.7,
      ease: "expo.out",
      overwrite: true,
    });
    paintReadout(beamRender.current.cy);
  }, [scenario, geo, paintReadout]);

  // One marker that travels down the register to whichever layer is
  // current — the same idea as the nav's, at the same size and the same
  // distance from its label, so the two read as one language. Measured
  // rather than positioned, which is what lets it serve both layouts.
  useEffect(() => {
    const ol = registerRef.current;
    const dot = registerDotRef.current;
    if (!ol || !dot) return;
    const heading = ol.querySelectorAll("[data-reg-title]")[activeLayer];
    if (!heading) return;

    const olBox = ol.getBoundingClientRect();
    const box = heading.getBoundingClientRect();
    const x = box.left - olBox.left - 12;
    const y = box.top - olBox.top + box.height / 2 - CURSOR_DOT_LINK_PX / 2;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (registerDotPlaced.current && !reduced) {
      /* expo.out spends almost all its motion in the first fifth of the
         tween, which is right for a short snap between neighbours and wrong
         for a run down the whole register — it left the dot looking like it
         jumped and then crawled. power2.inOut eases both ends, and the
         duration grows with the distance so a long trip is not squeezed into
         the same time as a short one. */
      const dy = Math.abs(y - (gsap.getProperty(dot, "y") as number));
      gsap.to(dot, {
        x,
        y,
        opacity: 1,
        duration: Math.min(0.75, 0.32 + dy / 900),
        ease: "power2.inOut",
        overwrite: true,
      });
    } else {
      gsap.set(dot, { x, y });
      gsap.to(dot, { opacity: 1, duration: reduced ? 0 : 0.25, overwrite: true });
    }
    registerDotPlaced.current = true;
  }, [activeLayer, wide]);

  /* The pill follows whichever option is selected. Measured on selection and
     on resize rather than assumed: the two labels differ in width, and the
     bar re-flows between the narrow and wide layouts. */
  useEffect(() => {
    const box = toggleRef.current;
    if (!box) return;
    const place = () => {
      const opts = box.querySelectorAll<HTMLElement>("[data-toggle-option]");
      const el = opts[scenario === "declined" ? 1 : 0];
      if (!el) return;
      setPill({ x: el.offsetLeft, w: el.offsetWidth });
    };
    const raf = requestAnimationFrame(place);
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [scenario]);

  // A ring in the plane of the plate each time the request lands on one.
  useEffect(() => {
    const pulse = pulseRef.current;
    if (!pulse) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.set(pulse, {
      attr: { cy: squeezeY(geo, layerY(geo, activeLayer), squeeze.current.s) },
    });
    gsap.fromTo(
      pulse,
      { opacity: 0.5, attr: { rx: geo.HW * 0.06, ry: geo.HH * 0.06 } },
      {
        opacity: 0,
        attr: { rx: geo.HW * 1.08, ry: geo.HH * 1.08 },
        duration: 1.1,
        ease: "expo.out",
        overwrite: true,
      },
    );
  }, [activeLayer, geo]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const g = geo;

    const ctx = gsap.context(() => {
      const plates = section.querySelectorAll("[data-plate]");
      const lifts = section.querySelectorAll("[data-plate-lift]");
      const spine = section.querySelector("[data-spine]");
      const beam = section.querySelector("[data-beam]");
      const mm = gsap.matchMedia();
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const from = travelFrom(g);
      const to = travelTo(g);

      // Re-seat the request into this layout's coordinates.
      beamPos.current.cy = from;
      beamRender.current.cy = from;
      beamOffset.current = 0;
      squeeze.current.s = 1;
      ceiling.current.v =
        scenarioRef.current === "declined" ? layerY(g, BLOCK_AT) : to;

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
        // own: scrubbed against the drawing, not the section — anchored to
        // the section it began travelling while only the heading was on
        // screen, so most of its journey happened out of sight.
        /* The drawing itself, not the block that holds it. Below lg the
           register is in the flow under the drawing rather than absolutely
           placed beside it, so [data-stack] is the drawing plus seven
           hundred pixels of list — and a scrub anchored to that box spends
           most of its range with the plates already scrolled off the top.
           Which is why the animation ran to the end on a phone with the last
           two plates out of sight. Wide, the register is absolute and adds
           no height, so this is the same box it always was. */
        const stack = section.querySelector("[data-drawing]") ?? section;
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
            cy: to,
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

        // Closing the stack gets its own range rather than the request's.
        // The request is scrubbed across the whole section so that it
        // descends for as long as there is section left to read — which
        // spends most of its progress while the drawing is still below the
        // fold or already above it. Sharing that is what made the plates
        // look still: a third of a gap, paid out over a thousand pixels of
        // scroll, two thirds of them spent off screen.
        const close = gsap.to(squeeze.current, {
          s: SQUEEZE,
          ease: "none",
          scrollTrigger: {
            trigger: stack,
            start: "top 85%",
            end: "bottom 60%",
            scrub: 0.6,
          },
        });

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
          close.scrollTrigger?.kill();
          close.kill();
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      // Nothing to scrub against: show the completed trace and let selection
      // be the only thing that moves it.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        beamPos.current.cy = to;
        beamPos.current.opacity = 1;
      });

      // One writer, every frame, in both motion modes.
      let lastIndex = -1;
      let lastReached = -1;
      let lastSqueeze = -1;
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
            from,
            beamPos.current.cy + beamOffset.current,
          );
        }
        // Applied after the hold too: refusing has to pull a held selection
        // back up as well as a scrolled one.
        beamRender.current.cy = Math.min(
          ceiling.current.v,
          beamRender.current.cy,
        );

        // The stack closes up around the bottom plate. Written from the
        // ticker rather than tweened per plate, so the request and the plate
        // it is crossing can never disagree about where that layer is.
        const s = squeeze.current.s;
        if (s !== lastSqueeze) {
          lastSqueeze = s;
          LAYERS.forEach((_, i) => {
            const at = layerY(g, i);
            const dy = squeezeY(g, at, s) - at;
            gsap.set(lifts[i], { y: dy });
          });
          gsap.set(spine, {
            attr: { y1: squeezeY(g, layerY(g, 0), s) - g.HH - 18 },
          });
        }

        const cy = beamRender.current.cy;
        gsap.set(beam, {
          attr: { cy: squeezeY(g, cy, s) },
          opacity: beamPos.current.opacity,
        });
        paintReadout(cy);

        const i = nearestLayer(g, cy);
        if (i !== lastIndex) {
          lastIndex = i;
          setActiveLayer(i);
        }
        const crossed = LAYERS.reduce(
          (n, _, j) => (cy >= layerY(g, j) - 1 ? j + 1 : n),
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
  }, [geo, paintReadout]);

  const faceSize = Math.round(geo.HH * 0.17);

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
            <p className="type-label text-(--faint)">Authorisation 8F2C·41D9</p>
            <p className="type-mono mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[1.7rem] leading-none tracking-[-0.03em]">
                350,00 DZD
              </span>
              <span className="text-[0.85rem] text-(--muted)">
                Contactless · Alger, DZ
              </span>
              <span className="text-[0.85rem] text-(--faint)">•••• 4021</span>
            </p>
          </div>

          {/* Wide, this sits at the far end of the authorisation's own row.
              Below that it wraps onto a line of its own, and a control on its
              own line has no business hugging the left edge when the drawing
              it replays is centred — so it centres with the plates. On a
              phone the label and the pill will not sit together in 327px
              without the pill running into the margin, so they stack. */}
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 lg:w-auto lg:justify-end">
            <span className="type-label text-(--faint)">Replay as</span>
            {/* One pill that travels, rather than a background handed from
                one button to the other. It is measured off the buttons rather
                than positioned by hand, because "Approved" and "Refused" are
                not the same width — a fixed half-and-half slide would sit
                short on one side and overhang on the other. */}
            <div
              ref={toggleRef}
              role="radiogroup"
              aria-label="Authorisation outcome"
              className="relative inline-flex items-center gap-1 rounded-(--radius-chip) border border-(--line-strong) p-1"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute top-1 left-0 rounded-[calc(var(--radius-chip)-4px)]"
                style={{
                  height: "calc(100% - 0.5rem)",
                  width: pill.w,
                  transform: `translateX(${pill.x}px)`,
                  background: declined ? REFUSED_TEXT : ACCENT,
                  transition:
                    "transform 420ms var(--ease-out-expo), width 420ms var(--ease-out-expo), background-color 300ms linear",
                  opacity: pill.w ? 1 : 0,
                }}
              />
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
                    data-toggle-option
                    className={`type-label relative z-10 rounded-[calc(var(--radius-chip)-4px)] px-3 py-2 transition-colors duration-300 ${
                      on ? "text-bone" : "text-(--muted) hover:text-(--fg)"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* — The drawing. Wide, the register hangs on it at the same
            fractions that place the plates; narrow, it follows underneath. */}
        {/* Almost nothing below lg. Wide, the register hangs beside the
            drawing and the space above it is the section breathing; narrow,
            the replay control is the thing directly above, and the drawing
            already carries its own margin — 26 units of blank above the
            first plate's tip so the request has somewhere to come in from,
            which is 26px of gap before any margin is added to it. */}
        <div data-stack className="relative mt-1 lg:mt-12">
          <svg
            viewBox={`0 0 ${geo.VB_W} ${geo.VB_H}`}
            data-drawing
            /* Capped at the width it is drawn at on a desktop, and centred.
               Full-bleed, a tablet rendered the stack at 688px — wider than
               the 532 it gets at 1321, so "the same as desktop" came out
               half again bigger than desktop, and every control on the page
               looked to have shrunk beside it. A phone is narrower than the
               cap, so nothing changes there. */
            className="mx-auto w-full max-w-[33rem] lg:mx-0 lg:w-[44%] lg:max-w-none"
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
              data-spine
              x1={geo.CX}
              y1={layerY(geo, 0) - geo.HH - 18}
              x2={geo.CX}
              y2={travelTo(geo) + 20}
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
              const cy = layerY(geo, i);

              // Surface, not just outline: cleared plates carry a tint of
              // the trace and the one being crossed carries a lit face.
              /* The active face used to take 0.2 of solid accent, which at
                 this size read as a lit panel rather than a highlighted one. */
              const surface = unreached ? 0 : active ? 0.07 : passed ? 0.04 : 0;
              const hatch = unreached ? 0.12 : active ? 0.3 : passed ? 0.22 : 0.42;
              const wall = unreached ? 0.04 : active ? 0.09 : passed ? 0.065 : 0.07;
              const edge = active
                ? { c: tone, o: 0.8, w: 1.5 }
                : passed
                  ? { c: tone, o: 0.55, w: 1.1 }
                  : unreached
                    ? { c: "currentColor", o: 0.16, w: 1 }
                    : { c: "currentColor", o: 0.42, w: 1 };
              const wallDepth = Math.round(geo.HH * 0.13);
              // Lettering sits above the plate's centre line, because the
              // plate below is drawn after this one and covers everything
              // under its own top vertex — only 16 units below centre now
              // that the run has closed up. It cannot go far up either: the
              // diamond narrows, and the longest word (LEDGER, 70 units set)
              // ran past the edge from 0.71·HH out. 0.55·HH out and 0.26·HH
              // up clears both by more than 20. Expressed as the one point
              // in the face's own plane that lands there.
              //
              // That placement is also what carries the word through the
              // close. Set there, its lowest ink lands 5 units above the
              // plate's own centre, while the plate below does not begin
              // until 8 units past it even fully shut — 12 units of daylight
              // at the tightest the stack gets. The lettering needs nothing
              // done to it.
              const faceX = -geo.HH * 0.535;
              const faceY = geo.HH * 0.015;

              return (
                <g
                  key={layer.name}
                  data-plate
                  onClick={() => selectLayer(i)}
                  data-cursor={unreached ? undefined : "link"}
                  className={unreached ? "cursor-default" : "cursor-pointer"}
                >
                  {/* The plate and everything drawn on it ride together, one
                      group inside the group the entrance tween owns — two
                      transforms, two writers, neither able to clear the
                      other. */}
                  <g data-plate-lift>
                    {active && (
                      /* The blurred bloom under the live plate. This, not the
                         face fill, is what made the highlight read as strong —
                         half-opacity accent spread by a 9px blur. */
                      <polygon
                        points={diamond(geo.CX, cy, geo.HW, geo.HH)}
                        fill={tone}
                        fillOpacity="0.13"
                        filter="url(#sec-glow)"
                      />
                    )}
                    {/* side wall, gives the plate thickness */}
                    <path
                      d={`M ${geo.CX - geo.HW} ${cy} L ${geo.CX} ${cy + geo.HH} L ${geo.CX + geo.HW} ${cy} L ${geo.CX + geo.HW} ${cy + wallDepth} L ${geo.CX} ${cy + geo.HH + wallDepth} L ${geo.CX - geo.HW} ${cy + wallDepth} Z`}
                      fill={passed || active ? tone : "currentColor"}
                      fillOpacity={wall}
                      className="transition-all duration-500"
                    />
                    <polygon
                      points={diamond(geo.CX, cy, geo.HW, geo.HH)}
                      fill={tone}
                      fillOpacity={surface}
                      className="transition-all duration-500"
                    />
                    <polygon
                      points={diamond(geo.CX, cy, geo.HW, geo.HH)}
                      fill="url(#sec-hatch)"
                      fillOpacity={hatch}
                      className="transition-[fill-opacity] duration-500"
                    />
                    {/* Set in the plane of the face, the way a drawing would
                        letter it. This used to be wide-only, because the
                        narrow stack overlapped until the clear band was
                        thinner than the word — a problem that came with the
                        second geometry and left with it. */}
                    <text
                        transform={`matrix(1 0.5 -1 0.5 ${geo.CX} ${cy})`}
                        x={faceX}
                        y={faceY}
                        textAnchor="middle"
                        fontSize={faceSize}
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
                      points={diamond(geo.CX, cy, geo.HW, geo.HH)}
                      fill="none"
                      stroke={edge.c}
                      strokeOpacity={edge.o}
                      strokeWidth={edge.w}
                      strokeDasharray={unreached ? "4 6" : undefined}
                      className="transition-all duration-500"
                    />
                  </g>
                </g>
              );
            })}

            <ellipse
              ref={pulseRef}
              cx={geo.CX}
              cy={layerY(geo, 0)}
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
              cx={geo.CX}
              cy={travelFrom(geo)}
              r={MARK_R}
              opacity="0"
              style={{
                /* Only the starting colour. Which colour it should be from
                   then on depends on where it has got to, so paintReadout
                   owns it. */
                fill: ACCENT,
                transition: "fill 400ms var(--ease-out-expo)",
              }}
            />
          </svg>

          <ol
            ref={registerRef}
            className="relative mt-10 lg:pointer-events-none lg:absolute lg:inset-0 lg:mt-0"
          >
            <span
              ref={registerDotRef}
              aria-hidden
              style={{
                width: CURSOR_DOT_LINK_PX,
                height: CURSOR_DOT_LINK_PX,
                opacity: 0,
              }}
              className="pointer-events-none absolute top-0 left-0 z-10 rounded-full bg-accent"
            />
            {LAYERS.map((layer, i) => {
              const refusedHere = declined && i === BLOCK_AT;
              const unreached = declined && i > BLOCK_AT;
              const on = activeLayer === i && !unreached;
              const stamped = i < reached && !unreached;
              return (
                <li
                  key={layer.name}
                  style={{ "--row-top": rowTop(geo, i) } as React.CSSProperties}
                  className="relative border-t border-(--line) last:border-b lg:pointer-events-auto lg:absolute lg:top-(--row-top) lg:right-0 lg:left-[48%] lg:-translate-y-3.5 lg:border-0 lg:last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => selectLayer(i)}
                    aria-current={on ? "true" : undefined}
                    disabled={unreached}
                    data-cursor={unreached ? undefined : "link"}
                    className={`group block w-full py-5 pr-1 pl-3 text-left transition-opacity duration-500 lg:py-0 ${
                      unreached
                        ? "opacity-30"
                        : on
                          ? "opacity-100"
                          : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    {/* h-7 at lg fixes the title's centre at 14px from the
                        entry's top — the offset both the hairline above and
                        the entry's own translate are written against. */}
                    <div className="flex items-baseline justify-between gap-4 lg:h-7 lg:items-center">
                      <h3
                        data-reg-title
                        className={`flex items-baseline gap-2.5 text-[1.05rem] font-semibold tracking-[-0.01em] transition-colors duration-300 ${
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
                        {/* The layer's index, off the plate now that no
                            line joins the two. Left uncoloured so it takes
                            the title's own state and sits a shade behind
                            it. */}
                        <span className="type-label text-[0.62rem] opacity-45">
                          {layer.index}
                        </span>
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
                    <p className="mt-1.5 text-[0.9rem] leading-relaxed text-(--muted) lg:mt-1">
                      {layer.note}
                    </p>
                    <p className="type-label mt-3 text-(--faint) lg:mt-2">
                      {layer.spec}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* — Where the time actually goes */}
        <div className="mt-16 border-t border-(--line) pt-8">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <div>
              <p className="type-label text-(--faint)">Elapsed</p>
              <p className="type-mono mt-3 flex items-baseline gap-2 text-[clamp(2.6rem,6vw,4.6rem)] leading-none tracking-[-0.04em]">
                <span ref={clockRef}>0.0</span>
                <span className="type-label text-(--muted)">ms</span>
              </p>
            </div>
            <p className="max-w-md text-[0.95rem] leading-relaxed text-(--muted)">
              Four layers of ours answer in{" "}
              <span className="type-mono text-(--fg)">4.5 ms</span>. The card
              scheme takes the other{" "}
              <span className="type-mono text-(--fg)">179.5</span>. Refusing is
              the cheap part — which is the whole argument for doing it here.
            </p>
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

          {/* Full scale: 184 ms across the page. Ours is the sliver. */}
          <div className="mt-10">
            <div className="relative h-9 border border-(--line)">
              <div
                ref={railFillRef}
                className="absolute inset-y-0 left-0 w-full origin-left"
                style={{ transform: "scaleX(0)", background: accentA(0.15) }}
              />
              <div
                className="absolute inset-y-0 w-px bg-(--line-strong)"
                style={{ left: `${(OURS_MS / TOTAL_MS) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between">
              <span
                className="type-label text-[0.6rem] text-(--faint)"
                style={{ color: ACCENT }}
              >
                ↑ ours · {OURS_MS.toFixed(1)} ms
              </span>
              <span className="type-label text-[0.6rem] text-(--faint)">
                card scheme · {(TOTAL_MS - OURS_MS).toFixed(1)} ms
              </span>
              <span className="type-label text-[0.6rem] text-(--faint)">
                {TOTAL_MS.toFixed(1)} ms
              </span>
            </div>
          </div>

          {/* The sliver, opened out. Same four layers, their own scale. */}
          <div
            aria-hidden
            className="mt-2 h-8"
            style={{
              background: accentA(0.16),
              clipPath: `polygon(0 0, ${(OURS_MS / TOTAL_MS) * 100}% 0, 100% 100%, 0 100%)`,
            }}
          />
          <div className="relative h-9 border border-(--line)">
            <div
              ref={oursFillRef}
              className="absolute inset-y-0 left-0 w-full origin-left"
              style={{ transform: "scaleX(0)", background: accentA(0.25) }}
            />
            {LAYERS.slice(0, LAYERS.length - 1).map((layer, i) => (
              <div
                key={layer.name}
                className="absolute inset-y-0 w-px bg-(--line-strong)"
                style={{ left: `${(CUMULATIVE[i] / OURS_MS) * 100}%` }}
              />
            ))}
          </div>
          <div className="relative mt-2 h-4">
            {LAYERS.slice(0, LAYERS.length - 1).map((layer, i) => (
              <span
                key={layer.name}
                className="type-label absolute text-[0.6rem] text-(--faint)"
                style={{
                  left: `${(CUMULATIVE[i] / OURS_MS) * 100}%`,
                  transform: i === LAYERS.length - 2 ? "translateX(-100%)" : "translateX(-50%)",
                }}
              >
                {layer.index}
              </span>
            ))}
          </div>
          <p className="type-label mt-4 text-[0.6rem] text-(--faint)">
            The first {OURS_MS.toFixed(1)} ms, opened out
          </p>
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
