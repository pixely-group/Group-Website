"use client";

import { useEffect, useRef } from "react";

/* Drawn on a grid rather than by eye, so the parts stay in proportion when the
   curves get adjusted: baseline 215, x-height top 130, cap top 55, descender
   288. The box runs to 330 rather than 300 because the p's descender loop
   reaches y 304 and the stroke carries its ink another 8 past that — at 300
   the SVG clipped its own tail. */
export const GRID = {
  viewBox: "0 0 760 330",
  capTop: 55,
  xTop: 130,
  baseline: 215,
  descender: 288,
} as const;

export type Hand = "script" | "autograph" | "marker" | "ballpoint";

type Face = {
  label: string;
  note: string;
  word: string;
  mark: string;
  dot: { cx: number; cy: number; r: number };
  weight: number;
};

/* Each hand is one unbroken stroke for the word, the way a signature is
   actually written — the pen doubles back through the a and loops the p
   rather than lifting — and a separate gesture for the mark, because there
   the pen does lift. */
const HANDS: Record<Hand, Face> = {
  script: {
    label: "Script",
    note: "Even monoline, generous loops, a long trailing sweep. The most written of the four, and the roundest.",
    weight: 15,
    word: [
      "M 62 112",
      "C 78 72 124 56 170 66",
      "C 198 72 206 86 194 100",
      "C 164 134 124 172 96 202",
      "C 86 212 92 220 104 219",
      "C 146 221 190 210 218 190",
      "C 228 180 236 150 236 133",
      "C 236 155 234 192 236 215",
      "C 239 178 254 133 280 133",
      "C 302 133 304 182 302 215",
      "C 302 224 310 228 320 221",
      "C 334 214 356 178 372 136",
      "C 364 127 344 125 334 138",
      "C 322 152 318 180 326 198",
      "C 335 214 358 216 370 202",
      "C 378 190 380 158 376 136",
      "C 382 162 384 194 384 214",
      "C 385 223 393 227 403 220",
      "C 416 212 432 176 440 134",
      "C 432 186 418 248 406 286",
      "C 401 298 416 304 428 294",
      "C 440 270 448 202 442 152",
      "C 446 130 486 124 498 150",
      "C 510 176 490 208 458 210",
      "C 448 211 441 207 438 200",
      "C 456 214 500 226 552 214",
      "C 592 205 622 184 636 158",
    ].join(" "),
    mark: "M 690 116 C 688 148 684 184 680 204",
    dot: { cx: 674, cy: 232, r: 8 },
  },

  /* Straight runs and hard corners where Script curves — a name signed at
     speed, where the pen changes direction rather than turning. */
  autograph: {
    label: "Autograph",
    note: "Signed fast. Straight runs, hard corners, a long flat top and a long slash down. The least careful and the most confident.",
    weight: 12,
    word: [
      "M 40 120",
      "C 62 78 106 54 154 62",
      "L 202 70",
      "L 100 198",
      "L 96 213",
      "C 136 223 182 217 220 194",
      // The n arches and the a closes on a curve. Drawn as pure zigzag both
      // lose their identity and the middle of the word reads as "neyp".
      "C 232 176 240 144 240 130",
      "L 236 212",
      "C 240 172 254 132 276 132",
      "L 298 212",
      "C 302 220 310 224 320 218",
      "C 336 210 352 172 362 132",
      "C 352 122 330 128 325 152",
      "C 320 178 331 204 351 206",
      "C 367 208 375 194 377 174",
      "C 379 158 379 142 378 132",
      "L 382 212",
      "C 384 220 392 224 402 218",
      "L 441 130",
      "L 412 290",
      "C 408 303 423 309 433 298",
      "L 445 154",
      "C 455 126 493 124 503 150",
      "C 513 177 491 207 459 209",
      "C 451 210 445 206 443 201",
      "C 463 215 509 225 559 211",
      "C 599 201 627 181 641 155",
    ].join(" "),
    mark: "M 700 112 L 690 202",
    dot: { cx: 684, cy: 232, r: 8 },
  },

  /* Upright, round and heavy, with the flourish cut short — a felt tip has no
     thin stroke to taper into, so the sweep would read as a smear. */
  marker: {
    label: "Marker",
    note: "Felt tip. Upright, round and heavy, with the flourish cut short — a thick stroke has no thin to taper into.",
    weight: 24,
    word: [
      "M 70 92",
      "C 84 62 128 50 172 62",
      "C 196 68 200 84 188 96",
      "C 158 128 122 164 98 196",
      "C 90 208 96 216 108 216",
      "C 146 218 186 208 214 188",
      "C 224 178 230 152 230 134",
      "C 230 158 228 192 230 214",
      "C 234 176 250 134 276 134",
      "C 298 134 300 182 298 214",
      "C 298 222 306 226 316 220",
      "C 330 212 350 176 364 134",
      "C 356 124 334 122 324 136",
      "C 312 152 308 182 316 200",
      "C 326 216 350 218 362 204",
      "C 370 192 372 158 368 134",
      "C 374 162 376 194 376 214",
      "C 377 223 385 227 395 220",
      "C 408 212 424 176 432 134",
      "C 424 186 412 248 402 288",
      "C 398 300 412 306 422 296",
      "C 434 272 442 202 436 152",
      "C 442 128 482 124 494 152",
      "C 506 180 484 210 452 212",
      "C 444 213 438 209 436 202",
      "C 450 215 478 221 504 213",
    ].join(" "),
    mark: "M 566 118 C 564 150 560 184 556 204",
    dot: { cx: 550, cy: 234, r: 11 },
  },

  /* Small, tight and quick — the hand you sign a form with rather than the
     one you design. Short ascenders, shallow loops, an uneven baseline. */
  ballpoint: {
    label: "Ballpoint",
    note: "The hand you sign a form with, not one you design. Tight loops, short ascenders, an uneven baseline. The least styled.",
    weight: 11,
    word: [
      "M 78 106",
      "C 88 76 120 60 156 68",
      "C 178 74 182 88 170 100",
      "C 144 128 116 160 98 190",
      "C 92 202 98 210 110 209",
      "C 142 212 178 204 204 186",
      "C 212 178 218 156 218 140",
      "C 218 160 217 192 219 212",
      "C 222 180 234 144 254 144",
      "C 272 144 274 184 272 212",
      "C 272 219 279 223 288 217",
      "C 298 210 314 180 326 146",
      "C 319 138 302 144 298 164",
      "C 294 186 302 206 318 208",
      "C 331 210 338 198 340 182",
      "C 344 162 344 148 342 146",
      "C 340 168 339 194 340 212",
      "C 341 220 348 224 357 218",
      "C 368 210 380 180 386 146",
      "C 380 190 371 244 363 282",
      "C 360 293 372 298 380 289",
      "C 389 268 396 208 391 166",
      "C 396 146 428 142 437 164",
      "C 446 186 428 210 402 212",
      "C 395 213 390 209 388 204",
      "C 404 214 436 222 470 214",
      "C 494 209 512 197 522 182",
    ].join(" "),
    mark: "M 566 124 C 564 152 561 184 558 202",
    dot: { cx: 553, cy: 228, r: 7 },
  },
};

