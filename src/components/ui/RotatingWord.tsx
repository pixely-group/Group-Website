"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/lib/hooks";

/**
 * The last word of the headline, typed and retyped. All three finish the
 * same line — "Make money move ..." — and only the word itself moves:
 * "Move" is set once in the display face and stays there, so the typing has
 * one short word to do and the caret works across a few characters.
 *
 * "Move" takes an adverb, so each word finishes the verb rather than
 * restating it — the line says what happens to the money, and the word says
 * how. Lowercase, because the word is a continuation of the line above it
 * and not a heading of its own; the italic serif is what sets it apart.
 *
 * The mechanics are the logo's, exactly: the same flat cadence — typing
 * deliberate, erasing quick — the same in-flow caret that moves because the
 * letters do, and the same rule for the blink: the dot flashes only while a
 * full word stands, and is solid whenever letters are moving. The ramps,
 * glides and letter-fades this used to carry are gone; the logo proved the
 * plain version reads better, and the two carets should be one instrument.
 *
 * The count is not fixed; the cycle is however many are listed here.
 */
const WORDS = ["instantly", "securely", "your way"] as const;

/** Per character. Typing keeps the logo's deliberate 92; erasing runs at
 *  28 — under two frames a letter, so a nine-letter word comes away in a
 *  quarter of a second and the erase reads as one smooth sweep rather than
 *  ticks. The asymmetry is the point: a hand lays letters down and brushes
 *  them away. */
const TYPE_MS = 92;
const ERASE_MS = 28;
/** How long a finished word stands — blinking — before it is taken back. */
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

    const wait = atFull
      ? HOLD
      : atEmpty
        ? TURNAROUND
        : deleting
          ? ERASE_MS
          : TYPE_MS;

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

  /* Standing: a full word on show and nothing moving. The only state in
     which the caret blinks — the same rule the logo keeps. */
  const standing = reduced || (!deleting && text === WORDS[index]);

  /* The h1 carries an aria-label, so what a screen reader gets is the whole
     sentence with the first word — the typing is decoration on a line that
     already reads without it. */
  return (
    <span className={className}>
      {/* A non-breaking space, because one of these is two words and an
          ordinary space is trimmed at the end of a line box — so halfway
          through typing "your way" the space would vanish and the caret
          would step back over it. */}
      <span>{(reduced ? WORDS[0] : text).replace(" ", "\u00a0")}</span>
      {/* The full stop doubles as the caret. Drawn rather than set: a period
          in this face is small and slanted, and this mark has to end a line
          of display caps and be seen blinking from across the page. */}
      <span
        aria-hidden
        className={`caret-dot ${standing ? "at-rest" : ""}`}
      />
    </span>
  );
}
