"use client";

import { useEffect, useRef, useState } from "react";
import AppScreen from "@/components/ui/AppScreen";
import { gsap } from "@/lib/gsap";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

/**
 * iPhone 17 Pro, drawn to its own dimensions and tilted by the pointer.
 *
 * Geometry is the real one in logical points: a 402 × 874 display, a 4.4 pt
 * bezel and a 4 pt rail either side of it. The Action button and the volume
 * pair sit on the left, the side button and Camera Control on the right, at
 * the heights the hardware puts them. Everything is laid out at scale 1 and
 * the whole assembly is scaled once, so the proportions cannot drift.
 */
const SCREEN_W = 402;
const SCREEN_H = 874;
const BEZEL = 4.4;
const RAIL = 4;
const BODY_W = SCREEN_W + (BEZEL + RAIL) * 2;
const BODY_H = SCREEN_H + (BEZEL + RAIL) * 2;
const SCREEN_R = 54;

/** Machined aluminium: bands of light rather than a single ramp. */
const RAIL_METAL =
  "linear-gradient(148deg,#79828f 0%,#eef1f6 7%,#aab3c0 17%,#5c6572 32%,#98a1af 47%,#e4e9f0 60%,#79828f 74%,#bcc4d0 88%,#69727f 100%)";
const BUTTON_METAL =
  "linear-gradient(180deg,#b9c1cd 0%,#7d8695 40%,#5f6875 60%,#a8b0bd 100%)";

/** How far the pointer may push it, in degrees. */
const TILT_Y = 13;
const TILT_X = 9;
/** Where it rests, so it has presence before the pointer arrives. */
const REST_Y = -7;
const REST_X = 3;

type Props = {
  /** Sets the stage's height; the aspect ratio supplies the width. */
  className?: string;
};

