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
 * because it has to outlive it — an element positioned inside a section
 * cannot leave that section.
 *
 * It travels from the hero's right column to the middle of the manifesto and
 * stops there. It does not turn: a convincing rotation needs real geometry
 * and real lighting, and CSS 3D gives neither, so the device stays square to
 * the reader throughout.
 *
 * The manifesto is its mask. The device is clipped to that section's bottom
 * edge, so as the platform section rises it passes in front rather than the
 * device floating on over it — which is also what stops it: no fade, no exit
 * tween, it is simply covered.
 */
export default function TravellingDevice() {
  const holderRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const [showcase, setShowcase] = useState<"cards" | null>(null);
  const reduced = useReducedMotion();
  /** Below lg there is no column to start from and no room to travel. */
  const enabled = useMediaQuery("(min-width: 1024px)");
  const roomy = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    const holder = holderRef.current;
    const clip = clipRef.current;
    if (!holder || !clip || !enabled) return;

    const manifesto = document.querySelector("#manifesto");
    if (!manifesto) return;

    if (reduced) {
      gsap.set(holder, { clearProps: "all" });
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

      gsap.timeline({
        scrollTrigger: {
          /* Anchored to the manifesto, not the hero: "the hero's bottom" is
             one viewport down, so every sensible-looking hero start resolves
             to scroll 0 and the device is already moving before the reader
             has scrolled at all. */
          trigger: manifesto,
          start: "top 80%",
          end: "center center",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefresh: measure,
          /* Fires exactly when the device arrives, which is what the screen
             change is meant to wait for. */
          onLeave: () => setShowcase("cards"),
          onEnterBack: () => setShowcase(null),
        },
      }).to(holder, {
        x: () => dx,
        y: () => dy,
        scale: 0.85,
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

      /* The mask. Driven off the ticker rather than a ScrollTrigger, because
         it tracks a moving edge every frame rather than a range with two
         ends — and Lenis already runs on this clock, so the edge and the
         scroll are read in the same tick and cannot disagree.
         Clipped from the bottom only: the top edge would hide the device
         through the whole hero, where the manifesto has not arrived yet. */
      const maskToSection = () => {
        const edge = manifesto.getBoundingClientRect().bottom;
        const box = clip.getBoundingClientRect();
        const below = Math.max(0, box.bottom - edge);
        clip.style.clipPath =
          below <= 0 ? "none" : `inset(0px 0px ${Math.min(below, box.height)}px 0px)`;
      };
      maskToSection();
      gsap.ticker.add(maskToSection);
      ScrollTrigger.addEventListener("refresh", maskToSection);

      /* gsap.context does not track ticker callbacks, so this one is removed
         by hand. Returned from the callback rather than registered with
         ctx.add: ctx is still being assigned while this runs, so touching it
         here throws before initialisation and takes the page with it. */
      return () => {
        gsap.ticker.remove(maskToSection);
        ScrollTrigger.removeEventListener("refresh", maskToSection);
      };
    });

    return () => {
      ro?.disconnect();
      ctx.revert();
    };
  }, [enabled, reduced, roomy]);

  if (!enabled) return null;

  return (
    <div
      ref={clipRef}
      /* Matches the column the hero used to hold it in, so it starts exactly
         where it always sat. The clip lives on this wrapper rather than on
         the holder, so it is applied in viewport space and the travel
         transform does not drag the mask around with it. */
      className="pointer-events-none fixed top-[88px] right-[12.4%] bottom-[192px] z-30 hidden items-center lg:flex"
    >
      <div
        ref={holderRef}
        className="pointer-events-auto h-full max-h-[500px] xl:max-h-[620px]"
        style={{ willChange: "transform" }}
      >
        <HeroDevice flat shift={roomy ? 24 : 5} showcase={showcase} className="h-full" />
      </div>
    </div>
  );
}
