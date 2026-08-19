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
 * Body depth. The hardware is 8.75mm thick against 71.9mm wide, and the
 * body here is 412pt wide, so the honest number is 50pt. It matters now:
 * the device used to be a single plane, which meant turning it only
 * foreshortened the front — there was no side there to come into view.
 */
const THICK = 50;
/** The rails run between the corners, so they do not cut across the radius. */
const CORNER = 57;

/**
 * Resting three-quarter view, and how far the pointer may push it.
 *
 * Ten degrees either side of rest, and read against a much nearer camera
 * than before. Degrees on their own do not make a turn visible: at the 1600px
 * perspective this had, a 5-degree yaw moves the near and far edges of a
 * 261px-wide device by under 3% of its width, which is real in the transform
 * and invisible on the screen. At 820 the same turn is worth about 6%, and
 * at ten degrees it reads plainly.
 */
/**
 * Which rail you see is decided by surface normals, not by bounding boxes —
 * I checked it the second way first and got it backwards.
 *
 * The right rail carries its own rotateY(90deg), so under a parent yaw P its
 * normal points along cos(P + 90) = -sin(P): it faces the camera only while
 * P is negative. The left rail is the mirror of that. So negative yaw shows
 * the lock button and Camera Control; positive shows the Action button and
 * the volume pair.
 *
 * Held at -14 with a 7 degree swing, so P stays between -21 and -7 and that
 * side is presented the whole time — enough to read as an edge, not so much
 * that the screen turns away.
 */
const REST_Y = -14;
const REST_X = 2;
const SWING_Y = 7;
const SWING_X = 6;
const PERSPECTIVE = 820;

