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
        {/* The globe is sized by the box's HEIGHT, not its width: the
            camera pulls back until the sphere fits the shorter axis, so a
            wide flat box leaves it small with empty space either side. That
            is why two thirds of the width still looked small — at 795x469 the
            globe could only ever be 370 across. The box is much taller now
            and reaches left under the heading, which is the overlap that was
            asked for.

            The words take no pointer events; each block of text takes its own
            back. A full-width layer over the globe is a full-width lid — it
            swallowed every drag, which is how the last one broke — so the
            layer is transparent to the pointer and only the type itself is
            not. Drag works everywhere except on the words. */}
        <div className="relative min-h-[clamp(420px,54vw,740px)]">
          <div className="absolute inset-y-0 right-0 w-[92%] sm:w-[86%] lg:w-[82%]">
            <Globe className="h-full w-full" />
          </div>

          <div className="pointer-events-none relative z-10 flex min-h-[clamp(420px,54vw,740px)] max-w-md flex-col justify-center">
            <p className="type-label section-index pointer-events-auto mb-6 w-max text-(--muted)">
              05 — Global
            </p>
            <h2 className="type-headline text-big pointer-events-auto max-w-[11ch] text-balance">
              Algeria, on every corridor.
            </h2>
            <p className="pointer-events-auto mt-7 max-w-xs text-[0.95rem] leading-relaxed text-(--muted)">
              Pixely is built for Algeria and connects it outward. Every
              corridor here runs to Algiers.
            </p>
          </div>
        </div>

        {/* Under the globe, where it was. */}
        <div className="ml-auto w-[92%] sm:w-[86%] lg:w-[82%]">
          <p aria-hidden className="type-label mt-3 text-center text-[9px] text-(--faint)">
            Drag to turn
          </p>
        </div>
        <p className="sr-only">
          A globe showing fourteen corridors running between Algiers and
          financial centres worldwide, with value moving continuously along
          each. Drag to rotate it.
        </p>

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
