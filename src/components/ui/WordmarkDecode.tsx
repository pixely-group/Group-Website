"use client";

import { useEffect, useRef } from "react";

import FitText from "@/components/ui/FitText";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

/**
 * The footer wordmark, decoded letter by letter.
 *
 * Two problems, and they pull against each other. The effect wants live text,
 * because decoding means putting different characters in the same place. The
 * pointer wants geometry, because a letter's box is not its shape — the Y is
 * mostly a hole, and hovering the hole was setting it off.
 *
 * Nothing in the browser answers "is the pointer on the ink" for live text.
 * SVG text hit-tests by glyph cell; a clip-path made of text hit-tests as a
 * rectangle, even though clip-path gates hit-testing perfectly well for a
 * circle. So the shape is drawn to an offscreen canvas and the alpha under
 * the pointer is read instead — the text stays text, and the hit test gets
 * geometry.
 *
 * The canvas is drawn a letter at a time at each letter's own measured x and
 * the word's real baseline, rather than as one string. Canvas advances do not
 * match the DOM's here, and drawing the word in one call would let that error
 * accumulate along the line until the later letters tested against the wrong
 * shape.
 */
const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#*+=/\\<>";
/** How many characters a letter turns over before it resolves, and how long
 *  each is held. Counted rather than timed: a slow frame should cost the
 *  decode its pace, not its existence. Driven off elapsed time, one throttled
 *  tick can arrive past the whole budget and resolve the letter without ever
 *  having shown a single other glyph — which is exactly what a backgrounded
 *  pane does to it. Twelve at 38ms is the same ~460ms when frames are cheap. */
const STEPS = 12;
const TURNOVER = 38;
/** Alpha above which a pixel counts as ink. Low, because the glyph edges are
 *  anti-aliased and the edge should feel live rather than walled. */
const INK = 40;

export default function WordmarkDecode({ text }: { text: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !fine) return;

    let letters: HTMLElement[] = [];
    let line: HTMLElement | null = null;
    let field: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let dpr = 1;

    /* Redrawn whenever the wordmark is re-fitted. FitText sets the font size
       from the container, so this has to follow it rather than measure once. */
    const build = () => {
      letters = [...host.querySelectorAll<HTMLElement>("[data-wm-letter]")];
      line = letters[0]?.parentElement ?? null;
      if (!line) return;

      const box = line.getBoundingClientRect();
      if (!box.width || !box.height) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);

      field = field ?? document.createElement("canvas");
      field.width = Math.ceil(box.width * dpr);
      field.height = Math.ceil(box.height * dpr);
      ctx = field.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      /* The baseline, asked for rather than derived: a zero-sized inline-block
         aligned to it reports exactly where it sits. */
      const probe = document.createElement("span");
      probe.style.cssText =
        "display:inline-block;width:0;height:0;vertical-align:baseline";
      line.appendChild(probe);
      const baseline = probe.getBoundingClientRect().top - box.top;
      probe.remove();

      const cs = getComputedStyle(letters[0]);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, box.width, box.height);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      /* Canvas takes the keyword but not the percentage. 125% is `expanded`;
         anything else falls back to normal, which only widens the shape a
         little and never changes where the holes are. */
      if ("fontStretch" in ctx && cs.fontStretch === "125%") {
        (ctx as CanvasRenderingContext2D & { fontStretch: string }).fontStretch =
          "expanded";
      }
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#fff";
      for (const el of letters) {
        const r = el.getBoundingClientRect();
        ctx.fillText(el.dataset.wmLetter ?? "", r.left - box.left, baseline);
      }
    };

    /** Which letter the pointer is actually touching, or -1.
     *
     *  The canvas holds the word's shape in the word's own coordinates, so
     *  where that word currently sits has to be asked for now rather than
     *  remembered from when it was drawn. It is 20,000px down the page: cache
     *  the origin at build time and every lookup lands off the canvas, which
     *  is exactly what it did. */
    const inkAt = (clientX: number, clientY: number) => {
      if (!ctx || !field || !line) return -1;
      const box = line.getBoundingClientRect();
      const x = Math.floor((clientX - box.left) * dpr);
      const y = Math.floor((clientY - box.top) * dpr);
      if (x < 0 || y < 0 || x >= field.width || y >= field.height) return -1;
      if (ctx.getImageData(x, y, 1, 1).data[3] <= INK) return -1;
      return letters.findIndex((el) => {
        const r = el.getBoundingClientRect();
        return clientX >= r.left && clientX < r.right;
      });
    };

    /* One run per letter, so two letters can be resolving at once and a
       letter re-entered mid-run restarts rather than stacking. */
    const runs = new Map<number, number>();
    const decode = (i: number) => {
      const el = letters[i];
      if (!el) return;
      const real = el.dataset.wmLetter ?? "";
      window.clearInterval(runs.get(i));
      if (reduced) {
        el.classList.add("is-lit");
        return;
      }
      el.classList.add("is-lit");
      let left = STEPS;
      const id = window.setInterval(() => {
        if (left-- <= 0) {
          window.clearInterval(id);
          runs.delete(i);
          el.textContent = real;
          el.dataset.ch = real;
          return;
        }
        const ch = SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
        el.textContent = ch;
        el.dataset.ch = ch;
      }, TURNOVER);
      runs.set(i, id);
    };

    let lit = -1;
    const onMove = (e: PointerEvent) => {
      const i = inkAt(e.clientX, e.clientY);
      if (i === lit) return;
      if (lit >= 0) letters[lit]?.classList.remove("is-lit");
      lit = i;
      if (i >= 0) decode(i);
    };
    const onLeave = () => {
      if (lit >= 0) letters[lit]?.classList.remove("is-lit");
      lit = -1;
    };

    const raf = requestAnimationFrame(build);
    const ro = new ResizeObserver(build);
    ro.observe(host);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    document.fonts?.ready.then(build);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      runs.forEach((id, i) => {
        window.clearInterval(id);
        const el = letters[i];
        if (el) el.textContent = el.dataset.wmLetter ?? "";
      });
    };
  }, [text, fine, reduced]);

  return (
    <div ref={hostRef}>
      <FitText
        className="type-display leading-[0.78] select-none"
        letterClassName="wordmark-letter"
      >
        {text}
      </FitText>
    </div>
  );
}
