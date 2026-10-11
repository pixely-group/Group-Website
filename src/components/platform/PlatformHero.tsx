"use client";

import { useRef } from "react";

import MagneticButton from "@/components/ui/MagneticButton";
import { useHeroIntro } from "@/components/about/motion";

export type Action = { label: string; href: string };

/** ServiceHero's field: the site's flowing hairlines, pinched toward the
 *  right. Repeated rather than imported because the template keeps it
 *  private; the numbers are the template's own. */
function ConvergingField() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 1440 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <path
          key={i}
          d={`M -80 ${40 + i * 64} C 380 ${20 + i * 64 + (i % 3) * 32}, 860 ${190 + i * 36}, 1520 ${330 + i * 15}`}
          stroke="#ece9e1"
          strokeOpacity={0.05 + (i % 3) * 0.015}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

/**
 * ServiceHero, for the Platform column. The same arrival, the same field,
 * the same two voices in the headline and the fragment beside the lede — the
 * one difference is where its two buttons go. A platform page's way in is a
 * conversation on the right topic, not a sign-up, so the actions are passed
 * in rather than fixed.
 */
export default function PlatformHero({
  eyebrow,
  title,
  serif,
  lede,
  glyph,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: string;
  serif: string;
  lede: React.ReactNode;
  glyph: React.ReactNode;
  primary: Action;
  secondary?: Action;
}) {
  const ref = useRef<HTMLElement>(null);
  useHeroIntro(ref);

  return (
    <section
      ref={ref}
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 pt-36 pb-16 text-theme sm:px-10 lg:px-14 lg:pt-44 lg:pb-24"
    >
      <ConvergingField />
      <div className="relative mx-auto max-w-7xl">
        <p data-fade className="type-label section-index mb-8 text-(--muted)">
          {eyebrow}
        </p>
        <h1 className="type-display text-giant opacity-0">
          <span className="block overflow-hidden pb-[0.02em]">
            <span data-line className="block">
              {title}
            </span>
          </span>
          <span className="-mb-[0.16em] block overflow-hidden pb-[0.16em]">
            <em
              data-line
              className="type-serif-inherit block text-accent normal-case"
            >
              {serif}
              <span aria-hidden className="caret-dot" />
            </em>
          </span>
        </h1>

        <div className="mt-12 grid items-center gap-12 lg:mt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div>
            <p
              data-fade
              className="max-w-[46ch] text-[1.02rem] leading-relaxed text-(--muted)"
            >
              {lede}
            </p>
            <div
              data-fade
              className="mt-9 flex w-fit flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
            >
              <MagneticButton href={primary.href} size="md">
                {primary.label}
              </MagneticButton>
              {secondary && (
                <MagneticButton href={secondary.href} variant="outline" size="md">
                  {secondary.label}
                </MagneticButton>
              )}
            </div>
          </div>
          <div data-fade className="relative lg:-mr-[5%]">
            {glyph}
          </div>
        </div>

        <div data-fade className="mt-16 flex items-center gap-3">
          <span className="type-label text-(--faint)">Scroll</span>
          <span className="scroll-hint relative h-10 w-px overflow-hidden bg-(--line)">
            <span className="absolute inset-x-0 h-1/2 bg-accent" />
          </span>
        </div>
      </div>
    </section>
  );
}
