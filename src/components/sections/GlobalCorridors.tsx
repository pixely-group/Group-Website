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
            wide flat box leaves it small with empty space either side and a
            taller one makes it bigger without widening anything. Height is
            the dial; the width only decides how far left it reaches under the
            heading, which it is allowed to do.

            The words take no pointer events; each block of text takes its own
            back. A full-width layer over the globe is a full-width lid — it
            swallowed every drag, which is how the last one broke — so the
            layer is transparent to the pointer and only the type itself is
            not. Drag works everywhere except on the words. */}
        <div className="relative min-h-[clamp(400px,48vw,650px)]">
          <div className="absolute inset-y-0 right-0 w-[92%] sm:w-[80%] lg:-right-[4%] lg:w-[74%]">
            <Globe className="h-full w-full" />
          </div>

          {/* Nothing in this column takes pointer events. It sits over the
              globe, so anything here that accepted them took them from the
              globe underneath — which is where dragging and hovering both
              died, in the band where the headline crosses it.

              No width cap on the column. `max-w-md` is a fixed 28rem while
              the heading's measure is 14ch of a font that grows with the
              viewport — so past a certain width the cap won and broke the
              line into "on / every" instead of "on every". The heading and
              the paragraph carry their own measures, exactly the ones they
              had before the globe arrived, and nothing above them overrides
              it. */}
          <div className="pointer-events-none relative z-10 flex min-h-[clamp(400px,48vw,650px)] flex-col justify-center">
            <p className="type-label section-index mb-6 w-max text-(--muted)">
              05 — Global
            </p>
            <h2 className="type-headline text-big max-w-[14ch] text-balance">
              Algeria, on every corridor.
            </h2>
            <p className="mt-7 max-w-sm text-[0.95rem] leading-relaxed text-(--muted)">
              Pixely is built for Algeria and connects it outward. Every
              corridor here runs to Algiers, so value moves between it and the
              markets Algerian businesses actually trade with.
            </p>
          </div>
        </div>

        {/* Under the globe, where it was. */}
        <div className="ml-auto w-[92%] sm:w-[80%] lg:-mr-[4%] lg:w-[74%]">
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
