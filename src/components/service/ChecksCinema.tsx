"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";

import IdentityCard, { type CardAct } from "@/components/service/IdentityCard";
import KycScreen, { type KycAct } from "@/components/service/KycScreen";
import {
  FaceMatchGlyph,
  LivenessGlyph,
  MrzGlyph,
  NfcGlyph,
  OcrGlyph,
} from "@/components/service/CheckGlyphs";

/* The front page's device, running the verification app instead of the
   wallet — client-only for the same reasons it is there. */
const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

/**
 * The five checks as one continuous scene: the specimen document on the
 * stage, and the front page's own device travelling through the acts —
 * hovering to scan the machine zone, standing beside the page while the
 * print lifts into its screen, lying on the card to read the chip, turning
 * to the face, then holding document and person side by side for the
 * match. The section is five viewports tall; the copy crossfades through
 * the stages on the scrub; a rail tracks the exam; and the device's
 * screen runs the actual flow, step by step.
 *
 * Reduced motion swaps the theatre for the five hairline drawings,
 * stacked and still.
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

const DEVICE_ACT: KycAct[] = ["mrz", "ocr", "nfc", "live", "match"];
const CARD_ACT: CardAct[] = ["mrz", "ocr", "nfc", "idle", "idle"];

/**
 * The blocking, act by act. Card and device are both centred in the stage
 * and posed with transforms — xPercent/yPercent are percentages of each
 * element's own size, which keeps the composition honest across viewports.
 * The theatre always stands opposite the copy column.
 */
const CARD_POSE = [
  { xPercent: 18, yPercent: -6, scale: 1, rotate: 0, opacity: 1 },
  { xPercent: -58, yPercent: -6, scale: 0.92, rotate: 0, opacity: 1 },
  { xPercent: 22, yPercent: -2, scale: 1, rotate: 0, opacity: 1 },
  { xPercent: -40, yPercent: -6, scale: 0.9, rotate: 0, opacity: 0 },
  { xPercent: 2, yPercent: -2, scale: 0.82, rotate: -2, opacity: 1 },
];
const DEVICE_POSE = [
  { xPercent: 118, yPercent: -46, scale: 0.6, rotate: -7, opacity: 1 },
  { xPercent: -6, yPercent: -44, scale: 0.62, rotate: 5, opacity: 1 },
  { xPercent: 38, yPercent: -40, scale: 0.54, rotate: -8, opacity: 1 },
  { xPercent: -68, yPercent: -44, scale: 0.78, rotate: 0, opacity: 1 },
  { xPercent: 78, yPercent: -44, scale: 0.62, rotate: 4, opacity: 1 },
];

/** Static fallback backdrop: the near field's rings, stilled. */
function ChecksPoster() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-ink">
      <svg
        className="absolute top-1/2 left-1/2 h-[min(110vh,820px)] w-[min(110vh,820px)] -translate-x-1/2 -translate-y-1/2"
        viewBox="-280 -280 560 560"
        fill="none"
      >
        {[70, 118, 166, 214, 262].map((r) => (
          <circle
            key={r}
            r={r}
            stroke="#ece9e1"
            strokeOpacity="0.09"
            strokeWidth="0.75"
            strokeDasharray="2 6"
          />
        ))}
        <circle r="30" stroke="#2d46ff" strokeOpacity="0.4" />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_30%,#0a0a0b_100%)]" />
    </div>
  );
}

export default function ChecksCinema() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const [act, setAct] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const copies = sticky.querySelectorAll("[data-check-copy]");
        const marks = sticky.querySelectorAll("[data-check-mark]");
        const card = cardRef.current;
        const device = deviceRef.current;
        if (copies.length === 0 || !card || !device) return;

        gsap.set(copies, { opacity: 0, y: 34 });
        gsap.set(copies[0], { opacity: 1, y: 0 });
        marks[0]?.classList.add("bg-accent");
        gsap.set(card, CARD_POSE[0]);
        gsap.set(device, DEVICE_POSE[0]);

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
          )
            .to(
              copies[i],
              { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
              i - 0.15,
            )
            // The players move with the copy: the device travels to its
            // next mark, the document takes its next place.
            .to(
              card,
              { ...CARD_POSE[i], duration: 0.5, ease: "power2.inOut" },
              i - 0.42,
            )
            .to(
              device,
              { ...DEVICE_POSE[i], duration: 0.5, ease: "power2.inOut" },
              i - 0.42,
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
            setAct(i);
            marks.forEach((m, mi) => m.classList.toggle("bg-accent", mi === i));
          },
        });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
          st.kill();
          gsap.set([copies, card, device], { clearProps: "all" });
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
        <ChecksPoster />
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
            {/* The theatre: document and device, centred and posed. It
                cannot swallow the pointer — the copy under it must stay
                readable and the page must stay scrollable. */}
            {/* On small screens the theatre takes the upper half and the
                copy the lower — a bone card behind running text is a
                fight nobody wins. */}
            <div className="pointer-events-none absolute inset-0 z-[5] max-lg:-top-[24%] max-lg:scale-[0.62] [&_*]:!pointer-events-none">
              <div
                ref={cardRef}
                className="absolute top-1/2 left-1/2 w-[min(46vw,560px)] max-lg:w-[min(78vw,480px)] -translate-x-1/2 -translate-y-1/2"
              >
                <IdentityCard act={CARD_ACT[act]} />
              </div>
              <div
                ref={deviceRef}
                className="absolute top-1/2 left-1/2 h-[min(64vh,620px)] -translate-x-1/2 -translate-y-1/2"
                style={{ aspectRatio: "420 / 892" }}
              >
                <HeroDevice
                  className="size-full"
                  screen={<KycScreen act={DEVICE_ACT[act]} />}
                />
              </div>
            </div>

            <div className="absolute inset-0 z-10 flex items-center px-6 max-lg:translate-y-[22%] sm:px-10 lg:px-14">
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
