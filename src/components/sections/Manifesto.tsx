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
      className="relative bg-theme px-6 pt-[clamp(44px,6vh,76px)] pb-[22vh] text-theme sm:px-10 lg:px-14 beside:pt-[clamp(80px,12vh,144px)]"
    >
      <h2 className="sr-only">Why Pixely exists</h2>

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