export default function HeroDevice({
  className = "",
  shift = 0,
  showcase = null,
  flat = false,
}: {
  /** How far the device may slide either side of rest, in px. Passed in
   *  because only the caller knows what room its column has. */
  shift?: number;
  /** Forces the app to a particular screen, for the scroll sequence. */
  showcase?: "cards" | null;
  /** Square to the reader: no yaw, no pitch, no pointer follow. A CSS 3D
   *  turn cannot be made convincing, so the device does not attempt one. */
  flat?: boolean;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  /** Held still while the pointer is over it. The device answers the pointer
   *  by sliding and turning, which is fine until you reach for something
   *  inside the app: moving toward a control moves the control. Everything
   *  in there was reachable and none of it was hittable. */
  const hovering = useRef(false);
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

    if (flat) {
      /* Dead straight, and still: the sheen is a lighting cue for a turning
         surface, so on a flat one it only reads as a smear drifting about. */
      tilt.style.transform = "none";
      sheen.style.transform = "translate3d(0,0,0) rotate(-14deg)";
      return;
    }

    if (!live) {
      tilt.style.transform = `rotateX(${REST_X}deg) rotateY(${REST_Y}deg)`;
      return;
    }

    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const box = stageRef.current?.getBoundingClientRect();
      hovering.current = !!box
        && e.clientX >= box.left && e.clientX <= box.right
        && e.clientY >= box.top && e.clientY <= box.bottom;
      // Kept current even while frozen, so leaving eases from where the
      // pointer is rather than snapping back to where it was.
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let elapsed = 0;
    const draw = (_t: number, dt: number) => {
      // Frozen: neither the pointer nor the idle drift advances, so whatever
      // you are aiming at stays where it is.
      if (hovering.current) return;
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
  }, [live, shift, flat]);

  return (
    <div
      ref={stageRef}
      className={className}
      style={{
        aspectRatio: `${BODY_W} / ${BODY_H}`,
        perspective: PERSPECTIVE,
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
          transform: flat
            ? "none"
            : `rotateX(${REST_X}deg) rotateY(${REST_Y}deg)`,
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
          {/* The two sides of the device, standing at right angles to the
              front so a turn actually reveals one. Each hinges on its own
              edge and runs back exactly the body's depth, which puts the
              front face at z = THICK and the back at z = 0. */}
          {(
            [
              {
                side: "right" as const,
                origin: "100% 50%",
                rotate: 90,
                buttons: [
                  { top: 234, h: 96 },  // side button
                  { top: 366, h: 38 },  // Camera Control
                ],
              },
              {
                side: "left" as const,
                origin: "0% 50%",
                rotate: -90,
                buttons: [
                  { top: 165, h: 30 },  // Action button
                  { top: 222, h: 58 },  // volume up
                  { top: 295, h: 58 },  // volume down
                ],
              },
            ]
          ).map((rail) => (
            <div
              key={rail.side}
              aria-hidden
              style={{
                position: "absolute",
                top: CORNER,
                bottom: CORNER,
                [rail.side]: 0,
                width: THICK,
                transformOrigin: rail.origin,
                transform: `rotateY(${rail.rotate}deg)`,
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                background:
                  "linear-gradient(90deg,#0b0c10 0%,#23262e 22%,#3a3e48 48%,#1c1f26 78%,#090a0d 100%)",
                boxShadow: "inset 0 1px 0 rgba(236,233,225,0.20)",
              }}
            >
              {rail.buttons.map((b) => (
                <span
                  key={b.top}
                  style={{
                    position: "absolute",
                    top: b.top - CORNER,
                    height: b.h,
                    left: THICK * 0.28,
                    width: THICK * 0.44,
                    borderRadius: 3,
                    background:
                      "linear-gradient(90deg,#2c303a 0%,#4a4f5c 45%,#20232b 100%)",
                    boxShadow:
                      "inset 0 1px 0 rgba(236,233,225,0.28), 0 1px 2px rgba(0,0,0,0.6)",
                  }}
                />
              ))}
            </div>
          ))}

          {/* The back, at z = 0 and turned to face away, so a full turn has
              something to land on. Without it the rails hide their own
              backfaces and the device is see-through from behind. */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-[57px]"
            style={{
              transform: "rotateY(180deg)",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              background:
                "linear-gradient(155deg,#15181f 0%,#0b0d12 38%,#04050700 39%,#0a0c11 62%,#191d25 100%)",
              boxShadow:
                "inset 0 0 0 1px rgba(236,233,225,0.18), inset 0 1px 0 rgba(236,233,225,0.30)",
            }}
          >
            {/* Camera plateau, mirrored to the left because the whole face is. */}
            <div
              style={{
                position: "absolute",
                top: 30,
                left: 30,
                width: 170,
                height: 170,
                borderRadius: 46,
                background: "linear-gradient(150deg,#20242d 0%,#0d1015 55%,#171b23 100%)",
                boxShadow:
                  "inset 0 0 0 1px rgba(236,233,225,0.14), 0 6px 18px -6px rgba(0,0,0,0.85)",
              }}
            >
              {[
                { top: 22, left: 22 },
                { top: 22, left: 92 },
                { top: 92, left: 22 },
              ].map((lens) => (
                <span
                  key={`${lens.top}-${lens.left}`}
                  style={{
                    position: "absolute",
                    top: lens.top,
                    left: lens.left,
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 38% 32%,#3b4250 0%,#12151b 46%,#05070a 100%)",
                    boxShadow:
                      "inset 0 0 0 3px #1b1f27, inset 0 0 0 4px rgba(236,233,225,0.10), 0 2px 6px rgba(0,0,0,0.7)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 14,
                      width: 12,
                      height: 8,
                      borderRadius: "50%",
                      background: "rgba(236,233,225,0.22)",
                      filter: "blur(1px)",
                    }}
                  />
                </span>
              ))}
              <span
                style={{
                  position: "absolute",
                  top: 100,
                  left: 100,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 35%,#4a5160 0%,#1a1e26 70%)",
                  boxShadow: "inset 0 0 0 2px rgba(236,233,225,0.10)",
                }}
              />
            </div>
            {/* The wordmark reads correctly once the face is turned. */}
            <span
              style={{
                position: "absolute",
                top: "46%",
                left: 0,
                right: 0,
                textAlign: "center",
                font: "500 34px/1 var(--font-display), system-ui, sans-serif",
                letterSpacing: "0.24em",
                color: "rgba(236,233,225,0.16)",
              }}
            >
              PIXELY
            </span>
          </div>

          {/* Body: matte, with one hairline edge and a cast shadow. Pushed
              forward by the body's own depth so it caps the rails. */}
          <div
            className="absolute inset-0 rounded-[57px] bg-[#06070a]"
            style={{
              transform: `translateZ(${THICK}px)`,
              transformStyle: "preserve-3d",
              padding: BEZEL,
              boxShadow:
                "inset 0 0 0 1px rgba(236,233,225,0.22), inset 0 1px 0 rgba(236,233,225,0.4), 0 50px 90px -40px rgba(0,0,0,0.9), 0 0 90px -40px rgba(45,70,255,0.5)",
            }}
          >
            <div
              className="relative size-full overflow-hidden bg-black"
              style={{ borderRadius: SCREEN_R }}
            >
              <WalletScreen showcase={showcase} />

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
