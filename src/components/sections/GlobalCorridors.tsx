"use client";

import { useEffect, useRef } from "react";
import { CENTRES, CORRIDORS } from "@/lib/corridors";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";

const BONE = "236, 233, 225";
const SIGNAL = "159, 180, 255";

/** Longitude/latitude → normalised canvas space, latitude band compressed. */
const px = (lon: number, w: number) => ((lon + 180) / 360) * w;
const py = (lat: number, h: number) => ((60 - lat) / 105) * h;

/**
 * Abstract corridor map: financial centres placed on their true longitudes,
 * with value moving between them and daylight sweeping west to east.
 */
export default function GlobalCorridors() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    // Canvas cannot resolve CSS custom properties in ctx.font, so take the
    // family the element actually computes to.
    let monoFamily = "ui-monospace, monospace";
    let raf = 0;
    let running = false;
    let t = reduced ? 6 : 0;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const resolved = getComputedStyle(canvas).fontFamily;
      if (resolved) monoFamily = resolved;
    };

    const arcFor = (a: (typeof CENTRES)[number], b: (typeof CENTRES)[number]) => {
      const x1 = px(a.lon, width);
      const y1 = py(a.lat, height);
      const x2 = px(b.lon, width);
      const y2 = py(b.lat, height);
      const mx = (x1 + x2) / 2;
      // Lift the arc proportionally to the span, always toward the top.
      const my = (y1 + y2) / 2 - Math.min(Math.abs(x2 - x1) * 0.34, height * 0.42);
      return { x1, y1, x2, y2, mx, my };
    };

    const quadAt = (
      p: ReturnType<typeof arcFor>,
      s: number,
    ): [number, number] => {
      const inv = 1 - s;
      return [
        inv * inv * p.x1 + 2 * inv * s * p.mx + s * s * p.x2,
        inv * inv * p.y1 + 2 * inv * s * p.my + s * s * p.y2,
      ];
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Daylight band sweeping east: settlement follows the sun.
      const sun = ((t * 0.045) % 1) * width;
      const band = ctx.createLinearGradient(sun - width * 0.42, 0, sun + width * 0.42, 0);
      band.addColorStop(0, `rgba(${BONE}, 0)`);
      band.addColorStop(0.5, `rgba(${BONE}, 0.05)`);
      band.addColorStop(1, `rgba(${BONE}, 0)`);
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, width, height);

      // Longitude grid, every 30°.
      ctx.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = px(lon, width);
        ctx.strokeStyle = `rgba(${BONE}, ${lon === 0 ? 0.2 : 0.07})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let lat = 40; lat >= -20; lat -= 30) {
        const y = py(lat, height);
        ctx.strokeStyle = `rgba(${BONE}, 0.055)`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Corridors.
      CORRIDORS.forEach((c) => {
        const a = CENTRES[c.from];
        const b = CENTRES[c.to];
        const p = arcFor(a, b);

        ctx.strokeStyle = `rgba(${BONE}, 0.14)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.quadraticCurveTo(p.mx, p.my, p.x2, p.y2);
        ctx.stroke();

        // Packet with a short comet tail.
        const s = ((t / c.period + c.offset) % 1 + 1) % 1;
        const tail = 0.12;
        ctx.lineWidth = 1.6;
        for (let k = 0; k < 6; k += 1) {
          const s0 = s - (tail * k) / 6;
          const s1 = s - (tail * (k + 1)) / 6;
          if (s1 < 0) break;
          const [ax, ay] = quadAt(p, s0);
          const [bx, by] = quadAt(p, s1);
          ctx.strokeStyle = `rgba(${SIGNAL}, ${0.75 * (1 - k / 6)})`;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
        const [hx, hy] = quadAt(p, s);
        ctx.fillStyle = `rgba(${SIGNAL}, 0.95)`;
        ctx.beginPath();
        ctx.arc(hx, hy, 2.1, 0, Math.PI * 2);
        ctx.fill();
      });

      // Centres.
      CENTRES.forEach((c, i) => {
        const x = px(c.lon, width);
        const y = py(c.lat, height);
        // Local daylight makes a hub glow as the sun passes it.
        const d = Math.abs(((x - sun + width * 1.5) % width) - width * 0.5);
        const lit = Math.max(0, 1 - d / (width * 0.22));

        ctx.strokeStyle = `rgba(${BONE}, ${0.25 + lit * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 4.5 + lit * 2.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(${BONE}, ${0.55 + lit * 0.45})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fill();

        // Tick down to the axis, patent-drawing style.
        ctx.strokeStyle = `rgba(${BONE}, 0.1)`;
        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        ctx.lineTo(x, height - 22);
        ctx.stroke();

        ctx.fillStyle = `rgba(${BONE}, ${0.34 + lit * 0.45})`;
        ctx.font = `400 10px ${monoFamily}`;
        ctx.textAlign = i % 2 === 0 ? "left" : "right";
        ctx.fillText(c.code, x + (i % 2 === 0 ? 8 : -8), y - 9);
      });
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      t += dt;
      draw();
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    draw();

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? start() : stop()),
    });

    const onVisibility = () => (document.hidden ? stop() : trigger.isActive && start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      ro.disconnect();
      trigger.kill();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const c = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(section.querySelectorAll("[data-corridor-stat]"), {
          opacity: 0,
          y: 22,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 62%" },
        });
      });
      return () => mm.revert();
    }, section);
    return () => c.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="global"
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 py-[15vh] text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="type-label section-index mb-6 text-(--muted)">
              05 — Global
            </p>
            <h2 className="type-headline text-big max-w-[14ch] text-balance">
              Settlement follows the sun.
            </h2>
          </div>
          <p className="max-w-sm pb-2 text-[0.95rem] leading-relaxed text-(--muted)">
            Money does not wait for a business day to begin. Pixely holds
            liquidity on both sides of every corridor, so a payment clears in
            the recipient&rsquo;s morning, not yours.
          </p>
        </div>

        <div className="relative mt-14">
          <canvas
            ref={canvasRef}
            className="block h-[clamp(260px,42vw,460px)] w-full font-mono"
            role="img"
            aria-label="Corridor map: twelve financial centres on their longitudes, with value moving continuously between them"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-(--line)"
          />
          <div
            aria-hidden
            className="type-label mt-3 flex justify-between text-[9px] text-(--faint)"
          >
            <span>180°W</span>
            <span>90°W</span>
            <span>0° — Greenwich</span>
            <span>90°E</span>
            <span>180°E</span>
          </div>
        </div>

        <dl className="mt-14 grid gap-px border-t border-(--line) sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["24/7/365", "Corridors never close"],
            ["T+0", "Settlement on every major rail"],
            ["12", "Liquidity hubs, self-funded"],
            ["180+", "Markets reachable"],
          ].map(([value, label]) => (
            <div key={label} data-corridor-stat className="pt-6">
              <dt className="type-mono text-[2rem] leading-none font-medium tracking-[-0.02em]">
                {value}
              </dt>
              <dd className="type-label mt-3 text-(--muted)">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
