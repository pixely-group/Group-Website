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
const DROP = 120;
/** Scale on arrival, and what it grows to as the reader keeps going.
 *  CLOSE was 1.16 against a 690pt device, which put the wallet on screen at
 *  800. Capping the hero at 648 to clear the trust line took that to 752
 *  without anyone asking it to, so this is not only a zoom but a repair:
 *  1.30 puts the wallet at 842, which is more than it ever was and still
 *  inside a 1004pt viewport with the whole phone showing. */
const LANDED = 0.86;
const CLOSE = 1.3;
/** Scroll past the stop over which that growth happens. Short on purpose:
 *  the device is anchored to the page by then, so every pixel spent growing
 *  is also a pixel of it travelling up the screen. Stretch this and it
 *  reaches full size only once it has left the frame. */
const ZOOM = 180;
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
  const flatten = useRef(0);
  const arrived = useRef(false);
  const [showcase, setShowcase] = useState<"cards" | null>(null);
  /* Which way the scroll crossed the threshold. The wallet pushes in from the
     right on the way down and from the left on the way back up, so the motion
     reverses with the reader rather than always arriving the same way. */
  const [enterFrom, setEnterFrom] = useState<"left" | "right" | null>(null);
  const reduced = useReducedMotion();
  /** Below lg there is no column to start from and no room to travel. */
  /* The travelling phone is the wide-and-landscape experience: it flies
     down a column beside the copy, which only exists when there is a column
     beside the copy. Portrait — including a 1024pt tablet held upright —
     gets the hero's own inline device instead. Same rule the globe keeps. */
  const enabled = useMediaQuery(
    "(min-width: 1024px) and (orientation: landscape)",
  );
  const roomy = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || !enabled || reduced) return;

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

      /* Solved from the same numbers the transform is built from, and only
         to decide which screen the wallet shows. The fade is no longer this
         component's business: it is a static scrim in the section itself, so
         nothing here is rewritten per frame. */
      const h = baseH * scale;
      const deviceTop = restCentreY + dy * p - rise - h / 2;
      const overlapping = (copyTopPage - y - deviceTop) / h < 1;

      if (overlapping !== arrived.current) {
        arrived.current = overlapping;
        setShowcase(overlapping ? "cards" : null);
        setEnterFrom(overlapping ? "right" : "left");
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
    };
  }, [enabled, reduced, roomy]);

  if (!enabled) return null;

  return (
    /* Matches the column the hero held it in. Under the navigation, which it
       passes beneath on its way off the top.

       The band is the full viewport and the device is centred in it — its
       centre is the screen's centre at every browser height, at full size.
       No viewport-derived cap, and nothing hidden to make room: shrinking
       the phone was rejected and so was hiding the hero's mission pillars.
       On shorter windows those lines pass beneath the phone, which floats
       over the hero on its own layer — layering, not collision. */
    /* Under reduced motion there is no journey, so there is no reason to be
       fixed: pinned to the viewport it simply hung over every chapter down to
       the footer. Anchored to the top of the page instead, it stays where the
       journey would have started, beside the hero's copy, and leaves with
       the hero like any still picture. */
    <div
      className={`pointer-events-none right-[12.4%] z-30 hidden items-center beside:flex ${
        reduced ? "absolute top-0 h-[100svh]" : "fixed inset-y-0"
      }`}
    >
      <div
        ref={holderRef}
        className="pointer-events-auto relative h-full max-h-[560px] xl:max-h-[648px]"
        /* The device hangs in an out-of-flow child, so this box has nothing to
           take its width from and collapses to zero — which silently breaks
           the centring, since that is solved from this box's midpoint. */
        style={{ willChange: "transform", aspectRatio: DEVICE_ASPECT }}
      >
        {/* h-full, not size-full: the device takes its width from its own
            aspect ratio, and pinning both dimensions overrides that and draws
            it stretched and clipped. */}
        <HeroDevice
          shift={roomy ? 24 : 5}
          flatten={flatten}
          showcase={showcase}
          enterFrom={enterFrom}
          className="h-full"
        />
      </div>
    </div>
  );
}
