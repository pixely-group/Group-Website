"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { HeroBus } from "@/components/three/HeroScene";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLenis } from "@/components/chrome/SmoothScroll";

import { useMediaQuery, useReducedMotion } from "@/lib/hooks";
import MagneticButton from "@/components/ui/MagneticButton";
import RotatingWord from "@/components/ui/RotatingWord";

/* The same device the travelling wrapper flies on wide screens, mounted
   straight into the hero for every other viewport. Client-only, like every
   other mount of it: the wallet inside reads a media query on mount. */
const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => <HeroPoster />,
});

/** The scroll cue. Rendered twice and shown once: below sm it stands on end
 *  in the gutter beside the phone, from sm up it lies flat under the mission
 *  pillars on the page's bottom edge. Two nodes rather than one moved by CSS
 *  because the two homes are in different branches of the section, and the
 *  thing it draws is a pure CSS keyframe — no state, no measurement, nothing
 *  to keep in sync. Turning it costs the word a writing-mode and nothing
 *  else: the rule is 1px wide and reads the same either way. */
function ScrollHint({
  className = "",
  vertical = false,
}: {
  className?: string;
  vertical?: boolean;
}) {
  return (
    <div
      className={`items-center gap-3 ${vertical ? "flex-col" : ""} ${className}`}
    >
      <span
        className={`type-label text-(--faint) ${vertical ? "[writing-mode:vertical-rl]" : ""}`}
      >
        Scroll
      </span>
      <span className="scroll-hint relative h-10 w-px overflow-hidden bg-(--line)">
        <span className="absolute inset-x-0 h-1/2 bg-accent" />
      </span>
    </div>
  );
}

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
  /* The inverse of the travelling device's own gate. Mounted rather than
     hidden: a display:none device still builds a wallet, runs a tilt loop
     and holds timers, and at desktop that is a second full phone nobody
     sees. */
  const beside = useMediaQuery(
    "(min-width: 1024px) and (orientation: landscape)",
  );
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
      }
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
      aria-label="Pixely — financial services without friction"
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-ink text-bone"
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
        className="relative z-(--z-content) flex h-full flex-col justify-start px-6 pt-[clamp(84px,12.8vh,104px)] pb-9 sm:px-10 md:pb-16 lg:px-14 lg:pb-20 beside:justify-end beside:pt-0"
      >
        <p
          data-hero-fade
          className="type-label mb-7 text-(--muted) opacity-0"
        >
          <span className="section-index">
            Pixely — Financial infrastructure for Algeria
          </span>
        </p>

        <h1
          className="type-display text-hero -ml-[0.06em] opacity-0 lg:pr-[30%] lg:text-hero-aside"
          aria-label="Pixely — we make money move instantly, securely, your way"
        >
          <span className="-mb-[0.07em] block overflow-hidden pb-[0.09em]">
            <span data-hero-line className="block">
              We make money
            </span>
          </span>
          <span className="-mb-[0.19em] block overflow-hidden pb-[0.25em]">
            <span data-hero-line className="block">
              Move{" "}
              {/* 1.4em, not 1.14. The line around it is uppercase Archivo
                  at a 0.686em cap height; the word is lowercase Fraunces
                  italic, whose x-height is 0.4427em. At 1.14 the word's body
                  stood at 73% of the caps beside it, which is why it read as
                  undersized however large the number looked. 1.32 took it to
                  85% and 1.4 takes it to 90%. It still cannot go to a true
                  match — that would want 1.55, and Fraunces carries tall
                  ascenders, so the word would climb half again above the
                  caps.

                  The brand blue itself, not the lifted tint --accent resolves
                  to on dark chapters. That lift exists because the primary
                  reaches only ~3.25:1 on ink, which fails AA for body copy —
                  but this is display type well past the large-text threshold,
                  where 3:1 is the bar. */}
              <RotatingWord className="type-serif-inherit text-signal normal-case text-[1.4em]" />
            </span>
          </span>
        </h1>

        <div className="mt-[clamp(22px,4.9vh,40px)] flex flex-col gap-8 border-t border-(--line) pt-[clamp(16px,3.4vh,28px)] md:flex-row md:items-end md:justify-between">
          {/* Lifted off the row's baseline once the two columns sit side by
              side. The band aligns them flush at the foot, which put the
              buttons level with the scroll hint — and that hint belongs on
              the bottom edge in a way the buttons do not. Below md the
              columns stack and the row's own gap does this job. */}
          <div data-hero-fade className="max-w-md opacity-0 md:mb-8">
            <p className="text-[0.95rem] leading-relaxed text-(--muted)">
              Pixely combines payments, digital identity and artificial
              intelligence into one platform — secure transactions, trusted
              verification and intelligent financial services, built for
              Algeria.
            </p>
            {/* Below sm the two buttons stack — there is no room for 147 and
                224 side by side on a 375px screen — and w-fit plus
                items-stretch gives them both the longer label's width. The
                column then centres: the eyebrow, headline and paragraph all
                run the full measure, so the buttons and the phone are the
                only things in the hero narrow enough to sit visibly off
                centre, and mx-auto puts the pair on the page's axis.

                From sm up they fit on one line and the ranged-left wrapping
                row returns. */}
            <div className="mx-auto mt-6 flex w-fit flex-col items-stretch gap-3 sm:mx-0 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <MagneticButton href="#start" size="md">
                Get started
              </MagneticButton>
              <MagneticButton href="#product" variant="outline" size="md">
                Explore the platform
              </MagneticButton>
            </div>
          </div>

          <div
            data-hero-fade
            className="hidden items-end justify-between gap-10 opacity-0 sm:flex md:flex-col md:items-end md:gap-5"
          >
            {/* The three mission pillars from the deck. There are no
                published figures for Pixely, and inventing them for a real
                company is not a design decision to make quietly. */}
            {/* Always on. These three spent a while being hidden or shrunk
                around to protect them from the phone, and every cure was
                worse than the disease: the phone floats above the hero on
                its own layer, so on shorter windows the lines simply run
                under it — faint meta tucked beneath a floating object, not
                a collision. */}
            <p className="type-label hidden leading-relaxed text-(--faint) sm:block md:text-right">
              Financial inclusion
              <br />
              Intelligent innovation
              <br />
              Trust &amp; security
            </p>
            <ScrollHint className="flex" />
          </div>
        </div>

        {/* The device, on every viewport that is not wide-and-landscape.
            It goes under the copy and runs off the bottom of the fold — the
            section clips it — which is the whole idea: a phone shown whole
            on a phone has to shrink to fit, and the first attempt at this
            put a 117px-wide device on a 375px screen with its screen at
            0.28 scale. Illegible, and a toy. Cropped, the same device is
            240 wide at 0.6, its balance and quick actions read at a glance,
            and the cut edge does the job the scroll hint does.

            Absolute inside a flex-1 slot: the slot claims whatever the copy
            leaves and the device hangs from its top at a height of its own,
            free to exceed it.

            Centred below sm, right-aligned from sm up. On a phone the copy
            all runs the full measure, so the device and the buttons are the
            only things narrow enough to read as off centre, and they share
            the page's axis. On a tablet the pillars and the cue hold a right
            column and the device joins it, landing its right edge on the
            same margin they keep.

            The band it used to rise into is gone: the scroll cue moved up
            beside the buttons, so below sm the copy now ends at the buttons
            and the negative margin that bought that height was landing the
            phone 48px on top of them. It takes a gap instead, and a wider
            one than the 24px it had — the phone reads as sitting below the
            call to action rather than crowding it.

            Wide-and-landscape has the travelling phone instead and never
            renders this. */}
        {!beside && (
          <div className="relative mt-[clamp(44px,7.9vh,64px)] min-h-[120px] flex-1 sm:mt-[clamp(20px,4.4vh,36px)]">
            {/* The cue stands in the gutter the centred phone leaves. A 237
                phone on a 327 measure leaves 45px either side and nothing to
                put in it; on end, the cue is ~14 wide and costs no height at
                all — where anything on the centre axis would have cost 60
                and broken the axis the buttons and phone now share. Pinned
                to the slot's top, so it sits level with the phone's shoulder
                and well clear of the seam fade at the fold. */}
            <ScrollHint
              vertical
              className="absolute top-0 left-0 flex sm:hidden"
            />
            <div className="absolute inset-x-0 top-0 flex justify-center sm:justify-end">
              <HeroDevice
                className="h-[clamp(400px,62vh,640px)]"
                shift={0}
              />
            </div>
          </div>
        )}
      </div>

      {/* The seam. The device runs off the bottom of the fold and the section
          clips it, which left a hard horizontal slice through the wallet —
          it read as a broken render, not a crop. #manifesto below sits on the
          identical ground (10,10,11), so a gradient to that exact colour lets
          the phone dissolve into the join instead of being cut at it. Same z
          as the content column, later in the DOM, so it paints over. */}
      {!beside && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-(--z-content) h-[clamp(44px,9.9vh,80px)] bg-[linear-gradient(to_bottom,transparent,#0a0a0b_92%)]"
        />
      )}
    </section>
  );
}
