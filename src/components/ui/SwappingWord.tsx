"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/lib/hooks";

/**
 * The rotating word, swapped whole instead of typed.
 *
 * Built the way the Salient reference builds it, because that is what was
 * being asked for: every word occupies the same clipped box, one rises out
 * through the top of it while the next rises in from underneath, and the box
 * itself changes width on the same clock so the line re-flows around the new
 * word rather than jumping to it. One long eased move, not fifteen small
 * ones — which is the whole of why it reads as fluid.
 *
 * The dot travels inside the word rather than after it. It is the word's
 * full stop, and a whole-word swap has nowhere to put a mark that belongs to
 * the phrase but sits outside it: the box cannot be the new word's width
 * before the new word is there, so a dot parked after it either laps onto
 * the incoming letters or jumps once they land. Carried within, it leaves
 * with one word and arrives with the next, and neither happens.
 */
const WORDS = ["data", "identity", "network"] as const;

/** How long a word stands before it is swapped. */
const HOLD = 2600;
/** The move itself, in ms — matched to the reference, curve included. It is
 *  long on purpose: the length is what makes it read as one gesture. */
const MOVE = 800;

export default function SwappingWord({ className }: { className?: string }) {
  const [active, setActive] = useState(0);
  /** The word on its way out. Cleared once it has gone, which drops it back
   *  below the box unseen — otherwise it would return from above next time,
   *  having never come down. */
  const [leaving, setLeaving] = useState<number | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = useReducedMotion();

  /* The box is as wide as the word standing in it. Measured rather than
     guessed, and re-measured on resize because the headline is fluid. */
  useLayoutEffect(() => {
    const measure = () => {
      const el = itemRefs.current[active];
      if (el) setWidth(el.getBoundingClientRect().width);
    };
    measure();
    const ro = new ResizeObserver(measure);
    itemRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [active]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => {
      setLeaving(active);
      setActive((i) => (i + 1) % WORDS.length);
    }, HOLD);
    return () => window.clearTimeout(id);
  }, [active, reduced]);

  useEffect(() => {
    if (leaving === null) return;
    const id = window.setTimeout(() => setLeaving(null), MOVE);
    return () => window.clearTimeout(id);
  }, [leaving]);

  return (
    <span
      className={`swap-word ${className ?? ""}`}
      style={width === null ? undefined : { width }}
    >
      {/* Holds the box open and keeps the baseline where the surrounding
          line expects it; the words themselves are all out of flow. */}
      <span className="swap-word__sizer" aria-hidden>
        {WORDS[active]}
        <span className="caret-dot" />
      </span>
      {WORDS.map((word, i) => (
        <span
          key={word}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          aria-hidden={i !== active}
          className={`swap-word__item${
            i === active ? " is-in" : i === leaving ? " is-out" : ""
          }`}
        >
          {word}
          <span aria-hidden className="caret-dot" />
        </span>
      ))}
    </span>
  );
}
