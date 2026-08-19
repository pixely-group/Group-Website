"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useMediaQuery, useReducedMotion } from "@/lib/hooks";

const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

/**
 * The device is fixed to the viewport rather than parked inside the hero,
 * because it has to outlive it — it rides the scroll out of the hero and into
 * the manifesto, and an element positioned inside a section cannot leave it.
 *
 * Two stages share one scrub:
 *   0 → 1   right column to the centre of the manifesto, turning a full circle
 *   after   held at centre until the manifesto leaves, then it goes with it
 *
 * The turn is a full 360 rather than a half, so the device arrives facing the
 * reader exactly as it left — which is why the back had to be built.
 */
export default function TravellingDevice() {
  const holderRef = useRef<HTMLDivElement>(null);
  const [showcase, setShowcase] = useState<"cards" | null>(null);
  const reduced = useReducedMotion();
  /** Below lg there is no column to start from and no room to travel. */
  const enabled = useMediaQuery("(min-width: 1024px)");
  const roomy = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || !enabled) return;

    const hero = document.querySelector("#top");
    const manifesto = document.querySelector("#manifesto");
    if (!hero || !manifesto) return;

    if (reduced) {
      gsap.set(holder, { opacity: 1, x: 0, y: 0, rotateY: 0 });
      return;
    }

    let ro: ResizeObserver | undefined;

    const ctx = gsap.context(() => {
      /* Measured per refresh rather than assumed: the travel is the distance
         from where the device rests to the middle of the viewport, so it has
         to be read off the page, not written down. */
      let dx = 0;
      let dy = 0;
      const measure = () => {
        /* Read with the tween's own transform removed, or each refresh
           measures from wherever the last one left it. */
        const prev = holder.style.transform;
        holder.style.transform = "none";
        const box = holder.getBoundingClientRect();
        holder.style.transform = prev;
        dx = window.innerWidth / 2 - (box.left + box.width / 2);
        dy = window.innerHeight / 2 - (box.top + box.height / 2);
      };
      measure();

      /* The device is imported dynamically and sizes itself after mount, so
         the first measurement catches a narrower box — and because the holder
         is anchored to the right, narrower also means further right. Left
         alone it settled 117px left of centre. */
      ro = new ResizeObserver(() => {
        measure();
        ScrollTrigger.refresh();
      });
      ro.observe(holder);

      const travel = gsap.timeline({
        scrollTrigger: {
          /* Anchored to the manifesto, not the hero: "the hero's bottom" is
             one viewport down, so every sensible-looking hero start resolves
             to scroll 0 and the device is already mid-turn before the reader
             has scrolled at all. */
          trigger: manifesto,
          start: "top 80%",
          end: "center center",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefresh: measure,
          /* Fires exactly when the turn completes, which is what the screen
             change is meant to wait for. */
          onLeave: () => setShowcase("cards"),
          onEnterBack: () => setShowcase(null),
        },
      });

      travel.to(holder, {
        x: () => dx,
        y: () => dy,
        scale: 0.85,
        rotateY: 360,
        ease: "none",
        duration: 1,
      });

      /* The device lands on top of the statement, so the statement gets out
         of its way. The reader has the whole first half of the travel to read
         it; by the time the device arrives the section has handed over. */
      const statement = manifesto.querySelector("p:not(.type-label)")?.parentElement;
      if (statement) {
        gsap.to(statement, {
          opacity: 0.08,
          ease: "none",
          scrollTrigger: {
            trigger: manifesto,
            start: "top 42%",
            end: "center center",
            scrub: 0.6,
          },
        });
      }

      /* Held at centre through the manifesto, then it leaves with the section
         it came to visit. */
      gsap.to(holder, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: manifesto,
          start: "bottom 55%",
          end: "bottom 18%",
          scrub: true,
        },
      });
    });

    return () => {
      ro?.disconnect();
      ctx.revert();
    };
  }, [enabled, reduced, roomy]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden={showcase === "cards" ? undefined : undefined}
      /* Matches the column the hero used to hold it in, so it starts exactly
         where it always sat. `perspective` lives here so the turn has depth;
         on the device itself it would be re-applied per frame by its own
         pointer loop. */
      className="pointer-events-none fixed top-[88px] right-[12.4%] bottom-[192px] z-30 hidden items-center lg:flex"
      style={{ perspective: 2200 }}
    >
      <div
        ref={holderRef}
        className="pointer-events-auto h-full max-h-[500px] xl:max-h-[620px]"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        <HeroDevice
          shift={roomy ? 24 : 5}
          showcase={showcase}
          className="h-full"
        />
      </div>
    </div>
  );
}
