"use client";

import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null (SSR, reduced motion, before init). */
export const useLenis = () => useContext(LenisContext);

/**
 * Root scroll provider. Drives Lenis from the GSAP ticker so ScrollTrigger,
 * Lenis and every scrubbed animation share one clock. Skipped entirely for
 * users who prefer reduced motion — native scrolling remains.
 */
export default function SmoothScroll({ children }: PropsWithChildren) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // A choreographed single-page journey should always begin at the top.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const settle = setTimeout(() => ScrollTrigger.refresh(), 200);
      return () => clearTimeout(settle);
    }

    const instance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    instance.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    // Publishing the instance is exactly the "subscribe to an external
    // system" case the rule is meant to allow; consumers mount before this
    // effect runs, so a ref alone would leave them with a null on first pass.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);
    if (process.env.NODE_ENV === "development") {
      (window as unknown as Record<string, unknown>).__lenis = instance;
    }

    // Section effects mount after us and pinning changes the document's
    // height, so re-measure once the tree and fonts have settled.
    const refresh = () => ScrollTrigger.refresh();
    const settle = setTimeout(refresh, 200);
    document.fonts.ready.then(refresh);

    return () => {
      clearTimeout(settle);
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}
