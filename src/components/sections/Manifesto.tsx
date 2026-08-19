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
      className="relative bg-theme px-6 py-[22vh] text-theme sm:px-10 lg:px-14"
    >
      <h2 className="sr-only">Why Pixely exists</h2>
      {/* One centred column rather than a left-aligned block with the right
          half empty. The text stays ranged left inside it: this is a
          statement, and a 60rem measure set centred would cost more in
          readability than the balance is worth. */}
      <div className="mx-auto max-w-[60rem]">
        <p className="type-label section-index mb-12 text-(--muted)" aria-hidden>
          01 — Manifesto
        </p>
        <p
          ref={textRef}
          className="text-[clamp(1.6rem,3.4vw,3.1rem)] leading-[1.28] font-medium tracking-[-0.01em]"
        >
          A dollar is <em className="type-serif">data</em>. But it still moves
          through systems built when data traveled by{" "}
          <em className="type-serif">mail</em> — batch files, cutoff windows,
          three-day settlement. We build the rails money{" "}
          <em className="type-serif">deserves</em>.
        </p>
        <div className="mt-20 flex flex-col gap-3 border-t border-(--line) pt-6 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="type-label text-(--faint)">
            Legacy rail latency — T+3 days
          </p>
          <p className="type-label text-accent">Pixely — T+184 ms</p>
        </div>
      </div>
    </section>
  );
}
