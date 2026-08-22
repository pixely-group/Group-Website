"use client";

import { useEffect, useRef } from "react";

/**
 * Scales one line of text so it spans its container exactly, whatever the
 * word is. Text width is linear in font-size, so a single measurement gives
 * the exact scale; it re-fits on resize and once webfonts have loaded.
 *
 * A viewport-unit font-size cannot do this job: it is blind to the word's
 * own width, and it keeps growing after the container stops.
 */
export default function FitText({
  children,
  className = "",
  letterClassName,
  fitTo,
  after,
}: {
  children: string;
  className?: string;
  /** Set to wrap every character in its own span — for per-letter hover. The
   *  measurement is unaffected: it reads the wrapping span either way. Each
   *  span also carries its character as data-ch, so CSS can restate it in
   *  pseudo-elements. */
  letterClassName?: string;
  /** Fit against this string instead of the children: the font size is the
   *  one that would span the container with `fitTo`, and the children render
   *  at it. This is how the footer shows P. at exactly the size its P had
   *  inside PIXELY — the reference is the long form, the render is the
   *  short. */
  fitTo?: string;
  /** Rendered inside the fitted line, after the letters — for marks that are
   *  not characters, like the brand's square full stop. */
  after?: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const text = textRef.current;
    if (!host || !text) return;

    const REFERENCE_PX = 100;
    const fit = () => {
      let natural: number;
      if (fitTo) {
        /* Measured on a probe rather than by swapping the live text out —
           the letters carry spans and the `after` mark, and textContent
           would flatten them. */
        const probe = document.createElement("span");
        probe.className = text.className;
        probe.style.cssText =
          "position:absolute;visibility:hidden;font-size:100px";
        probe.textContent = fitTo;
        host.appendChild(probe);
        natural = probe.getBoundingClientRect().width;
        probe.remove();
      } else {
        text.style.fontSize = `${REFERENCE_PX}px`;
        // `w-max` matters: as a plain block the span would report the
        // container's width, making the ratio always 1 and the fit a no-op.
        natural = text.getBoundingClientRect().width;
      }
      if (!natural) return;
      text.style.fontSize = `${(host.clientWidth / natural) * REFERENCE_PX}px`;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) fit();
    });

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [children, fitTo]);

  return (
    <div ref={hostRef} className="w-full">
      <span ref={textRef} className={`block w-max whitespace-nowrap ${className}`}>
        {letterClassName
          ? children
              .split("")
              .map((ch, i) => (
                <span
                  key={`${ch}-${i}`}
                  className={letterClassName}
                  data-ch={ch}
                  /* The character it really is. `data-ch` follows whatever is
                     on show, which a decode changes every few frames; this one
                     is what it resolves back to. */
                  data-wm-letter={ch}
                >
                  {ch}
                </span>
              ))
          : children}
        {after}
      </span>
    </div>
  );
}
