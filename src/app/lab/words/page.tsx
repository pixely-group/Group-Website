"use client";

import RotatingWord from "@/components/ui/RotatingWord";
import SwappingWord from "@/components/ui/SwappingWord";

/**
 * The two rotating words, at hero size, in the hero's own line — so they are
 * being judged against the thing they have to live in rather than against
 * each other in the abstract.
 *
 * Both carry the same dot, so what differs between them is only the motion.
 */
export default function WordsLab() {
  return (
    <main
      data-theme="ink"
      className="min-h-[100svh] bg-ink px-6 py-16 text-bone sm:px-10 lg:px-14"
    >
      <p className="type-label section-index mb-3 text-(--muted)">
        Pixely — rotating word
      </p>
      <p className="mb-16 max-w-xl text-[0.9rem] leading-relaxed text-(--muted)">
        Same words, same face, same dot. One is typed a character at a time
        with the dot as its caret; the other swaps the word whole behind a
        clipped box, the way the Salient reference does — one long eased move
        rather than fifteen small ones.
      </p>

      {[
        {
          label: "A — typed",
          note: "Character by character. The dot is the caret: it holds still while it works, blinks on the finished word, and slides back through the word as it is erased. 94ms a character give or take a third; the erase accelerates from 88ms to 22.",
          // Carries its own dot, because there the dot is the caret.
          node: (
            <RotatingWord className="type-serif-inherit text-signal normal-case" />
          ),
        },
        {
          label: "B — swapped",
          note: "Whole word. It rises out through the top of a clipped box while the next rises in underneath, and the box changes width on the same clock so the line re-flows around it. 800ms on cubic-bezier(0.2, 1, 0.3, 1).",
          // Carries its own dot too, but inside each word rather than after
          // the box — so the full stop swaps with the phrase it belongs to.
          node: (
            <SwappingWord className="type-serif-inherit text-signal normal-case" />
          ),
        },
      ].map(({ label, note, node }) => (
        <section key={label} className="mb-20 border-t border-(--line) pt-10">
          <p className="type-label mb-6 text-(--faint)">{label}</p>
          <h2 className="type-display -ml-[0.06em] text-[clamp(2.4rem,7vw,4.6rem)] leading-[0.94]">
            {/* The mask the hero gives this line, so descenders behave here
                exactly as they do there. */}
            <span className="-mb-[0.14em] block overflow-hidden pb-[0.2em]">
              <span className="block">for {node}</span>
            </span>
          </h2>
          <p className="mt-8 max-w-xl text-[0.85rem] leading-relaxed text-(--muted)">
            {note}
          </p>
        </section>
      ))}
    </main>
  );
}
