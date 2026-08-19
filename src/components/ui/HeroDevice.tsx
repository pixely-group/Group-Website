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
/* Kept because the body is pushed forward by it, which is what sets the
   device's apparent size under the perspective. Nothing is drawn in the
   depth any more: the side rails and the back panel are gone, so no turn of
   the device can reveal either. */
const THICK = 50;

/**
 * Square to the reader at rest, and how far the pointer may push it. The
 * device has no sides and no back to show — see the note on THICK — so the
 * swing is a parallax cue rather than a turn, and is kept small enough to
 * read as one.
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
const REST_Y = 0;
const REST_X = 0;
const SWING_Y = 4;
const SWING_X = 3;
const PERSPECTIVE = 820;

export default function HeroDevice({
  className = "",
  shift = 0,
  showcase = null,
  flatten,
}: {
  /** How far the device may slide either side of rest, in px. Passed in
   *  because only the caller knows what room its column has. */
  shift?: number;
  /** Forces the app to a particular screen, for the scroll sequence. */
  showcase?: "cards" | null;
  /** 0 is the resting three-quarter view with the pointer live; 1 is square
   *  to the reader and still. Read from a ref every frame rather than passed
   *  as a value, so the scroll can drive it without re-rendering the app
   *  inside the screen sixty times a second. */
  flatten?: { current: number };
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

      // Everything the device does at rest is scaled out together as the
      // scroll squares it up, so at 1 the transform is exactly identity
      // rather than a very small angle that still catches the light.
      const hold = 1 - (flatten ? Math.min(1, Math.max(0, flatten.current)) : 0);

      const ry = (REST_Y + eased.x * SWING_Y + Math.sin(elapsed * 0.4) * 0.7) * hold;
      const rx = (REST_X - eased.y * SWING_X + Math.cos(elapsed * 0.31) * 0.5) * hold;
      // Lateral first: the device goes to the side the cursor is on.
      const tx = eased.x * travel * hold;
      const ty = Math.sin(elapsed * 0.5) * 5 * hold;
      tilt.style.transform = `translate3d(${tx}px,${ty}px,0) rotateX(${rx}deg) rotateY(${ry}deg)`;

      // One hairline of light travelling across the glass, opposite the turn.
      // It fades with the angle: on a flat face it is a smear with no cause.
      sheen.style.opacity = `${hold}`;
      sheen.style.transform = `translate3d(${-eased.x * 34 - ry * 2.6}px,0,0) rotate(${-14 + ry * 0.4}deg)`;
    };
    gsap.ticker.add(draw);

    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(draw);
    };
  }, [live, shift, flatten]);

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
