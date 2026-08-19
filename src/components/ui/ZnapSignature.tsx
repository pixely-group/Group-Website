"use client";

import { useEffect, useRef } from "react";

/* Drawn on a grid rather than by eye, so the parts stay in proportion when
   the curves get adjusted: baseline 215, x-height top 130, cap top 55,
   descender 288. The lean is baked into the coordinates rather than applied
   as a skew, which would thin the uprights and thicken the crossings. */
export const GRID = {
  viewBox: "0 0 760 300",
  capTop: 55,
  xTop: 130,
  baseline: 215,
  descender: 288,
} as const;

/* One unbroken stroke for the word, the way a signature is actually written —
   the pen doubles back through the a and the p rather than lifting. */
const WORD = [
  // Z — entry hook, top bar, diagonal, and a bottom sweep that rises into the n
  "M 62 112",
  "C 78 72 124 56 170 66",
  "C 198 72 206 86 194 100",
  "C 164 134 124 172 96 202",
  "C 86 212 92 220 104 219",
  "C 146 221 190 210 218 190",
  // n — up to x-height, down, over, down
  "C 228 180 236 150 236 133",
  "C 236 155 234 192 236 215",
  "C 239 178 254 133 280 133",
  "C 302 133 304 182 302 215",
  "C 302 224 310 228 320 221",
  // a — rise, oval anticlockwise back to its own top, then the stem beside it.
  // The oval is wider than it is tall-looking on purpose; drawn narrow it
  // reads as an l or a doubled stem next to the p.
  // The stem sits ~8 to the right of the oval's edge; drawn on top of it the
  // two strokes merge into a blob at this weight.
  "C 334 214 356 178 372 136",
  "C 364 127 344 125 334 138",
  "C 322 152 318 180 326 198",
  "C 335 214 358 216 370 202",
  "C 378 190 380 158 376 136",
  "C 382 162 384 194 384 214",
  "C 385 223 393 227 403 220",
  // p — rise, then a descender that loops wide before returning. Drawn as a
  // tight hook the two strokes sit ~15 apart and merge into one thick line at
  // this weight, which reads as a mistake rather than a stroke.
  "C 416 212 432 176 440 134",
  "C 432 186 418 248 406 286",
  "C 401 298 416 304 428 294",
  "C 440 270 448 202 442 152",
  "C 446 130 486 124 498 150",
  "C 510 176 490 208 458 210",
  "C 448 211 441 207 438 200",
  // the trailing sweep every signature has
  "C 456 214 500 226 552 214",
  "C 592 205 622 184 636 158",
].join(" ");

/* The mark is its own gesture — the pen lifts before it. */
const MARK_STROKE = "M 690 116 C 688 148 684 184 680 204";
const MARK_DOT = { cx: 674, cy: 232, r: 8 };

type Props = {
  className?: string;
  /** Relative to the 640-wide grid, so it scales with the lettering. */
  weight?: number;
  /** Seconds for the word; the mark follows after. */
  duration?: number;
  /** Set false to render it already drawn. */
  animate?: boolean;
  /** Held undrawn until this turns true, so a parent timeline owns the cue. */
  play?: boolean;
  title?: string;
};

export default function ZnapSignature({
  className,
  weight = 13,
  duration = 1.5,
  animate = true,
  play = true,
  title = "Znap!",
}: Props) {
  const wordRef = useRef<SVGPathElement>(null);
  const markRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const word = wordRef.current;
    const mark = markRef.current;
    const dot = dotRef.current;
    if (!word || !mark || !dot) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const hold = animate && !reduced;
    const arm = (el: SVGPathElement) => {
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = hold ? `${len}` : "0";
    };
    arm(word);
    arm(mark);
    dot.style.opacity = hold ? "0" : "1";

    if (!hold || !play) return;

    let raf = 0;
    let start = 0;
    const wordLen = word.getTotalLength();
    const markLen = mark.getTotalLength();
    const markAt = duration * 0.82;
    const markFor = duration * 0.26;
    const total = markAt + markFor + 0.12;

    /* Eased so the pen slows into the ends of strokes, not linear — linear
       reads as a machine tracing a path rather than a hand writing. */
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

    const frame = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / 1000;

      word.style.strokeDashoffset = `${wordLen * (1 - ease(clamp01(t / (duration * 0.92))))}`;
      mark.style.strokeDashoffset = `${markLen * (1 - ease(clamp01((t - markAt) / markFor)))}`;
      dot.style.opacity = `${clamp01((t - markAt - markFor * 0.7) / 0.16)}`;

      if (t < total) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, duration, play]);

  return (
    <svg
      viewBox={GRID.viewBox}
      className={className}
      fill="none"
      role="img"
      aria-label={title}
    >
      <path
        ref={wordRef}
        d={WORD}
        stroke="currentColor"
        strokeWidth={weight}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        ref={markRef}
        d={MARK_STROKE}
        stroke="var(--accent)"
        strokeWidth={weight}
        strokeLinecap="round"
      />
      <circle ref={dotRef} {...MARK_DOT} fill="var(--accent)" />
    </svg>
  );
}
