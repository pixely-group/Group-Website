"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DEVICE_ASPECT } from "@/lib/device";
import { useMediaQuery, useReducedMotion } from "@/lib/hooks";

const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

/** Where the travel begins, as a fraction of the hero's height scrolled. */
const BEGIN = 0.14;
/** How far below the seam the device parks. Its lower half lands over the
 *  copy that follows, which is where the fade earns its keep. */
const DROP = 40;
/** Scale on arrival, and what it grows to as the reader keeps going. */
const LANDED = 0.86;
const CLOSE = 1.42;
/** Scroll past the stop over which that growth happens. Short on purpose:
 *  the device is anchored to the page by then, so every pixel spent growing
 *  is also a pixel of it travelling up the screen. Stretch this and it
 *  reaches full size only once it has left the frame. */
const ZOOM = 180;
/** How faint the bottom of the device gets, so the copy in front of it stays
 *  the thing you read. */
const FAINT = 0.07;
/** How far above the copy the fade begins, as a fraction of the device. A
 *  little lead-in, so the first line does not land on a hard edge. */
const LEAD = 0.06;
/** The fade never eats more than this much of the device, whatever the
 *  measurements say. */
const KEEP_MIN = 0.28;
/** The mask sits on its own element, inset this far outside the device on
 *  every side. Two things have to fit in that margin: the device leans out of
 *  its box by up to ~21px under the pointer, and its shadow reaches 100px
 *  below the body — 50 of offset plus 90 of blur less 40 of spread.
 *
 *  An element rather than a bigger mask-image, because mask-clip decides what
 *  gets cut and it defaults to the border box: growing the image does nothing
 *  about the clip, and no-clip did not paint. Give the mask a box that is
 *  actually larger and the default clip is already in the right place. */
const MASK_PAD = 150;
/** How much of the scroll the device gives back while it is growing. At a
 *  full 1:1 it rises the whole ZOOM as it zooms, and reaches full size with
 *  its top already off the screen. It is still page-anchored afterwards. */
const LINGER = 0.35;

/**
 * The device is fixed to the viewport rather than parked inside the hero,
 * because it has to outlive it — an element positioned inside a section
 * cannot leave that section.
 *
 * In the hero it is untouched: the resting three-quarter view, the pointer
 * follow, the sheen, all as they were. Scrolling is what squares it up. By
 * the time it arrives it is flat to the reader and still, and it arrives on
 * the seam between the hero and the manifesto.
 *
 * Then it stops. Not held against the viewport — actually stopped, pinned to
 * that point on the page, so it scrolls away with everything else instead of
 * following the reader down the document.
 *
 * Driven from one ticker rather than scrubbed tweens: position, flattening
 * and the stop are all functions of the same scroll value, and reading them
 * in one tick is the only way they cannot disagree. Lenis runs on this clock
 * too, so the smoothing is already applied by the time we read it.
 */
