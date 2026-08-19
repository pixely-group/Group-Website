"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { HeroBus } from "@/components/three/HeroScene";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLenis } from "@/components/chrome/SmoothScroll";
import { useMediaQuery, useReducedMotion } from "@/lib/hooks";
import MagneticButton from "@/components/ui/MagneticButton";

const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => <HeroPoster />,
});

/** Static fallback: reduced motion, WebGL unavailable, or chunk loading. */
function HeroPoster() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-ink">
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M -60 ${140 + i * 88} C 360 ${110 + i * 88 + (i % 3) * 40}, 900 ${180 + i * 80}, 1500 ${300 + i * 52}`}
            stroke="#ece9e1"
            strokeOpacity={0.07 + (i % 3) * 0.02}
            strokeWidth="1"
          />
        ))}
        <ellipse
          cx="1010"
          cy="430"
          rx="330"
          ry="120"
          stroke="#ece9e1"
          strokeOpacity="0.14"
          transform="rotate(-16 1010 430)"
        />
        <ellipse
          cx="1010"
          cy="430"
          rx="190"
          ry="64"
          stroke="#7290ff"
          strokeOpacity="0.25"
          transform="rotate(-16 1010 430)"
        />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_100%,transparent_40%,#0a0a0b_100%)]" />
    </div>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bus = useRef<HeroBus>({
    progress: 0,
    velocity: 0,
    pointer: [0, 0],
  });
  const [active, setActive] = useState(true);
  const reduced = useReducedMotion();
  const small = useMediaQuery("(max-width: 767px)");
  /** The device only has a column to stand in from lg up. Gating the mount
   *  rather than hiding it keeps its markup and its ticker off phones. */
  const hasDeviceColumn = useMediaQuery("(min-width: 1024px)");
  /** Below xl the corridor between the headline and the scroll marker is
   *  barely wider than the device, so it gets a smaller one and less room
   *  to slide. */
  const roomy = useMediaQuery("(min-width: 1280px)");
  const lenis = useLenis();

  // Pointer → NDC for the scene + subtle content parallax.
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      bus.current.pointer = [
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      ];
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  useEffect(() => {
    if (!lenis) return;
    const onScroll = ({ velocity }: { velocity: number }) => {
      bus.current.velocity = velocity;
    };
    lenis.on("scroll", onScroll);
    return () => lenis.off("scroll", onScroll);
  }, [lenis]);

  // Scroll progress + content departure.
  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          bus.current.progress = self.progress;
        },
      });
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => setActive(self.isActive),
      });
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.to(content, {
          yPercent: -12,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "78% top",
            scrub: true,
          },
        });
        // The device is nearer the reader than the type, so it leaves by
        // more. Same trigger, so the two stay in step.
        //
        // Guarded, and the effect waits for the mount: the device sits behind
        // a media query, so on the first pass this selector finds nothing and
        // GSAP tweens an empty target without complaining — the type would
        // depart on scroll and the phone would sit where it was.
        const device = section.querySelector("[data-hero-device]");
        if (device) {
          gsap.to(device, {
            yPercent: -20,
            opacity: 0,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "78% top",
              scrub: true,
            },
          });
        }
      }
    }, section);
    return () => ctx.revert();
  }, [hasDeviceColumn]);

  // Entrance choreography once fonts are ready.
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const lines = content.querySelectorAll("[data-hero-line]");
    const fades = content.querySelectorAll("[data-hero-fade]");
    const reducedNow = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const headline = content.querySelector("h1");

    if (reducedNow) {
      gsap.set([lines, fades], { yPercent: 0, y: 0, opacity: 1 });
      gsap.set(headline, { opacity: 1 });
      return;
    }

    let tl: gsap.core.Timeline | undefined;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      // Position lines below their masks before unhiding the block —
      // the h1 ships with `opacity-0` so nothing flashes pre-hydration.
      gsap.set(lines, { yPercent: 112 });
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
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: "power3.out" },
          "-=0.7",
        );
    });
    return () => {
      cancelled = true;
      tl?.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      data-theme="ink"
      aria-label="Znapy — money should move in a Znap!"
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-ink text-bone"
    >
      <div className="absolute inset-0" aria-hidden>
        {reduced ? (
          <HeroPoster />
        ) : (
          <HeroScene
            bus={bus}
            count={small ? 4500 : 14000}
            active={active}
          />
        )}
      </div>

      {hasDeviceColumn && (
        <div
          data-hero-device
          // Above the content block, not level with it. That block is
          // h-full and comes later in the DOM, so at the same z-index it
          // covers the device and swallows every click meant for the app
          // inside it. Nothing of the content reaches into this column.
          className="absolute top-[88px] right-[12.4%] bottom-[192px] z-20 flex items-center"
        >
          <HeroDevice shift={roomy ? 24 : 5} className="h-full max-h-[500px] xl:max-h-[620px]" />
        </div>
      )}

      <div
        ref={contentRef}
        className="relative z-(--z-content) flex h-full flex-col justify-end px-6 pb-9 sm:px-10 lg:px-14"
      >
        <p
          data-hero-fade
          className="type-label mb-7 text-(--muted) opacity-0"
        >
          <span className="section-index">
            Znapy — Financial infrastructure
          </span>
        </p>

        <h1 className="type-display text-hero -ml-[0.06em] opacity-0 lg:pr-[30%] lg:text-hero-aside">
          <span className="block overflow-hidden pb-[0.02em]">
            <span data-hero-line className="block">
              Money
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.02em]">
            <span data-hero-line className="block">
              should
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.02em]">
            <span data-hero-line className="block">
              move
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-hero-line className="block">
              in a{" "}
              <em className="type-serif text-[1.02em] font-normal">Znap</em>
              <span className="text-accent">!</span>
            </span>
          </span>
        </h1>

        <div className="mt-10 flex flex-col gap-8 border-t border-(--line) pt-7 md:flex-row md:items-end md:justify-between">
          <div data-hero-fade className="max-w-md opacity-0">
            <p className="text-[0.95rem] leading-relaxed text-(--muted)">
              Znapy is the settlement layer for companies that operate at
              internet speed — money that arrives in milliseconds, in any
              currency, governed entirely by code.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <MagneticButton href="#start" size="md">
                Start building
              </MagneticButton>
              <MagneticButton href="#product" variant="outline" size="md">
                Explore the platform
              </MagneticButton>
            </div>
          </div>

          <div
            data-hero-fade
            className="flex items-end justify-between gap-10 opacity-0 md:flex-col md:items-end md:gap-5"
          >
            <p className="type-label hidden leading-relaxed text-(--faint) sm:block md:text-right">
              142 currencies
              <br />
              99.995% uptime
              <br />
              24/7/365 settlement
            </p>
            <div className="flex items-center gap-3">
              <span className="type-label text-(--faint)">Scroll</span>
              <span className="scroll-hint relative h-10 w-px overflow-hidden bg-(--line)">
                <span className="absolute inset-x-0 h-1/2 bg-accent" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
