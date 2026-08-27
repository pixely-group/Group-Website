"use client";

import { useEffect, useRef } from "react";

import FitText from "@/components/ui/FitText";
import { useFinePointer } from "@/lib/hooks";

/**
 * The footer wordmark, traced letter by letter.
 *
 * All this does is say which letter the pointer is actually on; the effect
 * itself is CSS, hung off `.is-lit`. Keeping the two apart is the point — the
 * letter stays live text, so the outline the trace draws is the font's own
 * glyph rather than an approximation of it.
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
/** How far off a stroke the pointer may be and still count, in CSS pixels.
 *  A stroke of this wordmark is a few pixels wide at most sizes, and asking
 *  the reader to land on it exactly is a different thing from asking them not
 *  to trigger it from inside a counter — the hole in a Y is an order of
 *  magnitude wider than this, so it stays a hole. */
const FORGIVE = 4;
/** Alpha above which a pixel counts as ink. Low, because the glyph edges are
 *  anti-aliased and the edge should feel live rather than walled. */
const INK = 40;
/** How long the dot holds the line alone before the letters arrive. A blink
 *  is 1.1s, so this is a little over one full cycle — long enough to read as
 *  a cursor waiting rather than as a stutter before the word. */
const HOLD_MS = 1300;
/** Per letter. Slower than the navigation's 92, because these are six
 *  glyphs the width of the page rather than six at 17px. */
const WRITE_MS = 110;

