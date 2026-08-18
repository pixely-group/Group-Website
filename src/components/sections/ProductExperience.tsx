"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { STAGES } from "@/lib/data";
import ProductUI from "@/components/sections/ProductUI";

/** Orange packets that travel between panels while a stage is active. */
const PULSES: Record<
  string,
  { from: string; to: string } | undefined
> = {
  payments: { from: "[data-ui='new-payment']", to: "[data-row='FX-EUR-0392']" },
  fx: { from: "[data-panel='fx']", to: "[data-row='FX-EUR-0392']" },
  controls: { from: "[data-panel='approvals']", to: "[data-row='RUN-2026-08']" },
};

function createPulseLayer(host: HTMLElement) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:5";
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#ff4d00");
  path.setAttribute("stroke-width", "1.25");
  path.setAttribute("stroke-dasharray", "3 4");
  path.setAttribute("opacity", "0");
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("r", "3.5");
  dot.setAttribute("fill", "#ff4d00");
  dot.setAttribute("opacity", "0");
  svg.append(path, dot);
  host.appendChild(svg);
  return { svg, path, dot };
}

/** Frame pose + per-panel depth for each narrative stage. */
const POSES = [
  { rotateX: 0, rotateY: 0, scale: 1, x: 0 },
  { rotateX: 13, rotateY: -9, scale: 0.93, x: -14 },
  { rotateX: 9, rotateY: 7, scale: 0.94, x: 8 },
  { rotateX: 5, rotateY: -4, scale: 0.965, x: 0 },
] as const;

const PANEL_Z: Record<string, readonly [number, number, number, number]> = {
  sidebar: [0, -70, -40, -50],
  topbar: [0, 30, 10, 0],
  balances: [0, 60, 20, 10],
  table: [0, 120, 40, 20],
  side: [0, 150, 70, 40],
  fx: [0, 0, 110, 0],
  approvals: [0, 0, 0, 120],
  events: [0, 0, 0, 50],
};

const ANNOTATIONS = [
  { stage: 0, label: "Ledger — source of truth", pos: "-top-9 left-0" },
  { stage: 1, label: "Router — fastest clearing rail", pos: "-top-9 right-0" },
  { stage: 2, label: "FX engine — 38 venues", pos: "-bottom-9 right-0" },
  { stage: 3, label: "Policy engine — n-of-m approvals", pos: "-bottom-9 left-0" },
];

const FRAME_WIDTH = 884;

