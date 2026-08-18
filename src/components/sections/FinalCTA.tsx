"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import MagneticButton from "@/components/ui/MagneticButton";

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lines = section.querySelectorAll("[data-cta-line]");
        const fades = section.querySelectorAll("[data-cta-fade]");
        gsap.set(lines, { yPercent: 112 });
        gsap
          .timeline({
            scrollTrigger: { trigger: section, start: "top 68%" },
          })
          .to(lines, {
            yPercent: 0,
            duration: 1.15,
            stagger: 0.09,
            ease: "expo.out",
          })
          .fromTo(
            fades,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 },
            "-=0.6",
          );
      });
      return () => mm.revert();
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="start"
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 pt-[16vh] pb-[14vh] text-theme sm:px-10 lg:px-14"
    >
      {/* A last echo of the hero's flow — static, so it costs nothing. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
        viewBox="0 0 1440 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={i}
            d={`M -80 ${90 + i * 62} C 420 ${60 + i * 62 + (i % 3) * 34}, 900 ${150 + i * 54}, 1520 ${250 + i * 34}`}
            stroke="#ece9e1"
            strokeOpacity={0.05 + (i % 3) * 0.015}
            strokeWidth="1"
          />
        ))}
      </svg>

      <div className="relative mx-auto max-w-7xl">
        <p data-cta-fade className="type-label section-index mb-10 text-(--muted)">
          09 — Get started
        </p>

        <h2 className="type-display text-giant max-w-[14ch]">
          <span className="block overflow-hidden pb-[0.02em]">
            <span data-cta-line className="block">
              Build what
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-cta-line className="block">
              moves money
              <span className="text-signal">.</span>
            </span>
          </span>
        </h2>

        <div className="mt-14 grid gap-10 border-t border-(--line) pt-9 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <p
            data-cta-fade
            className="max-w-md text-[0.98rem] leading-relaxed text-(--muted)"
          >
            Talk to an engineer, not a sales development representative. We
            will map your flows, quote your corridors, and give you sandbox
            credentials in the same conversation.
          </p>
          <div data-cta-fade className="flex flex-wrap items-center gap-3">
            <MagneticButton href="#start" size="lg">
              Get started
            </MagneticButton>
            <MagneticButton href="#product" variant="outline" size="lg">
              Explore the platform
            </MagneticButton>
          </div>
        </div>

        <dl className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-3">
          {[
            ["Sandbox in minutes", "Full API surface, simulated rails"],
            ["Named integration engineer", "From first call to production"],
            ["No minimum volume", "Usage pricing until you scale"],
          ].map(([term, desc]) => (
            <div key={term} data-cta-fade>
              <dt className="text-[0.95rem] font-medium">{term}</dt>
              <dd className="type-label mt-2 text-(--faint)">{desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
