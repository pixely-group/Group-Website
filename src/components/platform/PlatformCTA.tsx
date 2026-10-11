"use client";

import { useRef } from "react";

import MagneticButton from "@/components/ui/MagneticButton";
import { EchoField, useReveal } from "@/components/about/motion";
import type { Action } from "@/components/platform/PlatformHero";

/** ServiceCTA's close — the echo field, the statement rising line by line,
 *  the accent square ending it — with its invitation pointed at the contact
 *  form, opened on the page's own topic. */
export default function PlatformCTA({
  index,
  titleLines,
  lede,
  primary,
  secondary,
}: {
  index: string;
  titleLines: [string, string];
  lede: string;
  primary: Action;
  secondary?: Action;
}) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <section
      ref={ref}
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 pt-[12vh] pb-[14vh] text-theme sm:px-10 lg:px-14"
    >
      <EchoField />
      <div className="relative mx-auto max-w-7xl">
        <p data-fade className="type-label section-index mb-8 text-(--muted)">
          {index}
        </p>
        <h2 className="type-display text-giant max-w-[13ch]">
          <span className="block overflow-hidden pb-[0.02em]">
            <span data-line className="block">
              {titleLines[0]}
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-line className="block">
              {titleLines[1]}
              <span
                aria-hidden
                className="ml-[0.07em] inline-block size-[0.17em] bg-accent"
              />
            </span>
          </span>
        </h2>
        <div className="mt-12 grid gap-10 border-t border-(--line) pt-9 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <p
            data-fade
            className="max-w-md text-[0.98rem] leading-relaxed text-(--muted)"
          >
            {lede}
          </p>
          <div
            data-fade
            className="flex w-fit flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
          >
            <MagneticButton href={primary.href} size="lg">
              {primary.label}
            </MagneticButton>
            {secondary && (
              <MagneticButton href={secondary.href} variant="outline" size="lg">
                {secondary.label}
              </MagneticButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
