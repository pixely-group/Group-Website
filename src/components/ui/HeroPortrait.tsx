"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

/** Original pixels stay sharp. Depth, light and instruments are separate layers. */
export default function HeroPortrait() {
  const host = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let frame = 0;
    let visible = true;
    let x = 0, y = 0, tx = 0, ty = 0;
    const reset = () => {
      node.style.setProperty("--depth-x", "0");
      node.style.setProperty("--depth-y", "0");
      node.style.setProperty("--light-x", "65%");
      node.style.setProperty("--light-y", "42%");
    };
    reset();
    if (reduced || paused || !fine) return;
    const render = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      x += (tx - x) * 0.065;
      y += (ty - y) * 0.065;
      node.style.setProperty("--depth-x", x.toFixed(4));
      node.style.setProperty("--depth-y", y.toFixed(4));
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.001) frame = requestAnimationFrame(render);
    };
    const queue = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render); };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const box = node.getBoundingClientRect();
      const nx = (event.clientX - box.left) / box.width;
      const ny = (event.clientY - box.top) / box.height;
      node.dataset.hover = String(nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1);
      tx = Math.max(-1, Math.min(1, nx * 2 - 1));
      ty = Math.max(-1, Math.min(1, ny * 2 - 1));
      node.style.setProperty("--light-x", `${Math.max(0,Math.min(1,nx))*100}%`);
      node.style.setProperty("--light-y", `${Math.max(0,Math.min(1,ny))*100}%`);
      queue();
    };
    const leave = () => { tx = 0; ty = 0; node.dataset.hover = "false"; queue(); };
    const visibility = () => {
      node.dataset.active = String(visible && !document.hidden);
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else queue();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visibility(); });
    observer.observe(node);
    window.addEventListener("pointermove", move, {passive:true});
    document.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      node.dataset.hover = "false";
      reset();
    };
  }, [fine, reduced, paused]);

  const scan = () => {
    if (scanning) return;
    setScanning(true);
    timer.current = setTimeout(() => setScanning(false), reduced || paused ? 900 : 3400);
  };

  return (
    <div ref={host} className="identity-visual relative h-full w-full"
      data-scanning={scanning} data-paused={paused || reduced} data-active="true">
      <div className="identity-art" aria-hidden="true">
        <Image src="/images/hero-identity.jpeg" alt="" fill preload quality={90}
          sizes="(min-width: 1024px) and (orientation: landscape) max(55vw, 157.75svh, 1010px), max(100vw, clamp(466px, 64.5svh, 681px))"
          className="object-cover object-[70%_center]" />
      </div>
      <div className="identity-instruments" aria-hidden="true">
        <div className="identity-orbit identity-orbit-outer" />
        <div className="identity-orbit identity-orbit-inner" />
        <div className="identity-orbit-tick" />
        <svg className="identity-reticle" viewBox="0 0 400 480" fill="none">
          <path d="M48 1H1V48M352 1H399V48M1 432V479H48M352 479H399V432" />
          <path className="identity-grid" d="M100 0V480M200 0V480M300 0V480M0 120H400M0 240H400M0 360H400" />
          <path className="identity-constellation" d="M112 142L200 100L286 144L274 244L200 339L120 246Z M112 142L200 230L286 144M120 246L200 230L274 244M200 100V339" />
          {[[112,142],[200,100],[286,144],[274,244],[200,339],[120,246],[200,230]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />)}
        </svg>
        <div className="identity-sweep" />
        <div className="identity-wave" />
        <div className="identity-light" />
        <span className="identity-coordinate identity-coordinate-top">01 / IDENTITY FIELD</span>
        <span className="identity-coordinate identity-coordinate-bottom">ALGÉRIE · MENA</span>
      </div>
      <div className="identity-fade" aria-hidden="true" />
      <div className="identity-controls">
        <button type="button" onClick={scan} disabled={scanning} className="identity-trigger"
          data-cursor="explore" data-cursor-label="SCAN" aria-label="Play an illustrative identity scan animation">
          <span className="identity-trigger-icon" aria-hidden="true">↗</span>
          <span>{scanning ? "Exploring the signal" : fine ? "Click to explore" : "Tap to explore"}</span>
          <span className="identity-trigger-line" aria-hidden="true" />
        </button>
        {!reduced && <button type="button" onClick={() => setPaused(!paused)} className="identity-pause"
          aria-label={paused ? "Resume visual motion" : "Pause visual motion"} aria-pressed={paused}>
          {paused ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3L12 8L5 13Z" fill="currentColor" /></svg> : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3V13M11 3V13" stroke="currentColor" strokeWidth="2" /></svg>}
        </button>}
      </div>
      <span className="sr-only" role="status">{scanning ? "Playing an illustrative identity scan." : ""}</span>
    </div>
  );
}
