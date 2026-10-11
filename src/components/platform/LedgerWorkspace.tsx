"use client";

import { useEffect, useRef } from "react";

import ProductUI from "@/components/sections/ProductUI";
import ProductUIMobile from "@/components/sections/ProductUIMobile";

/** The workspace's own width, as ProductExperience fits it. */
const FRAME_WIDTH = 884;

/**
 * The front page's treasury workspace, held still: the same composition and
 * the same demo data, fitted to the column the way ProductExperience fits it
 * — scaled down from its fixed width on wide screens, swapped for its phone
 * rendition on narrow ones rather than shrunk to illegible type.
 *
 * It is a picture of the product being built, not an account: the caption
 * under it says so, every time it is shown.
 */
export default function LedgerWorkspace() {
  const scalerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scaler = scalerRef.current;
    const holder = scaler?.parentElement;
    const frame = scaler?.firstElementChild as HTMLElement | null;
    if (!scaler || !holder || !frame) return;

    const fit = () => {
      // Unlike the front page, the workspace has the whole column to itself
      // here, so it may grow into it — it is real DOM, and type stays crisp.
      const scale = Math.min(
        1.45,
        holder.clientWidth / Math.max(FRAME_WIDTH, frame.offsetWidth),
      );
      scaler.style.transformOrigin = "left top";
      scaler.style.transform = `scale(${scale})`;
      scaler.style.height = `${frame.offsetHeight * scale}px`;
    };

    const ro = new ResizeObserver(fit);
    ro.observe(holder);
    ro.observe(frame);
    return () => ro.disconnect();
  }, []);

  return (
    <figure>
      <div className="md:hidden">
        <ProductUIMobile />
      </div>
      {/* The event stream's unwrapped lines run a few pixels past their
          panel; scaled up, that would push the page into a horizontal
          scroll, so the panel keeps them to itself here. */}
      <div className="hidden md:block [&_[data-panel=events]]:overflow-hidden">
        <div ref={scalerRef} className="w-fit">
          <ProductUI />
        </div>
      </div>
      <figcaption className="type-label mt-6 flex items-center gap-3 text-[0.625rem] text-(--faint)">
        <span aria-hidden className="size-[7px] shrink-0 bg-accent" />
        Illustrative workspace · demo data, not a live account
      </figcaption>
    </figure>
  );
}
