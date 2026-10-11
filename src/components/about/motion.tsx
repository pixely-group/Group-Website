"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";

/**
 * The service template's two performances, for the About page's own hero
 * and close. ServicePage keeps its hooks private and is not this page's to
 * edit, so they are repeated here verbatim: same masks, same eases, same
 * reduced-motion guard. If the template's choreography changes, change it
 * here too — a page that rises differently from its siblings reads as a
 * different site.
 */

/** Below the fold: lines rise from their masks as the scroll arrives,
 *  fades follow, rules draw open. */
export function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lines = root.querySelectorAll("[data-line]");
        const fades = root.querySelectorAll("[data-fade]");
        const draws = root.querySelectorAll("[data-draw]");
        gsap.set(lines, { yPercent: 112 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: "top 72%" },
        });
        tl.to(lines, {
          yPercent: 0,
          duration: 1.15,
          stagger: 0.09,
          ease: "expo.out",
        });
        if (fades.length)
          tl.fromTo(
            fades,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.85, stagger: 0.07 },
            lines.length ? "-=0.7" : 0,
          );
        if (draws.length)
          tl.fromTo(
            draws,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.9,
              stagger: 0.08,
              ease: "expo.out",
              transformOrigin: "0 50%",
            },
            "-=0.5",
          );
      });
      return () => mm.revert();
    }, root);
    return () => ctx.revert();
  }, [ref]);
}

/** On arrival: the h1 ships at opacity 0, waits for the fonts, then its
 *  lines rise and the rest fades up behind them. */
export function useHeroIntro(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const lines = root.querySelectorAll("[data-line]");
    const fades = root.querySelectorAll("[data-fade]");
    const headline = root.querySelector("h1");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([lines, fades], { yPercent: 0, y: 0, opacity: 1 });
      gsap.set(headline, { opacity: 1 });
      return;
    }

    let tl: gsap.core.Timeline | undefined;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      gsap.set(lines, { yPercent: 140 });
      gsap.set(headline, { opacity: 1 });
      tl = gsap
        .timeline({ delay: 0.1 })
        .to(lines, {
          yPercent: 0,
          duration: 1.25,
          stagger: 0.095,
          ease: "expo.out",
        })
        .fromTo(
          fades,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.07,
            ease: "power3.out",
          },
          "-=0.7",
        );
    });
    return () => {
      cancelled = true;
      tl?.kill();
    };
  }, [ref]);
}

/** The site's flowing hairlines, the field every ink chapter stands on. */
export function EchoField({ count = 11 }: { count?: number }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 1440 760"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {Array.from({ length: count }, (_, i) => (
        <path
          key={i}
          d={`M -80 ${70 + i * 62} C 420 ${40 + i * 62 + (i % 3) * 34}, 900 ${150 + i * 50}, 1520 ${260 + i * 30}`}
          stroke="#ece9e1"
          strokeOpacity={0.05 + (i % 3) * 0.015}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
