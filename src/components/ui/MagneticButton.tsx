"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

type Props = {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
};

/**
 * Primary interactive element: magnetic pull toward the pointer,
 * stacked-label swap on hover, near-sharp editorial geometry.
 */
export default function MagneticButton({
  href,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  children,
}: Props) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const quick = useRef<{
    x: gsap.QuickToFunc;
    y: gsap.QuickToFunc;
  } | null>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const magnetic = fine && !reduced;

  const setRef = useCallback((el: HTMLAnchorElement | HTMLButtonElement | null) => {
    ref.current = el;
    quick.current = el
      ? {
          x: gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" }),
        }
      : null;
  }, []);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!magnetic || !ref.current || !quick.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    quick.current.x(dx * 0.28);
    quick.current.y(dy * 0.34);
  };

  const onPointerLeave = () => {
    if (!magnetic || !ref.current) return;
    gsap.to(ref.current, {
      x: 0,
      y: 0,
      duration: 0.9,
      ease: "elastic.out(1, 0.45)",
    });
  };

  const base =
    "group relative isolate inline-flex items-center justify-center overflow-hidden rounded-[2px] font-mono uppercase tracking-[0.14em] transition-colors duration-500 select-none";
  const sizing =
    size === "lg"
      ? "px-9 py-[1.15rem] text-[0.8rem]"
      : size === "sm"
        ? "px-5 py-[0.62rem] text-[0.65rem]"
        : "px-6 py-[0.85rem] text-[0.7rem]";
  const skin =
    variant === "solid"
      ? "bg-signal text-bone transition-colors duration-500 ease-(--ease-out-expo) group-hover:text-ink"
      : "border border-(--line-strong) text-(--fg) hover:bg-(--surface)";

  const inner = (
    <>
      {variant === "solid" && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 translate-y-[102%] bg-bone transition-transform duration-500 ease-(--ease-out-expo) group-hover:translate-y-0"
        />
      )}
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-(--ease-out-expo) group-hover:-translate-y-[110%]">
          {children}
        </span>
        <span
          aria-hidden
          className="absolute inset-0 block translate-y-[110%] transition-transform duration-500 ease-(--ease-out-expo) group-hover:translate-y-0"
        >
          {children}
        </span>
      </span>
    </>
  );

  const shared = {
    className: `${base} ${sizing} ${skin} ${className}`,
    onPointerMove,
    onPointerLeave,
    "data-cursor": "link",
    // The solid variant wipes a bone panel over the orange on hover, so
    // inside a dark chapter it becomes a light surface. The cursor only ever
    // resolves against this button while it is hovered — which is exactly
    // when that panel is covering it — so it can be declared light outright.
    ...(variant === "solid" ? { "data-cursor-theme": "bone" } : null),
  };

  return href ? (
    <a
      {...shared}
      href={href}
      onClick={onClick}
      ref={setRef as (el: HTMLAnchorElement | null) => void}
    >
      {inner}
    </a>
  ) : (
    <button
      {...shared}
      onClick={onClick}
      type="button"
      ref={setRef as (el: HTMLButtonElement | null) => void}
    >
      {inner}
    </button>
  );
}
