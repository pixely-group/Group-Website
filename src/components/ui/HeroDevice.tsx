"use client";

import { useEffect, useRef, useState } from "react";

import { BEZEL, BODY_H, BODY_W } from "@/lib/device";
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
const SCREEN_R = 52;

/**
 * A slight turn at rest — square to the reader reads flat — and how far the
 * pointer may push it. Safe at any angle now: the device has no sides and no
 * back to show, so the
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
const REST_Y = -7;
const REST_X = 1.5;
const SWING_Y = 4;
const SWING_X = 3;
const PERSPECTIVE = 820;

export default function HeroDevice({
  className = "",
  shift = 0,
  showcase = null,
  enterFrom = null,
  flatten,
}: {
  /** How far the device may slide either side of rest, in px. Passed in
   *  because only the caller knows what room its column has. */
  shift?: number;
  /** Forces the app to a particular screen, for the scroll sequence. */
  showcase?: "cards" | null;
  /** Which way the last screen change came from, so it can animate back the
   *  way it arrived when the reader scrolls up again. */
  enterFrom?: "left" | "right" | null;
  /** 0 is the resting three-quarter view with the pointer live; 1 is square
   *  to the reader and still. Read from a ref every frame rather than passed
   *  as a value, so the scroll can drive it without re-rendering the app
   *  inside the screen sixty times a second. */
  flatten?: { current: number };
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
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
    /* Read from the observer's own box, not from a rect. getBoundingClientRect
       reports the painted size, which includes every ancestor transform — and
       this device spends the scroll inside one that scales to 1.42. Measured
       that way it saw 880 where its layout box was 620 and redrew itself at
       0.99 instead of 0.695, which is a phone half again too big. The
       observer's borderBoxSize is layout, and layout is what this wants. */
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      if (h > 0) setScale(h / BODY_H);
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const tilt = tiltRef.current;
    if (!tilt) return;
    const travel = shift;

    if (!live) {
      tilt.style.transform = `rotateX(${REST_X}deg) rotateY(${REST_Y}deg)`;
      return;
    }

    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    /* Where the pointer last was, kept so the frame loop can re-ask the
       question. Deciding hover inside the move handler alone was the bug:
       during the scroll the device travels several hundred pixels under a
       pointer that never moves, so the answer went stale the moment the two
       stopped agreeing. */
    const at = { x: 0, y: 0, seen: false };
    const onMove = (e: PointerEvent) => {
      at.x = e.clientX;
      at.y = e.clientY;
      at.seen = true;
      // Kept current even while frozen, so leaving eases from where the
      // pointer is rather than snapping back to where it was.
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    /* One rect per frame at most, and only when the answer can have changed
       — the pointer moved, or the page did. Idle, it reads nothing. */
    let lastX = NaN;
    let lastY = NaN;
    let lastScroll = NaN;
    const testHover = () => {
      if (!at.seen) return;
      const scroll = window.scrollY;
      if (at.x === lastX && at.y === lastY && scroll === lastScroll) return;
      lastX = at.x;
      lastY = at.y;
      lastScroll = scroll;
      const box = stageRef.current?.getBoundingClientRect();
      hovering.current =
        !!box &&
        at.x >= box.left && at.x <= box.right &&
        at.y >= box.top && at.y <= box.bottom;
    };

    let elapsed = 0;
    const draw = (_t: number, dt: number) => {
      testHover();

      /* Frozen: neither the pointer nor the idle drift advances, so whatever
         you are aiming at stays where it is. Only those two stop — the frame
         still writes, because the transform also carries the scroll's own
         squaring-up and that belongs to the page, not to the pointer.
         Returning here instead left the device holding whatever angle it had
         when the pointer arrived while the scroll went on without it, and it
         jumped to catch up the moment the freeze lifted. */
      if (!hovering.current) {
        elapsed += dt / 1000;
        // Frame-rate independent: a fixed per-frame fraction would chase
        // faster on a 120Hz display than on a 60Hz one.
        const k = 1 - Math.pow(0.004, dt / 1000);
        eased.x += (target.x - eased.x) * k;
        eased.y += (target.y - eased.y) * k;
      }

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
            /* Flat, and it matters. This was preserve-3d from when the body
               was pushed forward on its own Z to cap the side rails; the
               rails are gone, the push is gone, and nothing under here has a
               transform of its own any more. What it left behind was a
               screen whose pixels did not answer where they were drawn.

               Kept in 3D, every element in the phone is hit-tested in the
               parent's space instead of on one flattened plane, and the
               error grows across the yaw: Send answered over its whole face,
               Receive over a third of it, and Top Up over none of it at all
               — the outlines of all three sat exactly on what was painted,
               so it was the hit test that was wrong and not the drawing.
               Flattened, the screen composites as one plane, the rotation is
               applied to that plane, and all three answer everywhere. */
            transformStyle: "flat",
          }}
        >
          {/* The body. No longer pushed forward: it used to sit at the front
              of a 50pt depth so it capped the side rails, but with those gone
              there is nothing to cap, and under the perspective that push
              magnified it to 308x661 inside a 289x620 stage — a phone wider
              than the box it was laid out in.

              The frame is a raked gradient rather than a flat fill. It has no
              sides to catch the light, so the light has to be painted on:
              this is what keeps it reading as a device against a background
              almost exactly as dark as it is. */}
          <div
            className="absolute inset-0 rounded-[57px]"
            style={{
              padding: BEZEL,
              background:
                "linear-gradient(148deg,#3c414d 0%,#181c24 15%,#0a0c11 46%,#0d1015 62%,#20242e 88%,#454b58 100%)",
              boxShadow:
                "inset 0 0 0 1px rgba(236,233,225,0.30), inset 0 1px 0 rgba(236,233,225,0.45), 0 50px 90px -40px rgba(0,0,0,0.9), 0 0 90px -40px rgba(45,70,255,0.5)",
            }}
          >
            <div
              className="relative size-full overflow-hidden bg-black"
              style={{ borderRadius: SCREEN_R }}
            >
              <WalletScreen showcase={showcase} enterFrom={enterFrom} />

              <div
                aria-hidden
                className="absolute top-[12px] left-1/2 h-[36px] w-[122px] -translate-x-1/2 rounded-[18px] bg-black"
              >
                <span className="absolute top-1/2 right-[12px] size-[8px] -translate-y-1/2 rounded-full bg-[#12161f]" />
              </div>

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
