"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";

/**
 * The last word of the headline, typed and retyped. All three finish the
 * same line — "One account, no ..." — and the sentence has to do two jobs at
 * once: say what is being sold and say what it replaces. The first line is
 * the product, the rotating word is the legacy it removes, and every frame
 * is a complete claim on its own.
 *
 * They are the manifesto's own three, less the one that cannot be used here:
 * it says money and identity still move through paper, branches and waiting.
 * Each maps to something real — branches to an identity proved once instead
 * of at every counter, forms to the same, waiting to settlement that lands
 * while the customer is still standing there.
 *
 * Lower case, and set in the italic — the same way the manifesto sets them.
 * The headline is in caps and the word would take them by inheritance, which
 * is what `normal-case` at the call site is for: the words carry whatever
 * case is written here, and nothing else decides it for them.
 *
 * Length is a hard constraint, not a preference: the line has to stay clear
 * of the device column, and the budget is whatever the longest Archivo line
 * above sets. At the longest word this ends around 150px short of it.
 */
const WORDS = ["branches", "forms", "waiting"] as const;

/** Per character, typing. A ramp, the same shape the erase runs — which is
 *  the half of this that already worked. Jitter was the wrong instinct: an
 *  uneven cadence is the opposite of a smooth one, and scattering the
 *  intervals to make it feel alive is what stopped it feeling elegant. */
const TYPE_FIRST = 132;
const TYPE_LAST = 76;
/** Deleting is quicker than typing, as it is in life — and it gathers pace.
 *  A held backspace does not tick: it hesitates on the first character and
 *  then runs. A flat rate read as a metronome dragging the word off, which is
 *  the part of this that never felt right. */
const DELETE_FIRST = 88;
const DELETE_LAST = 22;
/** How long a finished word stands before it is taken back. */
const HOLD = 2800;
/** A beat on the empty line before the next word starts. */
const TURNAROUND = 420;
/** How long the dot takes to reach a position it has just been moved to. It
 *  outlasts a character on purpose: the tween is overwritten before it lands,
 *  so the dot is always travelling rather than arriving, and the run reads as
 *  one movement instead of eight. Shorter going forward, where it has to stay
 *  near the letter it is setting down rather than trail the whole word. */
const GLIDE_BACK = 0.19;
const GLIDE_ON = 0.15;
/** A letter arrives under the dot rather than in front of it: held back
 *  until the dot has begun to move off, then brought up as it passes. */
const LETTER_IN = 0.24;
const LETTER_WAIT = 0.05;

export default function RotatingWord({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState<string>(WORDS[0]);
  const [deleting, setDeleting] = useState(false);
  const reduced = useReducedMotion();
  const textRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const lastWidth = useRef<number | null>(null);

  /* The dot slides back through the word as it is erased rather than
     stepping off it a character at a time — measured after the letter has
     gone, moved back to where it was standing, then let go.

     Only on the way back. Typing the same way puts the dot where the letter
     that just appeared now is, and it sits on top of it while it catches up:
     a caret belongs at the insertion point, and going forward there is no
     empty space for it to travel through. So it glides when the word is
     getting shorter and holds the end of it when it is growing.

     Layout effect, or it paints at the new position for a frame first. */
  useLayoutEffect(() => {
    const el = textRef.current;
    const dot = dotRef.current;
    if (!el || !dot || reduced) return;

    const width = el.getBoundingClientRect().width;
    const was = lastWidth.current;
    lastWidth.current = width;
    if (was === null || was === width) return;

    const writing = width > was;

    // Added to whatever offset it is already carrying, because the last
    // glide will not have finished — it never does.
    const carried = (gsap.getProperty(dot, "x") as number) || 0;
    gsap.set(dot, { x: carried + (was - width) });
    gsap.to(dot, {
      x: 0,
      duration: writing ? GLIDE_ON : GLIDE_BACK,
      ease: "power2.out",
      overwrite: true,
    });

    /* Going forward the dot travels across ground the letter is about to
       occupy, so the letter is brought up behind it rather than being there
       already — the dot passes over something faint and leaves it solid.
       Popping the glyph in at full strength and teleporting the dot a whole
       character clear of it is what made the writing read as a stutter next
       to the erase. */
    if (writing) {
      const letter = el.lastElementChild;
      if (letter) {
        gsap.fromTo(
          letter,
          { opacity: 0 },
          {
            opacity: 1,
            duration: LETTER_IN,
            delay: LETTER_WAIT,
            ease: "power2.out",
          },
        );
      }
    }
  }, [text, reduced]);

  useEffect(() => {
    if (reduced) return;
    const word = WORDS[index];
    const atFull = !deleting && text === word;
    const atEmpty = deleting && text === "";

    /* How far into the deletion we are, 0 at the full word and 1 at the
       last character. Cubed, so the hesitation is over quickly and most of
       the word comes away at speed. */
    const gone = 1 - text.length / Math.max(1, word.length);
    const erase =
      DELETE_LAST + (DELETE_FIRST - DELETE_LAST) * Math.pow(1 - gone, 3);

    /* And the same shape going the other way: a little deliberate on the
       first letters, settling into a pace. Squared rather than cubed, so it
       is a hand finding its rhythm rather than a machine winding up. */
    const written = text.length / Math.max(1, word.length);
    const tap =
      TYPE_LAST + (TYPE_FIRST - TYPE_LAST) * Math.pow(1 - written, 2);

    const wait = atFull ? HOLD : atEmpty ? TURNAROUND : deleting ? erase : tap;

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

  /* A caret blinks when it is waiting and holds steady while it is working.
     Blinking through the typing is what made it read as a decoration rather
     than a cursor, and it fought the letters for attention. */
  const holding = reduced || (!deleting && text === WORDS[index]);

  /* The h1 carries an aria-label, so what a screen reader gets is the whole
     sentence with the first word — the typing is decoration on a line that
     already reads without it. */
  return (
    <span className={className}>
      {/* One span per letter, so the one that has just landed can be
          brought up on its own. Keyed by position: erasing drops them off
          the end, which leaves every remaining node exactly where it was. */}
      <span ref={textRef}>
        {reduced
          ? WORDS[0]
          : text.split("").map((ch, i) => <span key={i}>{ch}</span>)}
      </span>
      {/* The full stop doubles as the caret. Drawn rather than set: a period
          in this face is small and slanted, and this mark has to end a line
          of display caps and be seen blinking from across the page. */}
      {/* Both branches spell the classes out. Tailwind finds candidates by
          scanning the source for whole tokens, and `caret-dot${…}` is not
          one — it emitted no rule for it at all, and the dot rendered as an
          empty inline span. */}
      <span
        ref={dotRef}
        aria-hidden
        className={holding ? "caret-dot caret-blink" : "caret-dot"}
      />
    </span>
  );
}