export default function ProductExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);

  // Fit the fixed-width workspace into whatever column width the
  // viewport affords, compensating layout height for the scale.
  useEffect(() => {
    const scaler = scalerRef.current;
    const holder = scaler?.parentElement;
    if (!scaler || !holder) return;
    const frame = scaler.firstElementChild as HTMLElement | null;
    if (!frame) return;

    const fit = () => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        scaler.style.transform = "";
        scaler.style.height = "";
        return;
      }
      const scale = Math.min(1, holder.clientWidth / FRAME_WIDTH);
      scaler.style.transformOrigin = "left top";
      scaler.style.transform = `scale(${scale})`;
      scaler.style.height = `${frame.offsetHeight * scale}px`;
    };

    const ro = new ResizeObserver(fit);
    ro.observe(holder);
    ro.observe(frame);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const stageWrap = stageRef.current;
    if (!section || !pin || !stageWrap) return;

    const mm = gsap.matchMedia();

    mm.add(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      () => {
        const frame = stageWrap.querySelector("[data-product-frame]");
        const copies = section.querySelectorAll("[data-stage-copy]");
        const annos = section.querySelectorAll("[data-anno]");
        const dots = section.querySelectorAll("[data-progress-dot]");
        const fill = section.querySelector("[data-progress-fill]");
        if (!frame) return;

        const panels = Object.keys(PANEL_Z)
          .map((key) => ({
            key,
            el: stageWrap.querySelector(`[data-panel="${key}"]`),
          }))
          .filter((p): p is { key: string; el: Element } => !!p.el);

        gsap.set(copies, { opacity: 0, y: 28 });
        gsap.set(copies[0], { opacity: 1, y: 0 });
        gsap.set(annos, { opacity: 0, x: 0 });
        gsap.set(frame, { transformPerspective: 2200 });

        const pulseLayer = createPulseLayer(stageRef.current as HTMLElement);
        let pulseTween: gsap.core.Timeline | null = null;

        const playPulse = (key: string) => {
          pulseTween?.kill();
          const def = PULSES[key];
          const { path, dot } = pulseLayer;
          if (!def) {
            gsap.to([path, dot], { opacity: 0, duration: 0.3 });
            pulseTween = null;
            return;
          }
          const host = stageRef.current as HTMLElement;
          const measure = () => {
            const hostRect = host.getBoundingClientRect();
            const a = host.querySelector(def.from)?.getBoundingClientRect();
            const b = host.querySelector(def.to)?.getBoundingClientRect();
            if (!a || !b) return false;
            const ax = a.left + a.width / 2 - hostRect.left;
            const ay = a.top + a.height - hostRect.top;
            const bx = b.right - 14 - hostRect.left;
            const by = b.top + b.height / 2 - hostRect.top;
            path.setAttribute(
              "d",
              `M ${ax} ${ay} C ${ax} ${ay + 70}, ${bx + 60} ${by - 50}, ${bx} ${by}`,
            );
            return true;
          };
          if (!measure()) return;
          pulseTween = gsap
            .timeline({
              repeat: -1,
              repeatDelay: 0.7,
              onRepeat: () => measure(),
            })
            .set(dot, { opacity: 0 })
            .to(path, { opacity: 0.85, duration: 0.35 }, 0)
            .to(dot, { opacity: 1, duration: 0.15 }, 0.15)
            .to(
              dot,
              {
                motionPath: { path, alignOrigin: [0.5, 0.5], align: path },
                duration: 1.35,
                ease: "power2.inOut",
              },
              0.15,
            )
            .to(dot, { opacity: 0, duration: 0.2 }, "-=0.2");
        };

        let currentStage = -1;
        const applyStage = (i: number) => {
          if (i === currentStage) return;
          currentStage = i;
          stageWrap.setAttribute("data-stage", STAGES[i].key);
          dots.forEach((d, di) => d.classList.toggle("bg-signal", di <= i));
          // Let the camera move settle before measuring pulse endpoints.
          gsap.delayedCall(0.7, () => {
            if (currentStage === i) playPulse(STAGES[i].key);
          });
        };

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=340%",
            pin,
            scrub: 0.65,
            anticipatePin: 1,
            onUpdate: (self) => {
              applyStage(
                Math.min(STAGES.length - 1, Math.floor(self.progress * 4)),
              );
            },
          },
        });
        applyStage(0);

        if (fill) {
          tl.fromTo(
            fill,
            { scaleY: 0 },
            { scaleY: 1, duration: 4, ease: "none" },
            0,
          );
        }

        STAGES.forEach((_, i) => {
          const at = i; // window [i, i+1)

          if (i > 0) {
            tl.to(
              copies[i - 1],
              { opacity: 0, y: -24, duration: 0.22 },
              at - 0.05,
            ).to(copies[i], { opacity: 1, y: 0, duration: 0.28 }, at + 0.08);

            tl.to(
              frame,
              { ...POSES[i], duration: 0.55, ease: "power3.inOut" },
              at - 0.05,
            );
            panels.forEach(({ key, el }) => {
              tl.to(
                el,
                { z: PANEL_Z[key][i], duration: 0.55, ease: "power3.inOut" },
                at - 0.05,
              );
            });
          }

          const anno = annos[i];
          if (anno) {
            tl.fromTo(
              anno,
              { opacity: 0 },
              { opacity: 1, duration: 0.18 },
              at + 0.12,
            );
            tl.to(anno, { opacity: 0, duration: 0.15 }, at + 0.88);
          }
        });

        return () => {
          pulseTween?.kill();
          pulseLayer.svg.remove();
          stageWrap.removeAttribute("data-stage");
        };
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="product"
      data-theme="bone"
      className="relative bg-theme text-theme"
    >
      <div
        ref={pinRef}
        className="flex min-h-screen flex-col px-6 pt-24 pb-10 sm:px-10 lg:h-screen lg:px-14 lg:pb-8"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6 lg:mb-4">
          <div>
            <p className="type-label section-index mb-5 text-(--muted)">
              02 — The platform
            </p>
            <h2 className="type-headline text-big">
              One ledger.
              <br />
              Every movement.
            </h2>
          </div>
          <p className="max-w-xs pb-1 text-[0.92rem] leading-relaxed text-(--muted)">
            Accounts, payments, FX and controls in a single programmable
            system — visible to the cent, auditable to the event.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-10 lg:flex-row lg:items-center lg:gap-12">
          {/* — Stage copy rail (pinned mode) / stage list (stacked mode) */}
          <div className="relative flex shrink-0 gap-6 lg:w-[272px] lg:self-stretch">
            <div
              aria-hidden
              className="relative hidden w-px self-stretch bg-(--line) lg:block"
            >
              <span
                data-progress-fill
                className="absolute inset-x-0 top-0 h-full origin-top scale-y-0 bg-signal"
              />
              {STAGES.map((s, i) => (
                <span
                  key={s.key}
                  data-progress-dot
                  className="absolute -left-[3.5px] size-[7px] rounded-full bg-(--line-strong) transition-colors duration-500"
                  style={{ top: `${8 + i * 26}%` }}
                />
              ))}
            </div>

            <div className="relative flex-1 lg:self-center">
              {STAGES.map((stage, i) => (
                <div
                  key={stage.key}
                  data-stage-copy
                  className={`border-t border-(--line) pt-5 pb-8 lg:absolute lg:inset-x-0 lg:top-1/2 lg:-translate-y-1/2 lg:border-0 lg:p-0 ${
                    i === 0 ? "" : ""
                  }`}
                >
                  <p className="type-label mb-3 text-signal">
                    {stage.index} — {stage.title}
                  </p>
                  <h3 className="text-[1.35rem] leading-snug font-semibold tracking-[-0.01em]">
                    {stage.heading}
                  </h3>
                  <p className="mt-3 text-[0.92rem] leading-relaxed text-(--muted)">
                    {stage.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* — The workspace */}
          <div className="relative min-w-0 flex-1">
            <div
              ref={stageRef}
              className="relative"
              style={{ perspective: "2200px" }}
            >
              <div className="overflow-x-auto pb-2 lg:overflow-visible lg:pb-0">
                <div ref={scalerRef} className="w-fit">
                  <ProductUI />
                </div>
              </div>
              {ANNOTATIONS.map((a) => (
                <p
                  key={a.label}
                  data-anno
                  aria-hidden
                  className={`type-label absolute hidden w-max items-center gap-2 text-(--muted) opacity-0 lg:flex ${a.pos}`}
                >
                  <span className="inline-block size-1 rotate-45 bg-signal" />
                  {a.label}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
