"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { NetworkBus } from "@/components/three/NetworkScene";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";

const NetworkScene = dynamic(() => import("@/components/three/NetworkScene"), {
  ssr: false,
  loading: () => <NetworkPoster />,
});

const STAGES = [
  {
    index: "01",
    title: "Connect",
    heading: "Every rail resolves into one graph.",
    body: "Banks, card networks, instant rails and your own entities stop being integrations and become nodes — addressable, monitored, and reconciled against a single ledger.",
    meta: "142 currencies · 38 liquidity venues · 9 direct memberships",
  },
  {
    index: "02",
    title: "Move",
    heading: "Value takes the shortest path that clears.",
    body: "A payment is a route, not a request. Znapy prices every viable path — rail, correspondent, internal book — and commits to the one that settles first at the lowest total cost.",
    meta: "Median settlement 184 ms · 99.995% success · No batch windows",
  },
  {
    index: "03",
    title: "Control",
    heading: "Policy travels with the money.",
    body: "Limits, allowlists and n-of-m approvals are evaluated at the edge, before value leaves. Refused paths are refused in microseconds, and every decision is written to an immutable log.",
    meta: "Sub-ms evaluation · SOC 2 Type II · Immutable event log",
  },
  {
    index: "04",
    title: "Scale",
    heading: "The graph grows. The latency doesn't.",
    body: "New markets, entities and rails extend the same topology. Nothing is re-architected, nothing is migrated, and volume that would break a batch system is simply more edges.",
    meta: "$12.4B processed · 180+ markets · Linear cost curve",
  },
] as const;

/** Static fallback: reduced motion, no WebGL, or chunk still loading. */
function NetworkPoster() {
  const rings = [
    { r: 60, n: 22 },
    { r: 102, n: 34 },
    { r: 144, n: 48 },
    { r: 186, n: 62 },
    { r: 228, n: 78 },
  ];
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-ink">
      <svg
        className="absolute top-1/2 left-1/2 h-[min(120vh,900px)] w-[min(120vh,900px)] -translate-x-1/2 -translate-y-1/2"
        viewBox="-280 -280 560 560"
        fill="none"
      >
        {rings.map((ring) => (
          <g key={ring.r}>
            <circle
              r={ring.r}
              stroke="#ece9e1"
              strokeOpacity="0.09"
              strokeWidth="0.75"
            />
            {Array.from({ length: ring.n }, (_, i) => {
              const a = (i / ring.n) * Math.PI * 2;
              // Math.sin/cos are not bit-identical across engines, so the
              // server and the browser disagreed in the last decimal and
              // every hydration logged a mismatch. Round so both agree.
              const round = (n: number) => Math.round(n * 1000) / 1000;
              return (
                <circle
                  key={i}
                  cx={round(Math.cos(a) * ring.r)}
                  cy={round(Math.sin(a) * ring.r)}
                  r={1.5}
                  fill="#ece9e1"
                  fillOpacity={0.5}
                />
              );
            })}
          </g>
        ))}
        <circle r="26" stroke="#ece9e1" strokeOpacity="0.5" strokeWidth="1" />
        <line
          x1="0"
          y1="-280"
          x2="0"
          y2="280"
          stroke="#ece9e1"
          strokeOpacity="0.08"
        />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_30%,#0a0a0b_100%)]" />
    </div>
  );
}

