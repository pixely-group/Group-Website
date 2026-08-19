"use client";

import { useEffect, useRef, useState } from "react";
import WalletScreen from "@/components/ui/WalletScreen";
import { gsap } from "@/lib/gsap";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

/**
 * A phone, drawn the way the rest of this site draws things: an accurate
 * silhouette in matte black with a single hairline catching the light. No
 * banded chrome, no gloss — a glossy render would sit against the hairlines
 * and technical drawings everywhere else here like a stock photo.
 *
 * Dimensions are the hardware's in logical points, so the screen inside is
 * laid out at exactly the size a designer would work at.
 */
const SCREEN_W = 402;
const SCREEN_H = 874;
const BEZEL = 5;
const BODY_W = SCREEN_W + BEZEL * 2;
const BODY_H = SCREEN_H + BEZEL * 2;
const SCREEN_R = 52;

/**
 * Resting three-quarter view, and how far the pointer may push it. The turn
 * is deliberately small — five degrees off its rest either way — because the
 * pointer's main answer is now lateral: the device slides toward whichever
 * side the cursor is on, and the tilt only seasons that.
 */
const REST_Y = -5;
const REST_X = 2;
const SWING_Y = 5;
const SWING_X = 3;

export default function HeroDevice({
  className = "",
  shift = 0,
}: {
  /** How far the device may slide either side of rest, in px. Passed in
   *  because only the caller knows what room its column has. */
  shift?: number;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const live = fine && !reduced;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(() => {
      const h = stage.getBoundingClientRect().height;
      if (h > 0) setScale(h / BODY_H);
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const tilt = tiltRef.current;
    const sheen = sheenRef.current;
    if (!tilt || !sheen) return;
    const travel = shift;

    if (!live) {
      tilt.style.transform = `rotateX(${REST_X}deg) rotateY(${REST_Y}deg)`;
      return;
    }

    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let elapsed = 0;
    const draw = (_t: number, dt: number) => {
      elapsed += dt / 1000;
      // Frame-rate independent: a fixed per-frame fraction would chase
      // faster on a 120Hz display than on a 60Hz one.
      const k = 1 - Math.pow(0.004, dt / 1000);
      eased.x += (target.x - eased.x) * k;
      eased.y += (target.y - eased.y) * k;

      const ry = REST_Y + eased.x * SWING_Y + Math.sin(elapsed * 0.4) * 0.7;
      const rx = REST_X - eased.y * SWING_X + Math.cos(elapsed * 0.31) * 0.5;
      // Lateral first: the device goes to the side the cursor is on.
      const tx = eased.x * travel;
      const ty = Math.sin(elapsed * 0.5) * 5;
      tilt.style.transform = `translate3d(${tx}px,${ty}px,0) rotateX(${rx}deg) rotateY(${ry}deg)`;

      // One hairline of light travelling across the glass, opposite the turn.
      sheen.style.transform = `translate3d(${-eased.x * 34 - ry * 2.6}px,0,0) rotate(${-14 + ry * 0.4}deg)`;
    };
    gsap.ticker.add(draw);

    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(draw);
    };
  }, [live, shift]);

  return (
    <div
      ref={stageRef}
      className={className}
      style={{
        aspectRatio: `${BODY_W} / ${BODY_H}`,
        perspective: 1600,
        perspectiveOrigin: "50% 42%",
        opacity: scale ? 1 : 0,
        transition: "opacity 600ms var(--ease-out-expo)",
      }}
    >
      {/* Transparent, and deliberately untouchable. Under `preserve-3d` this
          wrapper's plane is coplanar with the content it carries, so the hit
          test resolves unstably between the two as the device drifts — about
          a third of the time it answered "the wrapper", and a click on the
          app inside would quietly do nothing. It paints nothing, so it has no
          business being hit at all. */}
      <div
        ref={tiltRef}
        className="pointer-events-none relative size-full"
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
          transform: `rotateX(${REST_X}deg) rotateY(${REST_Y}deg)`,
        }}
      >
        {/* Out of flow: left in it, the drawing's unscaled width becomes the
            stage's content width and defeats the aspect ratio. */}
        <div
          style={{
            position: "absolute",
            pointerEvents: "auto",
            top: 0,
            left: 0,
            width: BODY_W,
            height: BODY_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Side hardware — nubs only, at the heights the hardware puts them */}
          <div aria-hidden>
            {[
              { top: 165, h: 30, side: "left" as const },
              { top: 222, h: 58, side: "left" as const },
              { top: 295, h: 58, side: "left" as const },
              { top: 234, h: 96, side: "right" as const },
              { top: 366, h: 38, side: "right" as const },
            ].map((b, i) => (
              <span
                key={i}
                className="absolute w-[2.5px] rounded-[1.5px]"
                style={{
                  top: b.top,
                  height: b.h,
                  [b.side]: -2.5,
                  background:
                    "linear-gradient(180deg,rgba(236,233,225,0.30),rgba(236,233,225,0.10))",
                }}
              />
            ))}
          </div>

          {/* Body: matte, with one hairline edge and a cast shadow */}
          <div
            className="absolute inset-0 rounded-[57px] bg-[#06070a]"
            style={{
              padding: BEZEL,
              boxShadow:
                "inset 0 0 0 1px rgba(236,233,225,0.22), inset 0 1px 0 rgba(236,233,225,0.4), 0 50px 90px -40px rgba(0,0,0,0.9), 0 0 90px -40px rgba(45,70,255,0.5)",
            }}
          >
            <div
              className="relative size-full overflow-hidden bg-black"
              style={{ borderRadius: SCREEN_R }}
            >
              <WalletScreen />

              <div
                aria-hidden
                className="absolute top-[12px] left-1/2 h-[36px] w-[122px] -translate-x-1/2 rounded-[18px] bg-black"
              >
                <span className="absolute top-1/2 right-[12px] size-[8px] -translate-y-1/2 rounded-full bg-[#12161f]" />
              </div>

              <div
                ref={sheenRef}
                aria-hidden
                className="pointer-events-none absolute -inset-y-1/4 -inset-x-1/2"
                style={{
                  background:
                    "linear-gradient(100deg, transparent 46%, rgba(236,233,225,0.018) 49.4%, rgba(236,233,225,0.038) 50.4%, rgba(236,233,225,0.018) 51.4%, transparent 55%)",
                  willChange: "transform",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  borderRadius: SCREEN_R,
                  boxShadow: "inset 0 0 0 1px rgba(236,233,225,0.07)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
