"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/lib/hooks";

/**
 * The last word of the headline, typed and retyped. All three finish the same
 * line — "AI-powered fintech platform for ..." — and they escalate rather
 * than list: the two things the deck says Pixely combines, and then the place
 * it is being built for.
 *
 * Capitalised, not upper-cased. The headline is set in caps and the word
 * would take them by inheritance, which is not what this face is for — the
 * manifesto sets Fraunces lowercase inline and that is the version that
 * reads. A leading capital is what gives it enough weight to end the line
 * without shouting, so the words carry their own and `normal-case` at the
 * call site keeps the headline's transform off them.
 *
 * Length is a hard constraint, not a preference: the line has to stay clear
 * of the device column, and the budget is whatever the longest Archivo line
 * above sets. At the longest word this ends around 150px short of it.
 */
const WORDS = ["Payments", "Identity", "Algeria"] as const;

/** Per character. Deleting is quicker than typing, as it is in life. */
const TYPE = 112;
const DELETE = 58;
/** How long a finished word stands before it is taken back. */
const HOLD = 2800;
/** A beat on the empty line before the next word starts. */
const TURNAROUND = 420;

export default function RotatingWord({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState<string>(WORDS[0]);
  const [deleting, setDeleting] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const word = WORDS[index];
    const atFull = !deleting && text === word;
    const atEmpty = deleting && text === "";

    const wait = atFull ? HOLD : atEmpty ? TURNAROUND : deleting ? DELETE : TYPE;

    const id = window.setTimeout(() => {
      if (atFull) setDeleting(true);
      else if (atEmpty) {
        setDeleting(false);
        setIndex((i) => (i + 1) % WORDS.length);
      } else if (deleting) setText((t) => t.slice(0, -1));
      else setText(word.slice(0, text.length + 1));
    }, wait);

    return () => window.clearTimeout(id);
  }, [text, deleting, index, reduced]);

  /* The h1 carries an aria-label, so what a screen reader gets is the whole
     sentence with the first word — the typing is decoration on a line that
     already reads without it. */
  return (
    <span className={className}>
      {reduced ? WORDS[0] : text}
      {/* The full stop doubles as the caret: it sits where the next character
          would land and blinks on a hard step, the way a terminal cursor
          does rather than a fade. */}
      <span className="caret-blink">.</span>
    </span>
  );
}
