"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/lib/hooks";

/**
 * The last word of the headline, cycling. All three finish the same sentence —
 * "financial services without ..." — and the second and third are the deck's
 * own words for the problem: the manifesto names paper, branches and waiting
 * as what money moves through here.
 *
 * Length is a hard constraint, not a preference. The hero's type scale is
 * solved against "Financial", which sets at 767px, and the line has to stay
 * clear of the device column. Measured in the real face at the real size:
 * friction 715, waiting 649, paper 518 — against paperwork at 964 and
 * branches at 851, either of which runs past the device.
 */
const WORDS = ["friction", "waiting", "paper"] as const;

const HOLD = 2600;

export default function RotatingWord({ className }: { className?: string }) {
  const [i, setI] = useState(0);
  /** The word on its way out, kept alive so the two overlap. */
  const [leaving, setLeaving] = useState<number | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setI((n) => {
        setLeaving(n);
        return (n + 1) % WORDS.length;
      });
    }, HOLD);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    /* The h1 carries an aria-label, so what screen readers get is the whole
       sentence with the first word — the rotation is decoration on top of a
       line that already reads. */
    <span className={className}>
      {/* Keyed, so each word is a fresh element and the keyframes run again.
          CSS animations rather than transitions on state: this rotates on a
          timer, and a transition would need a frame at the old value first. */}
      <span className="relative inline-block align-baseline">
        {/* Out of flow, so the line's width follows the incoming word rather
            than jumping to whichever of the two is wider. */}
        {!reduced && leaving !== null && leaving !== i && (
          <span
            key={`out-${leaving}`}
            aria-hidden
            className="word-cycle-leaving absolute top-0 left-0 whitespace-nowrap"
          >
            {WORDS[leaving]}
          </span>
        )}
        <span key={reduced ? "static" : `in-${i}`} className="word-cycle inline-block">
          {WORDS[reduced ? 0 : i]}
        </span>
      </span>
      .
    </span>
  );
}
