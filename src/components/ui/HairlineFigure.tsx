"use client";

import { useEffect, useRef } from "react";

/**
 * One Hairline figure: an isometric line drawing on the @lucasmarkes/hairline
 * engine (MIT, public/hairline/LICENSE.txt), that plays its own story when
 * left alone and answers the pointer when it is over it.
 *
 * The engine and the figures are served as they were written, from
 * public/hairline, rather than bundled. The engine is a classic script that
 * leaves `HL` on the window, and each figure is a module that reads `HL` and
 * ends by calling `hairline({...})`. That is the shape the Hairline tooling
 * builds and checks, so a figure redrawn there drops in here unchanged. Each
 * figure is a module rather than a classic script because they all open
 * with the same `const {...} = HL`, and two classic scripts declaring the
 * same names would collide.
 *
 * Everything this component does is what Hairline's own bench page does to
 * show a figure: make the stage and the svg, hand them over, keep the
 * handle. The engine owns the rest. It runs one frame loop for every figure
 * on the page, sleeps it when they are offscreen, and lands every motion at
 * once under reduced motion.
 */

type Figure = {
  name: string;
  means: string;
  range: [number, number, number];
  mount: (
    host: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string | null } },
    value: number,
  ) => { set: (value: number) => void; destroy: () => void };
};

type Kernel = {
  inject: (root: Document) => void;
  mk: (tag: string, attrs: Record<string, string>, parent: Element) => SVGSVGElement;
};

declare global {
  interface Window {
    HL?: Kernel;
    hairline?: (figure: Figure) => void;
  }
}

const BASE = "/hairline/";
let kernel: Promise<Kernel> | null = null;
const figures = new Map<string, Promise<Figure>>();
const waiting = new Map<string, (figure: Figure) => void>();
/** When the first figure on the page came into view: every delay counts from
 *  it, so a row that scrolls in later still takes its turn in the order
 *  rather than starting a count of its own. */
let firstSeen = 0;
/** Figures on the page now. When the last one goes, the count starts afresh
 *  for whatever page mounts the next. */
let live = 0;

function script(attrs: Record<string, string>) {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    Object.assign(el, attrs);
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`hairline: ${attrs.src} did not load`));
    document.head.appendChild(el);
  });
}

function loadKernel() {
  kernel ??= script({ src: `${BASE}kernel.js` }).then(() => {
    // Figures register by name; whoever asked for that name is answered.
    window.hairline = (figure) => {
      waiting.get(figure.name)?.(figure);
      waiting.delete(figure.name);
    };
    window.HL!.inject(document);
    return window.HL!;
  });
  return kernel;
}

function loadFigure(file: string, name: string) {
  let figure = figures.get(name);
  if (!figure) {
    figure = loadKernel().then(
      () =>
        new Promise<Figure>((resolve, reject) => {
          waiting.set(name, resolve);
          script({ src: `${BASE}${file}`, type: "module" }).catch(reject);
        }),
    );
    figures.set(name, figure);
  }
  return figure;
}

export default function HairlineFigure({
  file,
  name,
  delay = 0,
  className = "",
}: {
  /** The figure's file in public/hairline, e.g. "payments.js". */
  file: string;
  /** The name the figure registers itself under. */
  name: string;
  /**
   * How long after the stage first comes into view the figure is mounted,
   * in ms. A figure starts its own loop the moment it mounts, so mounting a
   * row of them one after another is what keeps them out of step: their
   * first answers arrive as a sequence, not all on the same beat.
   */
  delay?: number;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let handle: ReturnType<Figure["mount"]> | null = null;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    live++;

    // Fetched straight away, so the mount itself is instant when its turn comes.
    const loading = loadFigure(file, name);
    loading.catch((error) => console.error(error));

    const mount = () =>
      loading.then((figure) => {
        if (cancelled || !window.HL) return;
        stage.setAttribute("data-hairline", figure.name);
        const svg = window.HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
        // The read-out is the bench's corner label. The card's own words say
        // what the figure shows, so it is kept and never displayed.
        handle = figure.mount({ stage, svg, read: { textContent: null } }, figure.range[1]);
        // Next frame, so the fade starts from the svg's first paint.
        requestAnimationFrame(() => stage.setAttribute("data-in", ""));
      }, () => {});

    // Under reduced motion every figure rests anyway: nothing to stagger.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        seen.disconnect();
        const now = performance.now();
        firstSeen ||= now;
        const wait = still ? 0 : firstSeen + delay - now;
        if (wait <= 0) mount();
        else timer = setTimeout(mount, wait);
      },
      { threshold: 0.35 },
    );
    seen.observe(stage);

    return () => {
      cancelled = true;
      seen.disconnect();
      clearTimeout(timer);
      handle?.destroy();
      stage.replaceChildren();
      stage.removeAttribute("data-in");
      if (--live === 0) firstSeen = 0;
    };
  }, [file, name, delay]);

  // Decorative: the service's name and note beside it carry the meaning.
  return <div ref={stageRef} aria-hidden className={`hairline-figure ${className}`} />;
}