export default function PhoneDevice({ className = "" }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  /** Measured rather than passed in: the caller sizes the stage in CSS and
   *  the device works out what that means for the drawing inside it. */
  const [scale, setScale] = useState(0);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

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
    const glare = glareRef.current;
    const screen = screenRef.current;
    const glow = glowRef.current;
    if (!tilt || !glare || !screen || !glow) return;

    if (!live) {
      // Held at its resting angle: still a three-quarter view, just not a
      // moving one. Nothing is listening and nothing is ticking.
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
      // Frame-rate independent easing: a fixed per-frame fraction would
      // chase faster on a 120Hz display than on a 60Hz one.
      const k = 1 - Math.pow(0.0016, dt / 1000);
      eased.x += (target.x - eased.x) * k;
      eased.y += (target.y - eased.y) * k;

      // A slow drift underneath the pointer, so it is alive while the
      // pointer is still.
      const driftY = Math.sin(elapsed * 0.45) * 1.3;
      const driftX = Math.cos(elapsed * 0.33) * 0.9;
      const float = Math.sin(elapsed * 0.55) * 7;

      const ry = REST_Y + eased.x * TILT_Y + driftY;
      const rx = REST_X - eased.y * TILT_X + driftX;
      tilt.style.transform = `translate3d(0,${float}px,0) rotateX(${rx}deg) rotateY(${ry}deg)`;

      // The glass catches the light from the opposite side to the turn.
      glare.style.transform = `translate3d(${-eased.x * 42 - ry * 3}px,${-eased.y * 30}px,0) rotate(${-18 + ry * 0.5}deg)`;
      glare.style.opacity = `${0.34 - Math.abs(ry) * 0.006}`;

      // Contents sit behind the glass, so they lag the frame very slightly.
      screen.style.transform = `translate3d(${eased.x * 5}px,${eased.y * 4}px,0)`;

      // The cast glow follows the lean, as a real shadow would.
      glow.style.transform = `translate3d(${ry * 2.4}px,${18 - rx * 1.6}px,0)`;
    };
    gsap.ticker.add(draw);

    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(draw);
    };
  }, [live]);

  return (
    <div
      ref={stageRef}
      className={className}
      style={{
        aspectRatio: `${BODY_W} / ${BODY_H}`,
        perspective: 1500,
        perspectiveOrigin: "50% 45%",
        // Nothing to draw until the stage has been measured; fading in from
        // that first measurement doubles as the entrance.
        opacity: scale ? 1 : 0,
        transition: "opacity 700ms var(--ease-out-expo)",
      }}
    >
      <div
        ref={tiltRef}
        className="relative size-full"
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
          transform: `rotateX(${REST_X}deg) rotateY(${REST_Y}deg)`,
        }}
      >
        {/* Scaling is CSS's job and the tilt is GSAP's — kept on separate
            elements so neither overwrites the other. */}
        {/* Taken out of flow on purpose. Left in it, the drawing's unscaled
            418pt width becomes the stage's content width and defeats the
            aspect ratio — the stage measures 419 wide while the phone drawn
            inside it is 299, and everything positioned against the stage's
            edge is out by the difference. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: BODY_W,
            height: BODY_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Ambient light thrown onto whatever is behind it */}
          <div
            ref={glowRef}
            aria-hidden
            className="absolute -inset-x-16 -bottom-16 top-10 -z-10 rounded-[50%]"
            style={{
              background:
                "radial-gradient(50% 46% at 50% 55%, rgba(45,70,255,0.42) 0%, rgba(45,70,255,0.12) 45%, transparent 72%)",
              filter: "blur(46px)",
            }}
          />

          {/* Side hardware, behind the rail so only the nubs show */}
          <div aria-hidden>
            {[
              { top: 168, h: 32, side: "left" },
              { top: 226, h: 60, side: "left" },
              { top: 300, h: 60, side: "left" },
              { top: 238, h: 98, side: "right" },
              { top: 372, h: 40, side: "right" },
            ].map((b, i) => (
              <span
                key={i}
                className="absolute w-[3.5px] rounded-[2px]"
                style={{
                  top: b.top,
                  height: b.h,
                  [b.side]: -3,
                  background: BUTTON_METAL,
                  boxShadow: "0 0 2px rgba(0,0,0,0.4)",
                }}
              />
            ))}
          </div>

          {/* Rail */}
          <div
            className="absolute inset-0 rounded-[62px]"
            style={{
              background: RAIL_METAL,
              padding: RAIL,
              boxShadow:
                "0 42px 80px -32px rgba(0,0,0,0.75), 0 8px 24px -12px rgba(0,0,0,0.6)",
            }}
          >
            {/* Bezel */}
            <div
              className="size-full rounded-[58px] bg-[#05060a]"
              style={{
                padding: BEZEL,
                boxShadow:
                  "inset 0 0 0 0.5px rgba(255,255,255,0.16), inset 0 1px 3px rgba(0,0,0,0.9)",
              }}
            >
              {/* Display */}
              <div
                className="relative size-full overflow-hidden bg-black"
                style={{ borderRadius: SCREEN_R }}
              >
                <div ref={screenRef} className="size-full" style={{ willChange: "transform" }}>
                  <AppScreen />
                </div>

                {/* Dynamic Island */}
                <div
                  aria-hidden
                  className="absolute left-1/2 top-[13px] h-[37px] w-[126px] -translate-x-1/2 rounded-[19px] bg-black"
                >
                  <span className="absolute right-[13px] top-1/2 size-[9px] -translate-y-1/2 rounded-full bg-[#10151f]" />
                </div>

                {/* Glass */}
                <div
                  ref={glareRef}
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-1/2 -inset-y-1/4"
                  style={{
                    background:
                      "linear-gradient(96deg, transparent 30%, rgba(255,255,255,0.5) 44%, rgba(255,255,255,0.72) 50%, rgba(255,255,255,0.42) 56%, transparent 70%)",
                    opacity: 0.34,
                    willChange: "transform, opacity",
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    borderRadius: SCREEN_R,
                    boxShadow:
                      "inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.2)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
