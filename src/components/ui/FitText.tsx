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
}: {
  children: string;
  className?: string;
  /** Set to wrap every character in its own span — for per-letter hover. The
   *  measurement is unaffected: it reads the wrapping span either way. */
  letterClassName?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const text = textRef.current;
    if (!host || !text) return;

    const REFERENCE_PX = 100;
    const fit = () => {
      text.style.fontSize = `${REFERENCE_PX}px`;
      // `w-max` matters: as a plain block the span would report the
      // container's width, making the ratio always 1 and the fit a no-op.
      const natural = text.getBoundingClientRect().width;
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
  }, [children]);

  return (
    <div ref={hostRef} className="w-full">
      <span ref={textRef} className={`block w-max whitespace-nowrap ${className}`}>
        {letterClassName
          ? children
              .split("")
              .map((ch, i) => (
                <span key={`${ch}-${i}`} className={letterClassName}>
                  {ch}
                </span>
              ))
          : children}
      </span>
    </div>
  );
}