export default function NetworkNarrative() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const bus = useRef<NetworkBus>({ progress: 0, pointer: [0, 0], spread: 0 });
  const [active, setActive] = useState(false);
  // The canvas allocates a WebGL context as soon as it mounts, and this
  // section sits several viewports down, so hold off until it is approached.
  const [near, setNear] = useState(false);
  const reduced = useReducedMotion();

  // Wide viewports alternate the copy column, so the graph swings aside.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      bus.current.spread = mql.matches ? 1 : 0;
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      bus.current.pointer = [
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      ];
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  // Mount roughly a viewport early, then keep it: tearing the context down
  // and rebuilding it on every pass would cost more than it saves. An
  // observer reads live layout, so unlike a ScrollTrigger it is unaffected by
  // refreshes that run before the pinned spacers have settled.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          bus.current.progress = self.progress;
        },
      });
      // Only render while the section can be seen.
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => setActive(self.isActive),
      });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const copies = sticky.querySelectorAll("[data-stage-copy]");
        const marks = sticky.querySelectorAll("[data-stage-mark]");
        if (copies.length === 0) return;

        gsap.set(copies, { opacity: 0, y: 34 });
        gsap.set(copies[0], { opacity: 1, y: 0 });
        marks[0]?.classList.add("bg-accent");

        // Timeline units == stage units: stage i is centred at time i.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
          },
        });

        STAGES.forEach((_, i) => {
          if (i === 0) return;
          tl.to(
            copies[i - 1],
            { opacity: 0, y: -34, duration: 0.3, ease: "power2.in" },
            i - 0.4,
          ).to(
            copies[i],
            { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
            i - 0.15,
          );
        });

        // Rail marks track the nearest stage.
        const st = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const i = Math.max(
              0,
              Math.min(STAGES.length - 1, Math.round(self.progress * 4)),
            );
            marks.forEach((m, mi) => m.classList.toggle("bg-accent", mi === i));
          },
        });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
          st.kill();
          // See ProductExperience: killed tweens are no longer revertible.
          gsap.set(copies, { clearProps: "all" });
          marks.forEach((m) => m.classList.remove("bg-accent"));
        };
      });
      return () => mm.revert();
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="network"
      data-theme="ink"
      aria-label="How the Znapy network works"
      className="relative bg-theme text-theme"
      style={{ height: reduced ? undefined : "500svh" }}
    >
      <div
        ref={stickyRef}
        className={
          reduced
            ? "relative overflow-hidden py-24"
            : "sticky top-0 h-[100svh] overflow-hidden"
        }
      >
        {reduced || !near ? (
          <div className="absolute inset-0">
            <NetworkPoster />
          </div>
        ) : (
          <NetworkScene bus={bus} active={active} />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_85%_at_50%_50%,transparent_38%,rgba(10,10,11,0.55)_100%)]"
        />

        <p className="type-label section-index absolute top-24 left-6 z-20 text-(--muted) sm:left-10 lg:left-14">
          03 — The network
        </p>

        {/* Reduced motion: the four stages simply stack and stay put. */}
        {reduced ? (
          <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 pt-20 sm:px-10 md:grid-cols-2 lg:px-14">
            {STAGES.map((stage) => (
              <div key={stage.title} className="max-w-lg">
                <p className="type-label mb-4 text-accent">
                  {stage.index} — {stage.title}
                </p>
                <h3 className="type-headline text-mid">{stage.heading}</h3>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-(--muted)">
                  {stage.body}
                </p>
                <p className="type-label mt-5 border-t border-(--line) pt-4 leading-relaxed text-(--faint)">
                  {stage.meta}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="absolute inset-0 z-10 flex items-center px-6 sm:px-10 lg:px-14">
              <div className="relative w-full">
                {STAGES.map((stage, i) => (
                  <div
                    key={stage.title}
                    data-stage-copy
                    className={`absolute top-1/2 w-full max-w-lg -translate-y-1/2 ${
                      i % 2 === 1
                        ? "lg:right-0 lg:left-auto lg:text-right"
                        : "left-0"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 bg-[radial-gradient(58%_58%_at_50%_50%,rgba(10,10,11,0.94)_0%,rgba(10,10,11,0.72)_45%,transparent_78%)]"
                    />
                    <p className="type-label mb-5 text-accent">
                      {stage.index} — {stage.title}
                    </p>
                    <h3 className="type-headline text-mid text-balance">
                      {stage.heading}
                    </h3>
                    <p className="mt-5 text-[0.95rem] leading-relaxed text-(--muted)">
                      {stage.body}
                    </p>
                    <p className="type-label mt-7 border-t border-(--line) pt-4 leading-relaxed text-(--faint)">
                      {stage.meta}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage rail */}
            <div
              aria-hidden
              className="absolute bottom-10 left-6 z-20 flex items-center gap-3 sm:left-10 lg:left-14"
            >
              {STAGES.map((stage) => (
                <span key={stage.title} className="flex items-center gap-2">
                  <span
                    data-stage-mark
                    className="block h-px w-8 bg-(--line-strong) transition-colors duration-500"
                  />
                  <span className="type-label text-[9px] text-(--faint)">
                    {stage.index}
                  </span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
