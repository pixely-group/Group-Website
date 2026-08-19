"use client";

import { useEffect, useRef } from "react";
import CountUp from "@/components/ui/CountUp";
import { gsap } from "@/lib/gsap";

const METRICS = [
  {
    value: 12.4,
    decimals: 1,
    prefix: "$",
    suffix: "B",
    label: "Processed in 2025",
    note: "Across 1.9M counterparties",
  },
  {
    value: 184,
    suffix: "ms",
    label: "Median settlement",
    note: "Initiation to confirmed receipt",
  },
  {
    value: 99.995,
    decimals: 3,
    suffix: "%",
    label: "Platform uptime",
    note: "Rolling twelve months",
  },
  {
    value: 142,
    label: "Currencies held",
    note: "40 with local accounts",
  },
] as const;

export default function Metrics() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(section.querySelectorAll("[data-metric]"), {
          opacity: 0,
          y: 40,
          duration: 1.1,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: section, start: "top 70%" },
        });
      });
      return () => mm.revert();
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="metrics"
      data-theme="ink"
      className="relative bg-theme px-6 pt-[6vh] pb-[16vh] text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="sr-only">Znapy by the numbers</h2>
        <p className="type-label section-index mb-12 text-(--muted)" aria-hidden>
          06 — By the numbers
        </p>
        <dl className="grid gap-x-12 gap-y-16 sm:grid-cols-2">
          {METRICS.map((m) => (
            <div
              key={m.label}
              data-metric
              className="border-t border-(--line) pt-6"
            >
              <dt className="type-display text-[clamp(2.8rem,6vw,5.4rem)] leading-[0.92] tracking-[-0.03em] whitespace-nowrap">
                <CountUp
                  value={m.value}
                  decimals={"decimals" in m ? m.decimals : 0}
                  prefix={"prefix" in m ? m.prefix : ""}
                  suffix={"suffix" in m ? m.suffix : ""}
                />
              </dt>
              <dd className="mt-5">
                <span className="block text-[0.95rem] font-medium">
                  {m.label}
                </span>
                <span className="type-label mt-2 block text-(--faint)">
                  {m.note}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
