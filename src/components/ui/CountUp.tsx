"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type Props = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

const format = (n: number, decimals: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * Counts to `value` when scrolled into view. The final string is rendered on
 * the server and for reduced motion, so the number is never missing.
 */
export default function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const counter = { n: 0 };
    const ctx = gsap.context(() => {
      gsap.to(counter, {
        n: value,
        duration: 2.1,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onStart: () => {
          el.textContent = `${prefix}${format(0, decimals)}${suffix}`;
        },
        onUpdate: () => {
          el.textContent = `${prefix}${format(counter.n, decimals)}${suffix}`;
        },
        onComplete: () => {
          el.textContent = `${prefix}${format(value, decimals)}${suffix}`;
        },
      });
    }, el);

    return () => {
      ctx.revert();
      el.textContent = `${prefix}${format(value, decimals)}${suffix}`;
    };
  }, [value, decimals, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {`${prefix}${format(value, decimals)}${suffix}`}
    </span>
  );
}