export default function TravellingDevice() {
  const holderRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const flatten = useRef(0);
  const arrived = useRef(false);
  const fadeStep = useRef(-1);
  const [showcase, setShowcase] = useState<"cards" | null>(null);
  const reduced = useReducedMotion();
  /** Below lg there is no column to start from and no room to travel. */
  const enabled = useMediaQuery("(min-width: 1024px)");
  const roomy = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    const holder = holderRef.current;
    const maskEl = maskRef.current;
    if (!holder || !maskEl || !enabled || reduced) return;

    const hero = document.querySelector("#top");
    const manifesto = document.querySelector("#manifesto");
    if (!hero || !manifesto) return;

    let begin = 0;
    let stop = 0;
    let dx = 0;
    let dy = 0;
    /** Unscaled height of the device, and the page positions of its parked
     *  centre and of the copy it has to make way for. Held in page
     *  coordinates so the contact point can be solved arithmetically each
     *  frame rather than measured — reading a rect after writing a transform
     *  forces a synchronous layout, every frame, for the whole section. */
    let baseH = 1;
    let restCentreY = 0;
    let copyTopPage = 0;

    const measure = () => {
      /* Read with the tween's own transform removed, or each measurement
         starts from wherever the last one left the device. */
      const prev = holder.style.transform;
      holder.style.transform = "none";
      const box = holder.getBoundingClientRect();
      holder.style.transform = prev;

      const y = window.scrollY;
      const heroH = hero.getBoundingClientRect().height;
      const seam = manifesto.getBoundingClientRect().top + y;

      begin = heroH * BEGIN;
      /* Stops when the seam reaches the middle of the screen, which puts the
         device's own centre on the seam — between the hero and section 01 —
         then DROP lower again, so it settles nearer the copy below rather
         than in the middle of the gap. */
      stop = seam - window.innerHeight / 2 + DROP;
      dx = window.innerWidth / 2 - (box.left + box.width / 2);
      dy = window.innerHeight / 2 - (box.top + box.height / 2);

      baseH = box.height || 1;
      /* The holder is fixed, so its untransformed centre never moves in
         viewport space — which makes it the one stable thing to solve the
         device's real position against. */
      restCentreY = box.top + box.height / 2;
      const copy = manifesto.querySelector<HTMLElement>(".section-index");
      copyTopPage = copy ? copy.getBoundingClientRect().top + y : seam;
    };

    /* The device is imported dynamically and sizes itself after mount, so the
       first measurement catches a narrower box — and because the holder is
       anchored to the right, narrower also means further right. Left alone it
       settled 117px left of centre. */
    const ro = new ResizeObserver(measure);
    ro.observe(holder);
    measure();
    window.addEventListener("resize", measure);

    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    /* Eased on the way in so it leaves the hero gently and lands without a
       hard stop; the scroll itself is linear. */
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const draw = () => {
      const y = window.scrollY;
      const p = ease(clamp01((y - begin) / Math.max(1, stop - begin)));
      /* Past the stop the device counter-scrolls one for one, which is what
         "stopped" means from the reader's side: it holds its place on the
         page and the page carries it away. It gives back only a fraction of
         that while it is still growing, so the reader sees it at full size
         rather than watching it leave at full size. */
      const past = Math.max(0, y - stop);
      const rise =
        past <= ZOOM ? past * LINGER : ZOOM * LINGER + (past - ZOOM);

      /* Once parked it keeps coming forward, slowly, for as long as the
         reader keeps scrolling — the wallet is the thing being read by then,
         and it was sitting too far off to be read. */
      const near = clamp01(past / ZOOM);
      const scale = p < 1 ? 1 - (1 - LANDED) * p : LANDED + (CLOSE - LANDED) * near;

      flatten.current = p;
      holder.style.transform =
        `translate3d(${dx * p}px, ${dy * p - rise}px, 0) scale(${scale})`;

      /* The device gives way exactly where the copy begins, rather than at a
         fixed fraction of itself. Solved from page coordinates: the device's
         height is its own, its parked centre is known, and the copy does not
         move — so the contact point falls out of arithmetic instead of a rect
         read after a transform write, which would force a synchronous layout
         every frame.

         Only masked while the device is square, which is the whole time it is
         in contact. It leans out of its own box under the pointer, and a mask
         paints only inside that box, so masking a leaning device cuts about
         21px off its chassis. */
      /* Derived from the same numbers the transform is built from, not from
         an assumed parked centre: LINGER means the device is not anchored to
         the page while it is still growing, so a constant centre is off by
         ZOOM * (1 - LINGER) and the fade starts below the copy instead of
         above it. */
      const h = baseH * scale;
      const deviceTop = restCentreY + dy * p - rise - h / 2;
      const contact = (copyTopPage - y - deviceTop) / h;
      /* Driven by the copy actually reaching the device, not by the device
         finishing its travel. On a tall viewport the copy is already 200px
         over it by the time it parks, and gating on arrival left the text
         sitting on a fully opaque phone for that whole stretch. */
      const overlapping = contact < 1;
      /* Quantised: the gradient is cheap to paint but not cheap to re-parse,
         and at this granularity the change is already invisible. */
      const step = overlapping ? Math.round(Math.max(0, contact) * 60) : -1;
      if (step !== fadeStep.current) {
        fadeStep.current = step;
        let mask = "none";
        if (overlapping) {
          const startsAt = Math.max(KEEP_MIN, step / 60 - LEAD);
          const midAt = Math.min(0.97, startsAt + 0.16);
          /* Stops are given as fractions of the device, but the mask area is
             larger than it by MASK_PAD on each side, so each one is remapped
             into that larger area or the fade lands high. */
          const into = (f: number) => ((MASK_PAD + f * h) / (h + MASK_PAD * 2)) * 100;
          mask =
            `linear-gradient(to bottom, #000 0 ${into(startsAt).toFixed(1)}%,` +
            ` rgb(0 0 0 / 0.28) ${into(midAt).toFixed(1)}%,` +
            ` rgb(0 0 0 / ${FAINT}) ${into(1).toFixed(1)}%)`;
        }
        maskEl.style.maskImage = mask;
        maskEl.style.webkitMaskImage = mask;
      }

      if (overlapping !== arrived.current) {
        arrived.current = overlapping;
        setShowcase(overlapping ? "cards" : null);
      }
    };

    draw();
    gsap.ticker.add(draw);
    ScrollTrigger.addEventListener("refresh", measure);

    return () => {
      gsap.ticker.remove(draw);
      ScrollTrigger.removeEventListener("refresh", measure);
      window.removeEventListener("resize", measure);
      ro.disconnect();
      holder.style.transform = "";
      maskEl.style.maskImage = "";
      maskEl.style.webkitMaskImage = "";
    };
  }, [enabled, reduced, roomy]);

  if (!enabled) return null;

  return (
    /* Matches the column the hero held it in, so it starts exactly where it
       always sat. Under the navigation, which it passes beneath on its way
       off the top. */
    <div className="pointer-events-none fixed top-[88px] right-[12.4%] bottom-[192px] z-30 hidden items-center lg:flex">
      <div
        ref={holderRef}
        className="pointer-events-auto relative h-full max-h-[500px] xl:max-h-[620px]"
        /* The device hangs in an out-of-flow child, so this box has nothing to
           take its width from and collapses to zero — which silently breaks
           the centring, since that is solved from this box's midpoint. */
        style={{ willChange: "transform", aspectRatio: DEVICE_ASPECT }}
      >
        {/* Out of flow and inset outwards, so its border box — which is what
            the mask clips to — is the device plus MASK_PAD all round. The
            padding puts the device back in the middle of it. */}
        <div
          ref={maskRef}
          className="absolute"
          style={{ inset: -MASK_PAD, padding: MASK_PAD }}
        >
          {/* h-full, not size-full: the device takes its width from its own
              aspect ratio, and pinning both dimensions overrides that and
              draws it stretched and clipped. */}
          <HeroDevice
            shift={roomy ? 24 : 5}
            flatten={flatten}
            showcase={showcase}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
