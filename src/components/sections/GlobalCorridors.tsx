"use client";

import { useEffect, useRef } from "react";

import Globe from "@/components/ui/Globe";
import { gsap } from "@/lib/gsap";

/**
 * The corridors, on a globe.
 *
 * It was a flat map cut on Algiers, and a flat map has to choose a meridian to
 * tear the world along — which put half of Pixely's corridors running off one
 * edge and back in the other. A sphere has no edge to tear, so the corridors
 * are simply short or long, and the one the section is about is wherever you
 * turn it to.
 */
export default function GlobalCorridors() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const c = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(section.querySelectorAll("[data-corridor-stat]"), {
          opacity: 0,
          y: 22,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 62%" },
        });
      });
      return () => mm.revert();
    }, section);
    return () => c.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="global"
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 py-[15vh] text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-7xl">
        {/* The globe is the section, and the words sit on it. Two columns
            put a ceiling on how large it could be — it had to end where the
            text began — so it is a layer instead, taking most of the width
            and running past the container on the right. The heading is over
            it and they are allowed to overlap.

            The text keeps its pointer events, so it can still be selected;
            the globe is dragged anywhere the words are not, which is most of
            it. */}
        <div className="relative min-h-[clamp(380px,46vw,640px)]">
          <div className="absolute inset-y-0 right-[-14%] w-[86%] sm:right-[-10%] sm:w-[78%] lg:right-[-8%] lg:w-[68%]">
            <Globe className="h-full w-full" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-center">
            <p className="type-label section-index mb-6 text-(--muted)">
              05 — Global
            </p>
            <h2 className="type-headline text-big max-w-[11ch] text-balance">
              Algeria, on every corridor.
            </h2>
            <p className="mt-7 max-w-xs text-[0.95rem] leading-relaxed text-(--muted)">
              Pixely is built for Algeria and connects it outward. Every
              corridor here runs to Algiers.
            </p>
            <p aria-hidden className="type-label mt-8 text-[9px] text-(--faint)">
              Drag to turn
            </p>
            <p className="sr-only">
              A globe showing fourteen corridors running between Algiers and
              financial centres worldwide, with value moving continuously
              along each. Drag to rotate it.
            </p>
          </div>
        </div>

        <dl className="mt-14 grid gap-px border-t border-(--line) sm:grid-cols-2 lg:grid-cols-4">
          {/* The deck publishes no figures and this is a real company, so
              these say what the platform does rather than counting things
              that have not been counted. */}
          {[
            ["Payments", "Real time, not overnight"],
            ["Identity", "Proved once, trusted after"],
            ["Compliance", "Regulatory-ready by construction"],
            ["Algeria", "Where it is being built"],
          ].map(([value, label]) => (
            <div key={label} data-corridor-stat className="pt-6">
              <dt className="type-headline text-[1.5rem] leading-none font-medium tracking-[-0.02em]">
                {value}
              </dt>
              <dd className="type-label mt-3 text-(--muted)">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
