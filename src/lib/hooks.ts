"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media query. useSyncExternalStore keeps the server snapshot and
 * the first client paint in agreement without a state-setting effect.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const useReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");

export const useFinePointer = () => useMediaQuery("(pointer: fine)");

const noopSubscribe = () => () => {};

/** True once hydrated on the client, false during SSR and first paint. */
export const useMounted = (): boolean =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
