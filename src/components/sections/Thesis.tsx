"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";

const OLD_LINES = ["The old", "financial system", "was built for", "another world."];
const NEW_LINES = ["We're building", "what comes next."];

/**
 * The turn of the argument: the old statement is struck through and wiped
 * away, and the new one rises in its place. Pinned so the exchange happens
 * in one held frame rather than as two passing sections.
 */
export default function Thesis() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const oldLines = pin.querySelectorAll("[data-old-line]");
        const newLines = pin.querySelectorAll("[data-new-line]");
        const grid = pin.querySelector("[data-grid]");
        const sweep = pin.querySelector("[data-sweep]");
        const strike = pin.querySelector("[data-strike]");
        const arc = pin.querySelector("[data-arc]");

        gsap.set(newLines, { yPercent: 115 });
        gsap.set(strike, { scaleX: 0, transformOrigin: "left center" });
        gsap.set(sweep, { scaleX: 0, transformOrigin: "left center" });
        gsap.set(arc, { opacity: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=260%",
            pin,
            scrub: 0.6,
            anticipatePin: 1,
          },
        });

        // The old claim is ruled through, then wiped.
        tl.to(strike, { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, 0.25)
          .to(grid, { opacity: 0, duration: 0.5 }, 0.45)
          .to(
            oldLines,
            {
              yPercent: -118,
              opacity: 0.25,
              duration: 0.5,
              stagger: 0.05,
              ease: "power3.in",
            },
            0.55,
          )
          .to(
            strike,
            { scaleX: 0, transformOrigin: "right center", duration: 0.35 },
            0.6,
          )
          // A single signal line crosses the frame between the two claims.
          .to(sweep, { scaleX: 1, duration: 0.35, ease: "power2.out" }, 0.7)
          .to(
            sweep,
            { scaleX: 0, transformOrigin: "right center", duration: 0.35 },
            1.05,
          )
          .to(
            newLines,
            { yPercent: 0, duration: 0.65, stagger: 0.08, ease: "expo.out" },
            0.95,
          )
          .to(arc, { opacity: 1, duration: 0.6 }, 1.1)
          .to({}, { duration: 0.5 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });
      return () => mm.revert();
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="thesis"
      data-theme="ink"
      className="relative bg-theme text-theme"
      style={{ height: reduced ? undefined : "360svh" }}
    >
      <div
        ref={pinRef}
        className={`relative flex items-center overflow-hidden px-6 sm:px-10 lg:px-14 ${
          reduced ? "py-[18vh]" : "h-[100svh]"
        }`}
      >
        {/* The old order: a rigid ruled grid. */}
        <div
          data-grid
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, rgba(236,233,225,0.07) 0 1px, transparent 1px 88px), repeating-linear-gradient(to bottom, rgba(236,233,225,0.07) 0 1px, transparent 1px 88px)",
          }}
        />
        {/* The new one: a single meridian arc. */}
        <svg
          data-arc
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full"
          viewBox="0 0 1200 700"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <ellipse
            cx="600"
            cy="350"
            rx="520"
            ry="240"
            stroke="#ece9e1"
            strokeOpacity="0.14"
            transform="rotate(-12 600 350)"
          />
          <ellipse
            cx="600"
            cy="350"
            rx="300"
            ry="140"
            stroke="#ff4d00"
            strokeOpacity="0.3"
            transform="rotate(-12 600 350)"
          />
        </svg>

        <div className="relative mx-auto w-full max-w-7xl">
          {reduced ? (
            <div className="space-y-14">
              <h2 className="type-display text-[clamp(1.85rem,6.9vw,6.25rem)] max-w-[16ch]">
                {OLD_LINES.join(" ")}
              </h2>
              <h2 className="type-display text-[clamp(1.85rem,6.9vw,6.25rem)] max-w-[16ch] text-signal">
                {NEW_LINES.join(" ")}
              </h2>
            </div>
          ) : (
            <div className="relative">
              {/* Old claim */}
              <div className="relative">
                <h2 className="type-display text-[clamp(1.85rem,6.9vw,6.25rem)]">
                  {OLD_LINES.map((line) => (
                    <span
                      key={line}
                      className="block overflow-hidden pb-[0.02em]"
                    >
                      <span data-old-line className="block whitespace-normal lg:whitespace-nowrap">
                        {line}
                      </span>
                    </span>
                  ))}
                </h2>
                <span
                  data-strike
                  aria-hidden
                  className="absolute top-1/2 -left-2 h-[3px] w-[min(100%,52ch)] bg-signal"
                />
              </div>

              {/* New claim, stacked in the same frame */}
              <h2
                className="type-display absolute inset-x-0 top-1/2 -translate-y-1/2 text-[clamp(1.85rem,6.9vw,6.25rem)]"
              >
                {NEW_LINES.map((line, i) => (
                  <span key={line} className="block overflow-hidden pb-[0.02em]">
                    <span
                      data-new-line
                      className={`block whitespace-normal lg:whitespace-nowrap ${i === 1 ? "text-signal" : ""}`}
                    >
                      {line}
                    </span>
                  </span>
                ))}
              </h2>

              <span
                data-sweep
                aria-hidden
                className="absolute top-1/2 -left-[100vw] h-px w-[200vw] bg-signal/60"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
