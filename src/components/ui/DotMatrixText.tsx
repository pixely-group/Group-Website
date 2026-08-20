"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/lib/hooks";

type Dot = { x: number; y: number; r: number; accent: boolean };

type Matrix = {
  dots: Dot[];
  /** Ink bounds, which become the viewBox. */
  w: number;
  h: number;
  /** Where the text baseline falls inside those bounds, as a fraction of h. */
  baseline: number;
};

/* Sampled at 200px: big enough that the dot grid resolves cleanly, small
   enough that the flood fill stays trivial. */
const SAMPLE = 200;

/* Bitcount's dots merge into continuous strokes from weight 400 up, so the
   grid is read at 300 where they are still separate. Only the centres are
   taken from the font — the drawn radius is ours, so the rendered dots can be
   any size without the sampling weight showing. */
const SAMPLE_WEIGHT = 300;

const cache = new Map<string, Matrix | null>();

function readMatrix(text: string, plain: string, family: string): Matrix | null {
  const canvas = document.createElement("canvas");
  const measure = canvas.getContext("2d");
  if (!measure) return null;
  const font = `${SAMPLE_WEIGHT} ${SAMPLE}px ${family}`;
  measure.font = font;
  const pad = SAMPLE * 0.2;
  canvas.width = Math.ceil(measure.measureText(text).width + pad * 2);
  canvas.height = Math.ceil(SAMPLE * 2);

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.font = font;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  const baselineY = SAMPLE * 1.35;
  ctx.fillText(text, pad, baselineY);
  /* Everything past the end of the plain word is the mark, which is the one
     part that takes the accent. */
  const accentFrom = pad + ctx.measureText(plain).width;

  const W = canvas.width;
  const H = canvas.height;
  const data = ctx.getImageData(0, 0, W, H).data;
  const on = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (data[i * 4 + 3] > 128) on[i] = 1;

  /* Each connected blob is one dot of the matrix. */
  const seen = new Uint8Array(W * H);
  const stack = new Int32Array(W * H);
  const raw: { cx: number; cy: number; r: number }[] = [];
  let minX = W;
  let maxX = 0;
  let minY = H;
  let maxY = 0;

  for (let i = 0; i < W * H; i++) {
    if (!on[i] || seen[i]) continue;
    let sp = 0;
    stack[sp++] = i;
    seen[i] = 1;
    let n = 0;
    let sx = 0;
    let sy = 0;
    let bx0 = W;
    let bx1 = 0;
    let by0 = H;
    let by1 = 0;
    while (sp) {
      const p = stack[--sp];
      const x = p % W;
      const y = (p / W) | 0;
      n++;
      sx += x;
      sy += y;
      if (x < bx0) bx0 = x;
      if (x > bx1) bx1 = x;
      if (y < by0) by0 = y;
      if (y > by1) by1 = y;
      if (x > 0 && on[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack[sp++] = p - 1; }
      if (x < W - 1 && on[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack[sp++] = p + 1; }
      if (y > 0 && on[p - W] && !seen[p - W]) { seen[p - W] = 1; stack[sp++] = p - W; }
      if (y < H - 1 && on[p + W] && !seen[p + W]) { seen[p + W] = 1; stack[sp++] = p + W; }
    }
    /* Stray antialiasing fragments are not dots. */
    if (n < 6) continue;
    raw.push({ cx: sx / n, cy: sy / n, r: (bx1 - bx0 + by1 - by0 + 2) / 4 });
    if (bx0 < minX) minX = bx0;
    if (bx1 > maxX) maxX = bx1;
    if (by0 < minY) minY = by0;
    if (by1 > maxY) maxY = by1;
  }
  if (raw.length < 8) return null;

  const w = maxX - minX;
  const h = maxY - minY;
  return {
    w,
    h,
    baseline: (baselineY - minY) / h,
    dots: raw.map((d) => ({
      x: d.cx - minX,
      y: d.cy - minY,
      r: d.r,
      accent: d.cx >= accentFrom,
    })),
  };
}

type Props = {
  className?: string;
  /** The word, and the part of it that is not the mark. Pass them equal — the
   *  default — for a word with no mark: everything past `plain` is what takes
   *  the accent, so an equal pair simply accents nothing. */
  text?: string;
  plain?: string;
  /** Width of the lettering, in ems of the surrounding text. */
  width?: number;
  /** Multiplies the radius taken from the font. Above about 1.3 the dots
   *  touch at this grid pitch and read as strokes rather than as dots. */
  weight?: number;
  /** Seconds for the whole word to assemble. */
  duration?: number;
  /** Held blank until this turns true, so a parent timeline owns the cue. */
  play?: boolean;
  /** How much a dot's turn is scattered off the left-to-right sweep. */
  scatter?: number;
};

export default function DotMatrixText({
  className,
  text = "Pixely",
  plain = "Pixely",
  width = 3,
  weight = 1.1,
  duration = 1.4,
  play = true,
  scatter = 0.35,
}: Props) {
  const probeRef = useRef<HTMLSpanElement>(null);
  const key = `${text}|${plain}`;
  /* Read straight from the cache on a remount, rather than setting state from
     an effect and rendering the fallback for a frame first. */
  const [matrix, setMatrix] = useState<Matrix | null>(() => cache.get(key) ?? null);
  const [lit, setLit] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    if (cache.has(key)) return;
    const probe = probeRef.current;
    if (!probe) return;
    const family = getComputedStyle(probe).fontFamily;
    document.fonts.load(`${SAMPLE_WEIGHT} ${SAMPLE}px ${family}`).then(() => {
      if (cancelled) return;
      let read: Matrix | null = null;
      try {
        read = readMatrix(text, plain, family);
      } catch {
        /* Falls back to the real text below. */
        read = null;
      }
      cache.set(key, read);
      setMatrix(read);
    });
    return () => {
      cancelled = true;
    };
  }, [key, text, plain]);

  useEffect(() => {
    if (!matrix || !play) return;
    /* One frame with the dots still dark, so the transitions have something
       to move from — lighting them in the same paint skips the animation. */
    const raf = requestAnimationFrame(() => setLit(true));
    return () => cancelAnimationFrame(raf);
  }, [matrix, play]);

  /* Until the grid is read — and if it can never be read — the real Bitcount
     text stands in, so the word is never simply missing. */
  if (!matrix) {
    return (
      <span
        ref={probeRef}
        className={className}
        style={{ fontFamily: "var(--font-dots)", fontVariationSettings: '"CRSV" 0' }}
      >
        {plain}
        <span className="text-accent">{text.slice(plain.length)}</span>
      </span>
    );
  }

  const height = (width * matrix.h) / matrix.w;
  /* The lettering hangs from the text baseline rather than sitting in the
     line box, so the line's rhythm is unchanged by how tall the dots are. */
  const drop = height * (1 - matrix.baseline);

  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-block", width: `${width}em`, height: "0.8em" }}
    >
      <span ref={probeRef} aria-hidden style={{ position: "absolute", opacity: 0, fontFamily: "var(--font-dots)" }} />
      <svg
        viewBox={`0 0 ${matrix.w} ${matrix.h}`}
        role="img"
        aria-label={text}
        style={{ position: "absolute", left: 0, bottom: `${-drop}em`, width: "100%" }}
      >
        {matrix.dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r * weight}
            fill={d.accent ? "var(--accent)" : "currentColor"}
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: lit ? "scale(1)" : "scale(0)",
              opacity: lit ? 1 : 0,
              transition: reduced
                ? "none"
                : "transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms linear",
              /* Left to right, but jittered — a clean sweep reads as a wipe
                 rather than as dots coming on. */
              transitionDelay: reduced ? "0ms" : `${(
                (d.x / matrix.w) * (1 - scatter) +
                ((Math.sin(d.x * 12.9898 + d.y * 78.233) * 43758.5453) % 1 + 1) % 1 * scatter
              ) * duration * 1000}ms`,
            }}
          />
        ))}
      </svg>
    </span>
  );
}
