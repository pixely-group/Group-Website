"use client";

import { useEffect, useRef } from "react";
import CountUp from "@/components/ui/CountUp";
import { gsap } from "@/lib/gsap";

/* The deck publishes no figures, and a real company's site is not the place
   to invent them — this section carries the six core services instead, which
   is what the deck actually documents. The numbering counts up in their
   place. */
const SERVICES = [
  {
    index: 1,
    label: "Payments",
    note: "Real-time payments, transfers and merchant collections.",
  },
  {
    index: 2,
    label: "eWallets",
    note: "Secure digital wallets for individuals, businesses and institutions.",
  },
  {
    index: 3,
    label: "Identity",
    note: "Digital identity verification, eKYC and KYB, and authentication built for trust.",
  },
  {
    index: 4,
    label: "AI services",
    note: "Fraud detection, intelligent automation and AI-assisted decisioning.",
  },
  {
    index: 5,
    label: "Compliance",
    note: "Regulatory compliance, risk management and audit-ready reporting.",
  },
  {
    index: 6,
    label: "APIs and SDKs",
    note: "Developer-first APIs and SDKs for straightforward integration.",
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
        <h2 className="sr-only">Core services</h2>
        <p className="type-label section-index mb-12 text-(--muted)" aria-hidden>
          06 — Core services
        </p>
        <dl className="grid gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((m) => (
            <div
              key={m.label}
              data-metric
              className="border-t border-(--line) pt-6"
            >
              <dt className="type-display text-[clamp(2.8rem,6vw,5.4rem)] leading-[0.92] tracking-[-0.03em] whitespace-nowrap">
                <CountUp value={m.index} prefix="0" />
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
