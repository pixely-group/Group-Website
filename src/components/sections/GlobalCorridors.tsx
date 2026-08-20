"use client";

import { useEffect, useRef } from "react";
import { CENTRES, CORRIDORS } from "@/lib/corridors";
import { WORLD } from "@/lib/worldmap";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";

const BONE = "236, 233, 225";
const SIGNAL = "159, 180, 255";

/** The meridian the map is cut and centred on — Algiers, not Greenwich. */
const CENTRE_LON = 3.06;

/**
 * Longitude/latitude → canvas space. The +540 before the modulo is what puts
 * Algiers in the middle: it re-bases longitude on the capital and keeps the
 * result positive for the whole western hemisphere, which a plain (lon - 3.06)
 * would push negative and off the left edge.
 */
const px = (lon: number, w: number) =>
  (((lon - CENTRE_LON + 540) % 360) / 360) * w;

/**
 * The latitude band, 80N to 58S. It has to reach 55S or the bottom of South
 * America is cut off — Tierra del Fuego sits at -55.2 — and it is shifted
 * north so Algeria still sits above the middle of the frame rather than in it.
 */
const LAT_TOP = 80;
const LAT_SPAN = 138;
const py = (lat: number, h: number) => ((LAT_TOP - lat) / LAT_SPAN) * h;

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
    let land: HTMLCanvasElement | null = null;
    /** Index of the centre under the pointer, or -1. */
    let hovered = -1;

    /* Ray casting. The rings are stored open and treated as closed, which is
       what the (n - 1) start index does. */
    const inRing = (lon: number, lat: number, ring: (typeof WORLD)[number]) => {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (
          yi > lat !== yj > lat &&
          lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
        )
          inside = !inside;
      }
      return inside;
    };

    /**
     * The land as a field of dots rather than an outline. Outlines at this
     * scale read as a diagram; a dot field reads as a map, and it matches how
     * everything else on the page is drawn.
     *
     * Built once per resize into its own canvas and blitted each frame — the
     * land does not move, and testing eleven thousand grid points against
     * twelve rings is not work to repeat sixty times a second.
     */
    const buildLand = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const c = document.createElement("canvas");
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      const lc = c.getContext("2d");
      if (!lc) return null;
      lc.setTransform(dpr, 0, 0, dpr, 0, 0);

      /* Both axes are linear in this projection, so a constant step in
         degrees is a constant step in pixels — no cosine correction. */
      const stepLon = (360 / width) * 6.4;
      const stepLat = (LAT_SPAN / height) * 6.4;

      for (let lat = LAT_TOP; lat > LAT_TOP - LAT_SPAN; lat -= stepLat) {
        for (let lon = -180; lon < 180; lon += stepLon) {
          let hit = false;
          for (const ring of WORLD) {
            if (inRing(lon, lat, ring)) {
              hit = true;
              break;
            }
          }
          if (!hit) continue;
          const x = px(lon, width);
          const y = py(lat, height);
          /* A little variation per dot, from position alone, so the field is
             not a perfect lattice. */
          const n = (Math.sin(lon * 12.9898 + lat * 78.233) * 43758.5453) % 1;
          const a = 0.16 + Math.abs(n) * 0.16;
          lc.fillStyle = `rgba(${BONE}, ${a.toFixed(3)})`;
          lc.beginPath();
          lc.arc(x, y, 1.05, 0, Math.PI * 2);
          lc.fill();
        }
      }
      return c;
    };

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
      land = buildLand();
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

    /* Hit-testing happens against the same projection the drawing uses, so
       the target is wherever the node actually is rather than a guess at it. */
    const pick = (cx: number, cy: number) => {
      let best = -1;
      let bestD = 22;
      CENTRES.forEach((c, i) => {
        const d = Math.hypot(px(c.lon, width) - cx, py(c.lat, height) - cy);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const next = pick(e.clientX - r.left, e.clientY - r.top);
      if (next === hovered) return;
      hovered = next;
      /* Tells the custom cursor there is something here, which is the only
         affordance a canvas can offer — it has no elements to hover. */
      if (next >= 0) canvas.dataset.cursor = "link";
      else delete canvas.dataset.cursor;
    };
    const onLeave = () => {
      hovered = -1;
      delete canvas.dataset.cursor;
    };
    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerleave", onLeave, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      /* Where the sun is. It used to be painted as a wash across the whole
         canvas, which filled the rectangle edge to edge and was the lighter
         panel the map sat on rather than the page showing through. The sweep
         itself stays — it still lights each hub as it passes, below — but
         nothing fills the canvas now, so the only thing drawn is the map. */
      const sun = ((t * 0.045) % 1) * width;

      /* The land, under everything else. Pre-rendered, so this is one
         blit rather than eleven thousand point-in-polygon tests. */
      if (land) ctx.drawImage(land, 0, 0, width, height);

      // Longitude grid, every 30°.
      ctx.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = px(lon, width);
        ctx.strokeStyle = `rgba(${BONE}, 0.07)`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      /* The centre meridian, drawn on its own: it falls on Algiers rather than
         on a multiple of thirty, so the loop above never lands on it. */
      ctx.strokeStyle = `rgba(${SIGNAL}, 0.22)`;
      ctx.beginPath();
      ctx.moveTo(px(CENTRE_LON, width), 0);
      ctx.lineTo(px(CENTRE_LON, width), height);
      ctx.stroke();
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
        const onHover = hovered >= 0 && (c.from === hovered || c.to === hovered);
        const a = CENTRES[c.from];
        const b = CENTRES[c.to];
        const p = arcFor(a, b);

        ctx.strokeStyle = onHover
          ? `rgba(${SIGNAL}, 0.5)`
          : `rgba(${BONE}, ${hovered >= 0 ? 0.07 : 0.14})`;
        ctx.lineWidth = onHover ? 1.4 : 1;
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

        const home = "home" in c && c.home;
        const ink = home ? SIGNAL : BONE;

        /* The home node carries a second, slowly breathing ring, so the eye
           finds the country the map is drawn around before it reads any of
           the traffic. */
        if (home) {
          const breath = 0.5 + 0.5 * Math.sin(t * 1.6);
          ctx.strokeStyle = `rgba(${SIGNAL}, ${0.34 - breath * 0.22})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 9 + breath * 9, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.strokeStyle = `rgba(${ink}, ${(home ? 0.6 : 0.25) + lit * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, (home ? 6.5 : 4.5) + lit * 2.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(${ink}, ${(home ? 0.9 : 0.55) + lit * 0.45})`;
        ctx.beginPath();
        ctx.arc(x, y, home ? 2.6 : 1.9, 0, Math.PI * 2);
        ctx.fill();

        // Tick down to the axis, patent-drawing style.
        ctx.strokeStyle = `rgba(${BONE}, 0.1)`;
        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        ctx.lineTo(x, height - 22);
        ctx.stroke();

        const on = i === hovered;
        if (on) {
          /* A halo, then the full name instead of the three-letter code —
             the label only has room to be useful one node at a time. */
          ctx.strokeStyle = `rgba(${SIGNAL}, 0.55)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 13, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(${SIGNAL}, 0.16)`;
          ctx.beginPath();
          ctx.arc(x, y, 13, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = on
          ? `rgba(${SIGNAL}, 1)`
          : `rgba(${ink}, ${(home ? 0.85 : 0.34) + lit * 0.45})`;
        ctx.font = `400 ${on ? 11 : 10}px ${monoFamily}`;
        ctx.textAlign = i % 2 === 0 ? "left" : "right";
        ctx.fillText(
          on ? c.name.toUpperCase() : c.code,
          x + (i % 2 === 0 ? 8 : -8),
          y - (on ? 17 : 9),
        );
      });

      /* Feathered edges. The graticule, the daylight band and the land all
         stop dead on the canvas rectangle, and four hard edges around a map
         is a frame. Erasing the border with a gradient lets it sit on the
         page rather than in a box. */
      ctx.globalCompositeOperation = "destination-out";
      const fadeX = Math.min(120, width * 0.12);
      const fadeY = Math.min(70, height * 0.14);
      const wipe = (
        x0: number, y0: number, x1: number, y1: number,
        w: number, h: number,
      ) => {
        const grd = ctx.createLinearGradient(x0, y0, x1, y1);
        grd.addColorStop(0, "rgba(0,0,0,1)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h);
      };
      wipe(0, 0, fadeX, 0, fadeX, height);
      wipe(width, 0, width - fadeX, 0, fadeX, height);
      wipe(0, 0, 0, fadeY, width, fadeY);
      wipe(0, height, 0, height - fadeY, width, fadeY);
      ctx.globalCompositeOperation = "source-over";
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
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      delete canvas.dataset.cursor;
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
              Algeria, on every corridor.
            </h2>
          </div>
          <p className="max-w-sm pb-2 text-[0.95rem] leading-relaxed text-(--muted)">
            Pixely is built for Algeria and connects it outward. Every corridor
            on this map runs to Algiers, so value moves between it and the
            markets Algerian businesses actually trade with.
          </p>
        </div>

        <div className="relative mt-14">
          <canvas
            ref={canvasRef}
            className="block h-[clamp(300px,48vw,540px)] w-full font-mono"
            role="img"
            aria-label="Corridor map centred on Algiers, with value moving continuously between it and twelve financial centres"
          />
          <div
            aria-hidden
            className="type-label mt-3 flex justify-between text-[9px] text-(--faint)"
          >
            <span>177°W</span>
            <span>87°W</span>
            <span>3°E — Algiers</span>
            <span>93°E</span>
            <span>177°E</span>
          </div>
        </div>

        <dl className="mt-14 grid gap-px border-t border-(--line) sm:grid-cols-2 lg:grid-cols-4">
          {/* The deck publishes no figures and this is a real company, so
              these say what the platform does rather than counting things
              that have not been counted. */}
          {[
            ["Payments", "Real time, not overnight"],
            ["Identity", "Proved once, trusted after"],
            ["Compliance", "Regulatory-ready by construction"],
            ["Algeria", "Where it is being built"],
          ].map(([value, label]) => (
            <div key={label} data-corridor-stat className="pt-6">
              <dt className="type-headline text-[1.5rem] leading-none font-medium tracking-[-0.02em]">
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
