"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";

const GlobeScene = dynamic(() => import("@/components/three/GlobeScene"), {
  ssr: false,
});

/**
 * The globe, turned to face Algeria. It replaced a flat corridor map of
 * twelve financial centres, which was the right picture for a settlement
 * network spanning time zones and the wrong one for a platform being built
 * for one country.
 */
export default function GlobalCorridors() {
  const sectionRef = useRef<HTMLElement>(null);
  /* The scene only runs while the section is on screen — it is a long way
     down the page, and a GL loop spinning behind six other sections is work
     nobody sees. */
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    /* Generous margins either side, so the globe is already running by the
       time it is scrolled to rather than starting up in view. */
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "60% 0px 60% 0px" },
    );
    io.observe(section);

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
    return () => {
      io.disconnect();
      c.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="global"
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 py-[15vh] text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="type-label section-index mb-6 text-(--muted)">
              05 — Algeria
            </p>
            <h2 className="type-headline text-big max-w-[14ch] text-balance">
              One country, end to end.
            </h2>
          </div>
          <p className="max-w-sm pb-2 text-[0.95rem] leading-relaxed text-(--muted)">
            Pixely is an Algerian fintech startup building the next generation
            of financial infrastructure for Algeria — payments, identity and
            intelligence on one platform, from Algiers to Tamanrasset.
          </p>
        </div>

        <div className="relative mt-14 h-[clamp(340px,50vw,600px)] overflow-hidden">
          <GlobeScene active={inView} reduced={reduced} />
          <div
            className="absolute inset-0"
            role="img"
            aria-label="A globe turned to face Algeria, its border drawn and its cities linked to Algiers"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-(--line)"
          />
        </div>

        <dl className="mt-14 grid gap-px border-t border-(--line) sm:grid-cols-2 lg:grid-cols-4">
          {/* The deck publishes no figures, and this is a real company —
              these are what it says the platform does, not invented counts. */}
          {[
            ["Payments", "Real time, not overnight"],
            ["Identity", "Proved once, trusted after"],
            ["Compliance", "Regulatory-ready by construction"],
            ["Algeria", "Where it is being built"],
          ].map(([value, label]) => (
            <div key={label} data-corridor-stat className="pt-6">
              <dt className="type-headline text-[1.6rem] leading-none font-medium tracking-[-0.02em]">
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
