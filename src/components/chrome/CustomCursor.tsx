"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

type CursorState = "default" | "link" | "explore" | "text";

/**
 * Desktop-only cursor: a tight dot and a lagging ring in difference blend
 * so it self-adapts across ink and bone chapters. States are driven by
 * `data-cursor` attributes (or native anchors/buttons) via event delegation.
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

    document.documentElement.dataset.cursor = "on";

    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    let state: CursorState = "default";

    const applyState = (next: CursorState, labelText?: string) => {
      if (next === state && next !== "explore") return;
      state = next;
      const scales: Record<CursorState, { ring: number; dot: number }> = {
        default: { ring: 1, dot: 1 },
        link: { ring: 1.55, dot: 0.4 },
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

    const onMove = (e: PointerEvent) => {
      setVisible(true);
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const resolveTarget = (el: Element | null): [CursorState, string?] => {
      const hit = el?.closest("[data-cursor], a, button, [role='button']");
      if (!hit) return ["default"];
      const kind = (hit as HTMLElement).dataset?.cursor;
      if (kind === "explore")
        return ["explore", (hit as HTMLElement).dataset.cursorLabel];
      if (kind === "text") return ["text"];
      return ["link"];
    };

    const onOver = (e: PointerEvent) => {
      const [next, text] = resolveTarget(e.target as Element);
      applyState(next, text);
    };

    const onDown = () => gsap.to(ring, { scale: "-=0.2", duration: 0.2 });
    const onUp = (e: PointerEvent) => {
      const [next, text] = resolveTarget(e.target as Element);
      state = "default";
      applyState(next, text);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);

    return () => {
      delete document.documentElement.dataset.cursor;
      window.removeEventListener("pointermove", onMove);
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
        className="absolute -top-[3px] -left-[3px] size-1.5 rounded-full bg-bone mix-blend-difference"
      />
      <div
        ref={ringRef}
        className="absolute -top-[19px] -left-[19px] flex size-[38px] items-center justify-center rounded-full border border-bone/70 mix-blend-difference"
      >
        <span
          ref={labelRef}
          className="type-label text-[8px] tracking-[0.2em] text-bone opacity-0"
        />
      </div>
    </div>
  );
}