export const HAND_LIST = Object.entries(HANDS).map(([id, f]) => ({
  id: id as Hand,
  label: f.label,
  note: f.note,
  weight: f.weight,
}));

type Props = {
  className?: string;
  hand?: Hand;
  /** Relative to the 760-wide grid, so it scales with the lettering. */
  weight?: number;
  /** Degrees of extra lean, on top of what the hand already carries. */
  slant?: number;
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
  hand = "script",
  weight,
  slant = 0,
  duration = 1.5,
  animate = true,
  play = true,
  title = "Znap!",
}: Props) {
  const wordRef = useRef<SVGPathElement>(null);
  const markRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const face = HANDS[hand];
  const stroke = weight ?? face.weight;

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
  }, [animate, duration, play, hand]);

  return (
    <svg viewBox={GRID.viewBox} className={className} fill="none" role="img" aria-label={title}>
      {/* Skewed about the baseline so extra lean pivots where the letters sit
          rather than swinging them off it. */}
      <g transform={slant ? `skewX(${-slant}) translate(${GRID.baseline * Math.tan((slant * Math.PI) / 180)} 0)` : undefined}>
        <path
          ref={wordRef}
          d={face.word}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path ref={markRef} d={face.mark} stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round" />
        <circle ref={dotRef} {...face.dot} fill="var(--accent)" />
      </g>
    </svg>
  );
}
