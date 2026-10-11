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
  className = "",
}: {
  /** The figure's file in public/hairline, e.g. "payments.js". */
  file: string;
  /** The name the figure registers itself under. */
  name: string;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let handle: ReturnType<Figure["mount"]> | null = null;
    let cancelled = false;

    loadFigure(file, name)
      .then((figure) => {
        if (cancelled || !window.HL) return;
        stage.setAttribute("data-hairline", figure.name);
        const svg = window.HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
        // The read-out is the bench's corner label. The card's own words say
        // what the figure shows, so it is kept and never displayed.
        handle = figure.mount({ stage, svg, read: { textContent: null } }, figure.range[1]);
      })
      .catch((error) => console.error(error));

    return () => {
      cancelled = true;
      handle?.destroy();
      stage.replaceChildren();
    };
  }, [file, name]);

  // Decorative: the service's name and note beside it carry the meaning.
  return <div ref={stageRef} aria-hidden className={`hairline-figure ${className}`} />;
}
