"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { IdentityBus } from "@/components/three/IdentityScene";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";

import {
  FaceMatchGlyph,
  LivenessGlyph,
  MrzGlyph,
  NfcGlyph,
  OcrGlyph,
} from "@/components/service/CheckGlyphs";

const IdentityScene = dynamic(
  () => import("@/components/three/IdentityScene"),
  { ssr: false, loading: () => <ChecksPoster /> },
);

/**
 * The five checks as the page's set piece, staged exactly the way the
 * front page stages its network: the section is five viewports tall, a
 * sticky stage holds a scroll-scrubbed particle scene (one system
 * morphing through the five acts of a verification), the copy crossfades
 * through the stages on the same scrub, and a rail at the foot tracks
 * where in the exam you are.
 *
 * Reduced motion swaps the whole theatre for the five hairline drawings,
 * stacked and still — the same checks, held instead of performed.
 */

const STAGES = [
  {
    index: "01",
    title: "MRZ read",
    heading: "The lines a forger has to typeset perfectly.",
    body: "The machine-readable zone — three lines on the back of a national ID, two at the foot of a passport's photo page — is read and checksummed character by character. Alter one field and the arithmetic stops agreeing with the line it is printed on.",
    meta: "Defeats: reprinted data pages · altered dates · invented numbers",
    Glyph: MrzGlyph,
  },
  {
    index: "02",
    title: "OCR capture",
    heading: "Every printed field, lifted off the page.",
    body: "Optical character recognition reads the whole document — the visual zone a human sees, not just the machine lines — and returns it as structured fields. What the page prints, what the MRZ encodes and what the chip holds have to be the same person.",
    meta: "Defeats: edited fields · font substitution · zone mismatches",
    Glyph: OcrGlyph,
  },
  {
    index: "03",
    title: "NFC chip",
    heading: "A fake can copy the plastic. Not the key.",
    body: "Biometric documents carry a chip signed by the state that issued them. Lay the phone on the document — near field means near — and the chip answers a live cryptographic challenge a clone cannot fake. The strongest document check that exists, in about a second.",
    meta: "Defeats: counterfeit documents · cloned chips · photo swaps",
    Glyph: NfcGlyph,
  },
  {
    index: "04",
    title: "Liveness",
    heading: "Present, alive — and not a picture of one.",
    body: "Passive liveness reads a single capture for the texture, depth and motion of an actual face in an actual room — no head-turning gymnastics for the user. Screens, prints, masks and injected video all fail the same quiet exam.",
    meta: "Defeats: printed photos · screen replays · masks · injected video",
    Glyph: LivenessGlyph,
  },
  {
    index: "05",
    title: "Face match",
    heading: "The face on the chip is the face in the room.",
    body: "The live face that passed liveness is matched against the portrait read from the document and its chip. It closes the loop: the document is genuine, the person is real, and — the part fraud actually hinges on — they are the same person.",
    meta: "Defeats: borrowed documents · stolen identities · lookalike fraud",
    Glyph: FaceMatchGlyph,
  },
] as const;

/** Static fallback: reduced motion, no WebGL, or the chunk still loading —
 *  the contour face as a still. */
function ChecksPoster() {
  const slices = Array.from({ length: 15 }, (_, i) => {
    const y = -140 + i * 20;
    const crown = Math.min(1, Math.max(0, 1 - (y - 70) / 80));
    const jaw = Math.min(1, Math.max(0, 1 - (-y - 55) / 95));
    const r = 34 + 86 * Math.min(crown, jaw);
    return { y, r };
  });
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-ink">
      <svg
        className="absolute top-1/2 left-1/2 h-[min(110vh,820px)] w-[min(110vh,820px)] -translate-x-1/2 -translate-y-1/2"
        viewBox="-280 -280 560 560"
        fill="none"
      >
        {slices.map(({ y, r }) => (
          <ellipse
            key={y}
            cy={-y}
            rx={r}
            ry={r * 0.22}
            stroke="#ece9e1"
            strokeOpacity="0.1"
            strokeWidth="0.75"
          />
        ))}
        <circle r="196" stroke="#ece9e1" strokeOpacity="0.14" />
        <line
          x1="-280"
          y1="150"
          x2="280"
          y2="150"
          stroke="#2d46ff"
          strokeOpacity="0.4"
        />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_30%,#0a0a0b_100%)]" />
    </div>
  );
}

