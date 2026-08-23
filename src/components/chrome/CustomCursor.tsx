"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

type CursorState = "default" | "link" | "explore" | "text";

/** Diameter of the cursor's centre dot, in px. */
export const CURSOR_DOT_PX = 6;

/**
 * The cursor's resting dot, and the markers parked beside a nav item or a
 * security plate — one number, because the marker is meant to read as that
 * same dot left behind.
 */
export const CURSOR_DOT_LINK_SCALE = 0.4;

/** The parked marker's rendered diameter. */
export const CURSOR_DOT_LINK_PX = CURSOR_DOT_PX * CURSOR_DOT_LINK_SCALE;

/** What the dot grows to over something clickable, and only there. */
/** 0.85, down from 1.15: against the 0.4 resting scale, 1.15 nearly
 *  tripled the dot over a link and it read as a state change rather than a
 *  response. 0.85 still doubles it — plainly awake, no longer swollen. */
const CURSOR_DOT_CLICKABLE_SCALE = 0.85;

/**
 * Cursor ink for the chapter beneath it: a dark section takes the light
 * cursor and vice versa. The ink is re-read on scroll as well as on move,
 * which is what actually fixes a cursor sitting black on a dark chapter; a
 * short cross keeps the change from being a hard snap without leaving the
 * pointer the wrong colour long enough to lose it. `mix-blend-difference` cannot do this job here —
 * the fixed, z-indexed container is its own stacking context, which
 * isolates the blend group, so the cursor would only ever blend against
 * its own transparent parent.
 */
const CURSOR_COLOR = {
  ink: "#ece9e1",
  bone: "#131316",
} as const;

/** Nearest surface that declares a treatment, else the chapter's theme. */
function resolveTheme(el: Element | null): keyof typeof CURSOR_COLOR {
  const holder = el?.closest("[data-cursor-theme], [data-theme]");
  const value =
    holder?.getAttribute("data-cursor-theme") ??
    holder?.getAttribute("data-theme");
  return value === "bone" ? "bone" : "ink";
}

/**
 * Desktop-only cursor: a tight dot and a lagging ring that recolour against
 * whatever chapter they are over. States are driven by `data-cursor`
 * attributes (or native anchors/buttons) via event delegation.
 */
