"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

import {
  FaceMatchGlyph,
  LivenessGlyph,
  MrzGlyph,
  NfcGlyph,
  OcrGlyph,
} from "@/components/service/CheckGlyphs";

/**
 * The five checks on one stage. This is the front page's tab grammar —
 * UseCases' numbered rail, accent underline, roving focus and rising
 * panel — holding drawings instead of stats: each tab is one verification
 * technology, drawn as a working diagram and described next to it.
 *
 * The chips under each description are the forgeries that particular
 * check exists to kill. That is the honest way to talk about fraud
 * detection: not adjectives — a list of attacks, and which line in the
 * drawing stops them.
 */

const CHECKS = [
  {
    id: "mrz",
    label: "MRZ read",
    title: "The lines a forger has to typeset perfectly.",
    body: "The machine-readable zone — three lines on the back of a national ID, two at the foot of a passport's photo page — is read and checksummed character by character: names, numbers, dates, and the check digits computed from all of them. Alter one field and the arithmetic stops agreeing with the line it is printed on.",
    defeats: ["Reprinted data pages", "Altered dates", "Invented numbers"],
    Glyph: MrzGlyph,
  },
  {
    id: "ocr",
    label: "OCR capture",
    title: "Every printed field, lifted off the page.",
    body: "Optical character recognition reads the whole document — the visual zone a human sees, not just the machine lines — and returns it as structured fields. Then the versions are compared: what the page prints, what the MRZ encodes and what the chip holds have to be the same person.",
    defeats: ["Edited fields", "Font substitution", "Zone mismatches"],
    Glyph: OcrGlyph,
  },
  {
    id: "nfc",
    label: "NFC chip",
    title: "A fake can copy the plastic. Not the key.",
    body: "Biometric documents carry a chip signed by the state that issued them. Lay the phone on the document — near field means near — and the chip answers a live cryptographic challenge while the read runs on screen: active authentication a clone cannot fake. The strongest document check that exists, in about a second.",
    defeats: ["Counterfeit documents", "Cloned chips", "Photo swaps"],
    Glyph: NfcGlyph,
  },
  {
    id: "liveness",
    label: "Liveness",
    title: "Present, alive, and not a picture of one.",
    body: "Passive liveness reads a single capture for the texture, depth and motion of an actual face in an actual room — no head-turning gymnastics for the user. Screens, prints, masks and injected video all fail the same quiet exam.",
    defeats: ["Printed photos", "Screen replays", "Masks", "Injected video"],
    Glyph: LivenessGlyph,
  },
  {
    id: "match",
    label: "Face match",
    title: "The face on the chip is the face in the room.",
    body: "The live face that passed liveness is matched against the portrait read from the document and its chip. It closes the loop: the document is genuine, the person is real, and — the part fraud actually hinges on — they are the same person.",
    defeats: ["Borrowed documents", "Stolen identities", "Lookalike fraud"],
    Glyph: FaceMatchGlyph,
  },
] as const;

export default function ChecksStage() {
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const previous = useRef(0);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || previous.current === active) {
      previous.current = active;
      return;
    }
    previous.current = active;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panel.querySelectorAll("[data-swap]"),
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.055,
          ease: "expo.out",
          overwrite: true,
        },
      );
    }, panel);
    return () => ctx.revert();
  }, [active]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const last = CHECKS.length - 1;
      let target: number;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          target = active === last ? 0 : active + 1;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          target = active === 0 ? last : active - 1;
          break;
        case "Home":
          target = 0;
          break;
        case "End":
          target = last;
          break;
        default:
          return;
      }
      e.preventDefault();
      setActive(target);
      tabRefs.current[target]?.focus();
    },
    [active],
  );

  const check = CHECKS[active];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Verification checks"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-x-8 gap-y-3 border-b border-(--line) pb-5"
      >
        {CHECKS.map((c, i) => (
          <button
            key={c.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`check-tab-${c.id}`}
            aria-selected={active === i}
            aria-controls={`check-panel-${c.id}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            data-cursor="link"
            className={`type-label relative pb-2 transition-colors duration-300 ${
              active === i ? "text-accent" : "text-(--muted) hover:text-(--fg)"
            }`}
          >
            <span className="mr-2 text-[9px] opacity-60">0{i + 1}</span>
            {c.label}
            <span
              aria-hidden
              className={`absolute bottom-0 left-0 h-px bg-accent transition-all duration-500 ease-(--ease-out-expo) ${
                active === i ? "w-full" : "w-0"
              }`}
            />
          </button>
        ))}
      </div>

      <div
        ref={panelRef}
        role="tabpanel"
        id={`check-panel-${check.id}`}
        aria-labelledby={`check-tab-${check.id}`}
        tabIndex={0}
        className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16"
      >
        {/* Keyed so a fresh drawing mounts per check: its loops start from
            zero rather than joining the previous drawing's clock mid-beat. */}
        <div data-swap key={check.id}>
          <check.Glyph />
        </div>
        <div>
          <h3
            data-swap
            className="type-headline text-[clamp(1.3rem,2.4vw,1.9rem)] max-w-[20ch] text-balance"
          >
            {check.title}
          </h3>
          <p
            data-swap
            className="mt-6 max-w-xl text-[0.98rem] leading-relaxed text-(--muted)"
          >
            {check.body}
          </p>
          <p data-swap className="type-label mt-9 text-(--faint)">
            What it defeats
          </p>
          <ul data-swap className="mt-3 flex flex-wrap gap-2">
            {check.defeats.map((chip) => (
              <li
                key={chip}
                className="type-label rounded-(--radius-chip) border border-(--line) px-3.5 py-2.5 text-(--muted)"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
