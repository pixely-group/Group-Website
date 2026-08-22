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
        <div className="relative flex flex-col beside:block beside:min-h-[clamp(450px,54vw,730px)]">
          {/* Nothing in this column takes pointer events. Beside the globe it
              sits over it, so anything here that accepted them took them from
              the globe underneath — which is where dragging and hovering both
              died, in the band where the headline crosses it.

              No width cap on the column. `max-w-md` is a fixed 28rem while
              the heading's measure is 14ch of a font that grows with the
              viewport — so past a certain width the cap won and broke the
              line into "on / every" instead of "on every". The heading and
              the paragraph carry their own measures, exactly the ones they
              had before the globe arrived, and nothing above them overrides
              it. */}
          <div className="pointer-events-none relative z-10 flex flex-col justify-center beside:min-h-[clamp(450px,54vw,730px)]">
            <p className="type-label section-index mb-6 w-max text-(--muted)">
              05 — Global
            </p>
            <h2
              data-globe-avoid
              className="type-headline text-big max-w-[14ch] text-balance"
            >
              Algeria, on every corridor.
            </h2>
            <p className="mt-7 max-w-sm text-[0.95rem] leading-relaxed text-(--muted)">
              Pixely is built for Algeria and connects it outward. Every
              corridor here runs to Algiers, so value moves between it and the
              markets Algerian businesses actually trade with.
            </p>
          </div>

          {/* Stacked, the globe follows the words rather than lying under
              them. A sphere is fitted to the shorter axis of its box, so the
              box is made wider than it is tall and the slack that leaves at
              the sides is where the city names go: full-column, the sphere
              ran to both edges and Tehran, Doha and Johannesburg were cut off
              by the overlay. It bleeds through the section's own padding to
              widen that slack without shrinking the globe.

              Beside the words it goes back to where it was — absolute, out to
              -6%, and sized by the row's own height. */}
          <div className="-mx-6 mt-12 h-[clamp(300px,80vw,600px)] w-[calc(100%+3rem)] sm:-mx-10 sm:w-[calc(100%+5rem)] beside:absolute beside:inset-y-0 beside:-right-[6%] beside:mx-0 beside:mt-0 beside:h-auto beside:w-[64%]">
            <Globe className="h-full w-full" />
          </div>
        </div>

        {/* Under the globe, wherever the globe is. */}
        <div className="w-full beside:ml-auto beside:-mr-[6%] beside:w-[64%]">
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
