"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { HeroBus } from "@/components/three/HeroScene";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLenis } from "@/components/chrome/SmoothScroll";

import { useReducedMotion } from "@/lib/hooks";
import HeroPortrait from "@/components/ui/HeroPortrait";
import WaitlistForm from "@/components/ui/WaitlistForm";

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
          stroke="#2d46ff"
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

    }, section);
    return () => ctx.revert();
  }, []);

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
      aria-label="Pixely — AI-powered identity and fraud solution"
      className="relative min-h-[100svh] overflow-hidden bg-ink text-bone beside:h-[100svh] beside:min-h-[640px]"
    >
      <div className="absolute inset-0" aria-hidden>
        {reduced ? (
          <HeroPoster />
        ) : (
          <HeroScene bus={bus} active={active} />
        )}
      </div>


      <div
        ref={contentRef}
        className="relative isolate z-(--z-content) flex min-h-[100svh] flex-col justify-start px-6 pt-[clamp(84px,12.8vh,104px)] pb-9 sm:px-10 md:pb-16 lg:px-14 lg:pb-20 beside:h-full beside:justify-end beside:pt-0"
      >
        <h1
          className="type-display -ml-[0.04em] text-[clamp(2rem,4.2vw,4.25rem)] leading-[1.08] tracking-[-0.025em] opacity-0 beside:max-w-[60%]"
          aria-label="AI-POWERED IDENTITY & FRAUD Solution"
        >
          <span className="block overflow-hidden pb-[0.08em]">
            <span data-hero-line className="block">AI-POWERED</span>
          </span>
          <span className="block overflow-hidden pb-[0.08em]">
            <span data-hero-line className="block"><span className="text-signal">IDENTITY</span> &amp; FRAUD</span>
          </span>
          <span className="block overflow-hidden pb-[0.2em]">
            <span data-hero-line className="block text-white">Solution</span>
          </span>
        </h1>

        <div data-hero-fade className="mt-6 max-w-[34rem] opacity-0 beside:mb-8">
          <p className="text-[clamp(1.0625rem,1.4vw,1.25rem)] leading-[1.6] tracking-[-0.01em] text-white">
            AI-powered KYC and fraud detection for banks and financial institutions
            in Algeria &amp; MENA — hosted locally, privacy-first.
          </p>
          <WaitlistForm />
        </div>

        <div className="relative -order-1 mb-8 h-[clamp(260px,36svh,380px)] shrink-0 beside:order-none beside:absolute beside:right-0 beside:bottom-0 beside:-z-10 beside:mb-0 beside:h-[88%] beside:w-[55vw]">
          <HeroPortrait />
        </div>
      </div>
    </section>
  );
}
