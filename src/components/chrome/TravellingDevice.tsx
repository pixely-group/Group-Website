"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
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
/** How much of the screen the fade leaves alone. The wallet's cards occupy
 *  the upper half of the display and the copy crosses at about 53%, so the
 *  fade starts below both — set higher, it dims the cards themselves. */
const KEEP = 0.54;
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
  const fadeStep = useRef(-1);
  const [showcase, setShowcase] = useState<"cards" | null>(null);
  const reduced = useReducedMotion();
  /** Below lg there is no column to start from and no room to travel. */
  const enabled = useMediaQuery("(min-width: 1024px)");
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

      /* The lower half fades out as the device settles over the section copy,
         so the text in front of it reads against the background rather than
         against a phone. Quantised: the gradient is cheap to paint but not
         cheap to re-parse, and at 24 steps the change is already invisible. */
      const step = Math.round(near * 24);
      if (step !== fadeStep.current) {
        fadeStep.current = step;
        const t = step / 24;
        /* No mask at all until there is something to fade. A mask paints only
           within its own box, and the device does not stay inside that box:
           tilted by the pointer it spills about 21px past the left edge, and
           every one of those pixels was being cut. In the hero, and for the
           whole travel, the chassis has to be able to lean out of its box. */
        let mask = "none";
        if (t > 0) {
          const mid = 1 - 0.7 * t;
          const end = 1 - (1 - FAINT) * t;
          mask = `linear-gradient(to bottom, #000 0 ${KEEP * 100}%, rgb(0 0 0 / ${mid}) 70%, rgb(0 0 0 / ${end}) 86%)`;
        }
        holder.style.maskImage = mask;
        holder.style.webkitMaskImage = mask;
      }

      if (p >= 1 !== arrived.current) {
        arrived.current = p >= 1;
        setShowcase(arrived.current ? "cards" : null);
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
      holder.style.maskImage = "";
      holder.style.webkitMaskImage = "";
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
        className="pointer-events-auto h-full max-h-[500px] xl:max-h-[620px]"
        style={{ willChange: "transform" }}
      >
        <HeroDevice
          shift={roomy ? 24 : 5}
          flatten={flatten}
          showcase={showcase}
          className="h-full"
        />
      </div>
    </div>
  );
}
