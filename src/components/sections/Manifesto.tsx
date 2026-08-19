"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText } from "@/lib/gsap";

/**
 * Scroll-scrubbed manifesto: words resolve from faint to full as the
 * statement passes through the viewport.
 */
export default function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    if (!section || !text) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: SplitText | undefined;
    const ctx = gsap.context(() => {
      split = new SplitText(text, { type: "words" });
      gsap.fromTo(
        split.words,
        { opacity: 0.13 },
        {
          opacity: 1,
          stagger: 0.06,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 72%",
            end: "center 38%",
            scrub: 0.4,
          },
        },
      );
    }, section);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      data-theme="ink"
      /* The copy starts well down the section, so the device has the room to
         travel, square up and grow before the first line reaches it. At 4rem
         the copy was landing on it 200px of scroll before it had even parked,
         which left the animation fighting the text for the same space. */
      className="relative bg-theme px-6 py-[22vh] text-theme sm:px-10 lg:px-14 lg:pt-[15rem]"
    >
      <h2 className="sr-only">Why Pixely exists</h2>
      {/* One centred column rather than a left-aligned block with the right
          half empty. The text stays ranged left inside it: this is a
          statement, and a 60rem measure set centred would cost more in
          readability than the balance is worth. */}
      {/* Above the device, which is fixed at z-30. The section's own
          background stays below it, so the device is seen against the ink and
          the copy is read against the device. */}
      <div className="relative z-40 mx-auto max-w-[60rem]">
        <p className="type-label section-index mb-12 text-(--muted)" aria-hidden>
          01 — Manifesto
        </p>
        <p
          ref={textRef}
          className="text-[clamp(1.6rem,3.4vw,3.1rem)] leading-[1.28] font-medium tracking-[-0.01em]"
        >
          A payment is <em className="type-serif">data</em>. So is an{" "}
          <em className="type-serif">identity</em>. In Algeria both still move
          through paper, branches and waiting — proved once, then proved again
          for every institution that asks. We are building the platform where
          both move at the speed of the{" "}
          <em className="type-serif">network</em>.
        </p>
        <div className="mt-20 flex flex-col gap-3 border-t border-(--line) pt-6 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="type-label text-(--faint)">
            Today — paper, branches, waiting
          </p>
          <p className="type-label text-accent">Pixely — payment and identity, one platform</p>
        </div>
      </div>
    </section>
  );
}