export default function WordmarkTrace({
  text,
  dot = false,
}: {
  text: string;
  /** End the line with the brand's square full stop. Always in accent, never
   *  traced: it is the lit pixel, and it is already lit. The trace canvas
   *  only inks characters, so the pointer passing over the square correctly
   *  lights nothing. */
  dot?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  /* The footer wordmark writes itself when the reader reaches it: the dot
     alone first, blinking, then the letters after it, left to right.

     The letters are hidden with visibility, not display, so they keep their
     boxes — and the dot is walked along the line with a transform instead of
     being carried there by the layout. Removing them from flow was the
     obvious way to make the dot travel and it was wrong twice over: FitText
     re-fits on document.fonts.ready, which lands after this effect, so it
     measured a line holding nothing but the dot and scaled the font until
     that filled the page — a 675px full stop on a 3097px line. Keeping the
     boxes means every re-fit, and the trace canvas under it, still measure
     the whole word. */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const letters = [...host.querySelectorAll<HTMLElement>("[data-wm-letter]")];
    const dot = host.querySelector<HTMLElement>("[data-trace-dot]");
    if (!letters.length || !dot) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    letters.forEach((el) => {
      el.style.visibility = "hidden";
    });
    dot.classList.add("is-blinking");

    const timers: number[] = [];

    /** Where the dot sits once k letters have been written, as a shift from
     *  its home at the end of the word. Measured at the moment writing
     *  starts, so the fit has long since settled. */
    const shiftFor = (k: number, margin: number, home: number) =>
      (k === 0
        ? letters[0].getBoundingClientRect().left - margin
        : letters[k - 1].getBoundingClientRect().right) - home;

    const write = () => {
      const margin = parseFloat(getComputedStyle(dot).marginLeft) || 0;
      const home = letters[letters.length - 1].getBoundingClientRect().right;

      /* Placed before the first letter appears, so the caret is already
         waiting at the start of the line rather than jumping there. */
      dot.style.transform = `translateX(${shiftFor(0, margin, home)}px)`;
      /* A caret does not glide, but at this size an instant jump of a
         hundred-odd pixels reads as a flicker. Short enough to still be a
         jump. */
      dot.style.transition = "transform 70ms var(--ease-swift)";
      /* Stills as soon as it starts writing, the way the navigation's caret
         does — a cursor blinks while it waits, not while it types. */
      dot.classList.remove("is-blinking");

      letters.forEach((el, i) => {
        timers.push(
          window.setTimeout(
            () => {
              el.style.visibility = "";
              dot.style.transform = `translateX(${shiftFor(i + 1, margin, home)}px)`;
              if (i === letters.length - 1) {
                /* Home. Cleared rather than set to zero, so nothing of this
                   is left on the element for the trace to inherit. */
                dot.style.transform = "";
                dot.style.transition = "";
              }
            },
            (i + 1) * WRITE_MS,
          ),
        );
      });
    };

    /* Once. The word writing itself every time the reader passes the foot of
       the page would be a tic rather than an arrival. */
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        timers.push(window.setTimeout(write, HOLD_MS));
      },
      { threshold: 0.4 },
    );
    io.observe(host);

    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
      letters.forEach((el) => {
        el.style.visibility = "";
      });
      dot.classList.remove("is-blinking");
      dot.style.transform = "";
      dot.style.transition = "";
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !fine) return;

    let letters: HTMLElement[] = [];
    let line: HTMLElement | null = null;
    let field: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    /* The alpha channel, lifted out once. Read per move instead and every
       pointer event costs a getImageData, which is far too expensive to then
       do it twenty times along a path. */
    let alpha: Uint8ClampedArray | null = null;
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
      /* Canvas takes the keyword but not the percentage, and the keyword is
         not the same width — `expanded` got within about 75% of the real
         advance and no closer, so every glyph came out narrower than the one
         on screen and a band down the right of each letter was dead. */
      if ("fontStretch" in ctx && cs.fontStretch === "125%") {
        (ctx as CanvasRenderingContext2D & { fontStretch: string }).fontStretch =
          "expanded";
      }
      if ("letterSpacing" in ctx) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string })
          .letterSpacing = cs.letterSpacing;
      }
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#fff";
      /* So each glyph is stretched to the advance its own box reports. The
         stems come out a shade lighter than a true wdth axis would draw them,
         which costs nothing here: this canvas is never seen, and what it has
         to get right is the silhouette — where the strokes are and where the
         holes are. */
      /* What is on screen, not what is in the markup. type-display sets
         text-transform: uppercase, so the wordmark reads PIXELY while its
         text nodes still say Pixely — and the canvas was drawing a lowercase
         l against an L on screen. Different glyph, different width: that
         letter's box is 187px and the l it was testing against is a stem
         barely half of it, which is why parts of some letters answered and
         parts of others did not. */
      const cased = (ch: string) =>
        cs.textTransform === "uppercase"
          ? ch.toUpperCase()
          : cs.textTransform === "lowercase"
            ? ch.toLowerCase()
            : ch;

      for (const el of letters) {
        const r = el.getBoundingClientRect();
        const ch = cased(el.dataset.wmLetter ?? "");
        const advance = ctx.measureText(ch).width;
        if (!advance) continue;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(r.left - box.left, 0);
        ctx.scale(r.width / advance, 1);
        ctx.fillText(ch, 0, baseline);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      alpha = ctx.getImageData(0, 0, field.width, field.height).data;
    };

    /** Which letter the pointer is actually touching, or -1.
     *
     *  The canvas holds the word's shape in the word's own coordinates, so
     *  where that word currently sits has to be asked for now rather than
     *  remembered from when it was drawn. It is 20,000px down the page: cache
     *  the origin at build time and every lookup lands off the canvas, which
     *  is exactly what it did. */
    const at = (px: number, py: number) => {
      if (!alpha || !field) return 0;
      if (px < 0 || py < 0 || px >= field.width || py >= field.height) return 0;
      return alpha[(py * field.width + px) * 4 + 3];
    };

    /** Ink under this point, or within FORGIVE of it. */
    const inkNear = (px: number, py: number) => {
      if (at(px, py) > INK) return true;
      const r = Math.round(FORGIVE * dpr);
      return (
        at(px + r, py) > INK ||
        at(px - r, py) > INK ||
        at(px, py + r) > INK ||
        at(px, py - r) > INK
      );
    };

    const letterAt = (clientX: number) =>
      letters.findIndex((el) => {
        const b = el.getBoundingClientRect();
        return clientX >= b.left && clientX < b.right;
      });

    /* A pointer does not travel, it teleports: pointermove reports where the
       cursor is now, and between two reports it can have crossed the whole
       letter. Testing only the latest point means a quick sweep steps clean
       over a stroke three pixels wide and nothing lights — which is what
       "doesn't work every time" was.

       So the segment since the last report is walked, from the cursor
       backwards, and the first ink along it wins. Backwards because if the
       sweep crossed two letters, the one it is on now is the one meant. */
    const inkAlong = (
      toX: number,
      toY: number,
      fromX: number,
      fromY: number,
    ) => {
      if (!line || !field) return -1;
      const box = line.getBoundingClientRect();
      const x1 = Math.round((toX - box.left) * dpr);
      const y1 = Math.round((toY - box.top) * dpr);
      const x0 = Math.round((fromX - box.left) * dpr);
      const y0 = Math.round((fromY - box.top) * dpr);
      const span = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.min(32, Math.max(1, Math.round(span / (2 * dpr))));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = Math.round(x1 + (x0 - x1) * t);
        const py = Math.round(y1 + (y0 - y1) * t);
        if (!inkNear(px, py)) continue;
        const hit = letterAt(box.left + px / dpr);
        if (hit >= 0) return hit;
      }
      return -1;
    };

    let lit = -1;
    let fromX: number | null = null;
    let fromY: number | null = null;
    const onMove = (e: PointerEvent) => {
      const i = inkAlong(
        e.clientX,
        e.clientY,
        fromX ?? e.clientX,
        fromY ?? e.clientY,
      );
      fromX = e.clientX;
      fromY = e.clientY;
      if (i === lit) return;
      if (lit >= 0) letters[lit]?.classList.remove("is-lit");
      lit = i;
      /* Removed and re-added rather than toggled, so re-entering a letter
         restarts the trace instead of leaving it finished. */
      if (i >= 0) {
        const el = letters[i];
        el.classList.remove("is-lit");
        void el.offsetWidth;
        el.classList.add("is-lit");
      }
    };
    const onLeave = () => {
      if (lit >= 0) letters[lit]?.classList.remove("is-lit");
      lit = -1;
      fromX = null;
      fromY = null;
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
      letters.forEach((el) => el.classList.remove("is-lit"));
    };
  }, [text, fine]);

  return (
    <div ref={hostRef}>
      <FitText
        className="type-display leading-[0.78] select-none"
        letterClassName="wordmark-letter"
        after={
          dot ? (
            <span
              aria-hidden
              data-trace-dot
              className="inline-block bg-accent"
              style={{ width: "0.17em", height: "0.17em", marginLeft: "0.07em" }}
            />
          ) : undefined
        }
      >
        {text}
      </FitText>
    </div>
  );
}