export default function CustomCursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    const root = document.documentElement;
    root.dataset.cursor = "on";
    root.style.setProperty("--cursor-color", CURSOR_COLOR.ink);

    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    let state: CursorState = "default";

    /* The resting scales, applied up front. applyState bails when the state has
       not changed, and the cursor starts in "default" — so without this the
       very first move onto ordinary copy leaves both elements untransformed
       at 1, and the ring only reaches its resting size after visiting a link
       and coming back. It went unnoticed while the root-element bug kept the
       cursor permanently in the link state. */
    gsap.set(ring, { scale: 1.55 });
    gsap.set(dot, { scale: CURSOR_DOT_LINK_SCALE });

    const applyState = (next: CursorState, labelText?: string) => {
      if (next === state && next !== "explore") return;
      state = next;
      const scales: Record<CursorState, { ring: number; dot: number }> = {
        /* The resting state is the one the cursor has actually been in
           everywhere, because of the root-element bug above: ring at 1.55
           with the small parked dot. Kept, so nothing changes except the one
           thing asked for. */
        default: { ring: 1.55, dot: CURSOR_DOT_LINK_SCALE },
        link: { ring: 1.55, dot: CURSOR_DOT_CLICKABLE_SCALE },
        explore: { ring: 2.6, dot: 0 },
        text: { ring: 0.5, dot: 0.6 },
      };
      gsap.to(ring, {
        scale: scales[next].ring,
        duration: 0.5,
        ease: "expo.out",
      });
      gsap.to(dot, {
        scale: scales[next].dot,
        duration: 0.4,
        ease: "expo.out",
      });
      label.textContent = next === "explore" ? (labelText ?? "EXPLORE") : "";
      gsap.to(label, {
        opacity: next === "explore" ? 1 : 0,
        duration: 0.3,
      });
    };

    /** An event target is not necessarily an Element — it can be the
     *  document or the window — and both lookups below call `closest` on it.
     *  The cast that used to stand here asserted otherwise. */
    const asElement = (t: EventTarget | null): Element | null =>
      t instanceof Element ? t : null;

    let theme: keyof typeof CURSOR_COLOR | null = null;
    const applyTheme = (next: keyof typeof CURSOR_COLOR) => {
      if (next === theme) return;
      theme = next;
      // A custom property keeps this off React's render path.
      root.style.setProperty("--cursor-color", CURSOR_COLOR[next]);
    };

    /* Where the pointer was last seen, so the ink can be worked out again
       without it. */
    let lastX = -1;
    let lastY = -1;

    const onMove = (e: PointerEvent) => {
      setVisible(true);
      lastX = e.clientX;
      lastY = e.clientY;
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      applyTheme(resolveTheme(asElement(e.target)));
    };

    /**
     * The chapter can change under a pointer that has not moved.
     *
     * Reading the ink from the pointermove target alone means the cursor only
     * finds out what it is sitting on when it is dragged across something —
     * so scrolling a dark section up under a resting cursor left it black on
     * black until the reader jiggled the mouse. It is re-read on scroll from
     * the last known position instead, which is the moment the thing beneath
     * it actually changes.
     *
     * Scroll is not the only such moment. An overlay opening puts a whole
     * new ground under a pointer that has not moved either, and it does it
     * without scrolling anything — so anything that covers the page says so
     * on this event, and the menu says it on every frame of its wipe. The
     * ink then turns as the edge passes under the cursor.
     */
    const resync = () => {
      if (lastX < 0) return;
      applyTheme(resolveTheme(document.elementFromPoint(lastX, lastY)));
    };

    const resolveTarget = (el: Element | null): [CursorState, string?] => {
      /* :not(html) matters. The component marks the root element
         data-cursor="on" for the CSS that hides the native pointer, and
         without excluding it every element on the page has a [data-cursor]
         ancestor — closest() finds the root, the value is neither "explore"
         nor "text", and the cursor falls through to the link state
         everywhere. It has been in the link state on every pixel of the page;
         it only became visible once the link state started growing the dot
         rather than shrinking it. */
      const hit = el?.closest(
        "[data-cursor]:not(html), a, button, [role='button']",
      );
      if (!hit) return ["default"];
      const kind = (hit as HTMLElement).dataset?.cursor;
      if (kind === "explore")
        return ["explore", (hit as HTMLElement).dataset.cursorLabel];
      if (kind === "text") return ["text"];
      return ["link"];
    };

    const onOver = (e: PointerEvent) => {
      const [next, text] = resolveTarget(asElement(e.target));
      applyState(next, text);
    };

    const onDown = () => gsap.to(ring, { scale: "-=0.2", duration: 0.2 });
    const onUp = (e: PointerEvent) => {
      const [next, text] = resolveTarget(asElement(e.target));
      state = "default";
      applyState(next, text);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", resync, { passive: true });
    window.addEventListener("resize", resync, { passive: true });
    window.addEventListener("pixely:cursor-resync", resync);
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);

    return () => {
      delete root.dataset.cursor;
      root.style.removeProperty("--cursor-color");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", resync);
      window.removeEventListener("resize", resync);
      window.removeEventListener("pixely:cursor-resync", resync);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-(--z-cursor) transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        ref={dotRef}
        style={{
          width: CURSOR_DOT_PX,
          height: CURSOR_DOT_PX,
          top: -CURSOR_DOT_PX / 2,
          left: -CURSOR_DOT_PX / 2,
        }}
        className="absolute bg-(--cursor-color) transition-[background-color] duration-150 ease-(--ease-cross)"
      />
      <div
        ref={ringRef}
        className="absolute -top-[19px] -left-[19px] flex size-[38px] items-center justify-center rounded-full border border-(--cursor-color) transition-[border-color] duration-150 ease-(--ease-cross)"
      >
        <span
          ref={labelRef}
          className="type-label text-[8px] tracking-[0.2em] text-(--cursor-color) opacity-0"
        />
      </div>
    </div>
  );
}