export default function ChecksCinema() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const bus = useRef<IdentityBus>({ progress: 0, pointer: [0, 0], spread: 0 });
  const [active, setActive] = useState(false);
  // The canvas allocates a WebGL context as soon as it mounts, and this
  // section sits below the hero — hold off until it is approached.
  const [near, setNear] = useState(false);
  const reduced = useReducedMotion();

  // Wide viewports alternate the copy column, so the subject swings aside.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      bus.current.spread = mql.matches ? 1 : 0;
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

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

  // Mount roughly a viewport early, then keep it.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          bus.current.progress = self.progress;
        },
      });
      // Only render while the section can be seen. onToggle alone is not
      // enough: it fires on crossings, and a visitor can arrive without
      // one (a hash landing, a programmatic jump) — so sync the initial
      // state and re-sync on every refresh too.
      const vis = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => setActive(self.isActive),
        onRefresh: (self) => setActive(self.isActive),
      });
      setActive(vis.isActive);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const copies = sticky.querySelectorAll("[data-check-copy]");
        const marks = sticky.querySelectorAll("[data-check-mark]");
        if (copies.length === 0) return;

        gsap.set(copies, { opacity: 0, y: 34 });
        gsap.set(copies[0], { opacity: 1, y: 0 });
        marks[0]?.classList.add("bg-accent");

        // Timeline units == stage units: stage i is centred at time i.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
          },
        });

        STAGES.forEach((_, i) => {
          if (i === 0) return;
          tl.to(
            copies[i - 1],
            { opacity: 0, y: -34, duration: 0.3, ease: "power2.in" },
            i - 0.4,
          ).to(
            copies[i],
            { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
            i - 0.15,
          );
        });

        const st = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const i = Math.max(
              0,
              Math.min(
                STAGES.length - 1,
                Math.round(self.progress * (STAGES.length - 1)),
              ),
            );
            marks.forEach((m, mi) => m.classList.toggle("bg-accent", mi === i));
          },
        });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
          st.kill();
          gsap.set(copies, { clearProps: "all" });
          marks.forEach((m) => m.classList.remove("bg-accent"));
        };
      });
      return () => mm.revert();
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-theme="ink"
      aria-label="The five verification checks"
      className="relative bg-theme text-theme"
      style={{ height: reduced ? undefined : "620svh" }}
    >
      <div
        ref={stickyRef}
        className={
          reduced
            ? "relative overflow-hidden py-24"
            : "sticky top-0 h-[100svh] overflow-hidden"
        }
      >
        {reduced || !near ? (
          <div className="absolute inset-0">
            <ChecksPoster />
          </div>
        ) : (
          <IdentityScene bus={bus} active={active} />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_85%_at_50%_50%,transparent_38%,rgba(10,10,11,0.55)_100%)]"
        />

        <p className="type-label section-index absolute top-24 left-6 z-20 text-(--muted) sm:left-10 lg:left-14">
          01 — Know Your Customer
        </p>

        {/* Reduced motion: the five checks simply stack and stay put, each
            with its hairline drawing held still. */}
        {reduced ? (
          <div className="relative z-10 mx-auto grid max-w-6xl gap-14 px-6 pt-20 sm:px-10 md:grid-cols-2 lg:px-14">
            {STAGES.map((stage) => (
              <div key={stage.title}>
                <div className="rounded-(--radius-panel) border border-(--line) p-5">
                  <stage.Glyph />
                </div>
                <p className="type-label mt-6 mb-4 text-accent">
                  {stage.index} — {stage.title}
                </p>
                <h3 className="type-headline text-mid">{stage.heading}</h3>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-(--muted)">
                  {stage.body}
                </p>
                <p className="type-label mt-5 border-t border-(--line) pt-4 leading-relaxed text-(--faint)">
                  {stage.meta}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="absolute inset-0 z-10 flex items-center px-6 sm:px-10 lg:px-14">
              <div className="relative mx-auto w-full max-w-7xl">
                {STAGES.map((stage, i) => (
                  <div
                    key={stage.title}
                    data-check-copy
                    className={`absolute top-1/2 w-full max-w-lg -translate-y-1/2 ${
                      i % 2 === 1
                        ? "lg:right-0 lg:left-auto lg:text-right"
                        : "left-0"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 bg-[radial-gradient(58%_58%_at_50%_50%,rgba(10,10,11,0.94)_0%,rgba(10,10,11,0.72)_45%,transparent_78%)]"
                    />
                    <p className="type-label mb-5 text-accent">
                      {stage.index} — {stage.title}
                    </p>
                    <h3 className="type-headline text-mid text-balance">
                      {stage.heading}
                    </h3>
                    <p className="mt-5 text-[0.95rem] leading-relaxed text-(--muted)">
                      {stage.body}
                    </p>
                    <p className="type-label mt-7 border-t border-(--line) pt-4 leading-relaxed text-(--faint)">
                      {stage.meta}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage rail */}
            <div
              aria-hidden
              className="absolute bottom-10 left-6 z-20 flex items-center gap-3 sm:left-10 lg:left-14"
            >
              {STAGES.map((stage) => (
                <span key={stage.title} className="flex items-center gap-2">
                  <span
                    data-check-mark
                    className="block h-px w-8 bg-(--line-strong) transition-colors duration-500"
                  />
                  <span className="type-label text-[9px] text-(--faint)">
                    {stage.index}
                  </span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
