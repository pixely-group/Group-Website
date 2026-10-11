"use client";

import { useRef } from "react";

import MagneticButton from "@/components/ui/MagneticButton";
import { EchoField, useHeroIntro } from "@/components/about/motion";

export type HeroAction = {
  label: string;
  href: string;
  variant?: "solid" | "outline";
};

/**
 * The Company pages' arrival — About's hero, opened up for its siblings.
 * Same field, same masks, same order of events: the display line and its
 * serif answer rise, the lede and the ways in fade up behind them, and the
 * right-hand column carries whatever this page sets beside its statement —
 * a drawing, or a piece of type, as About sets its manifesto.
 */
export default function CompanyHero({
  eyebrow,
  title,
  serif,
  lede,
  actions,
  aside,
  titleClassName = "text-giant",
}: {
  eyebrow: string;
  title: string;
  serif: string;
  lede: React.ReactNode;
  actions: HeroAction[];
  aside: React.ReactNode;
  /** The display size. A long serif answer needs About's narrower clamp. */
  titleClassName?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useHeroIntro(ref);

  return (
    <section
      ref={ref}
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 pt-36 pb-16 text-theme sm:px-10 lg:px-14 lg:pt-44 lg:pb-24"
    >
      <EchoField count={12} />
      <div className="relative mx-auto max-w-7xl">
        <p data-fade className="type-label section-index mb-8 text-(--muted)">
          {eyebrow}
        </p>
        <h1 className={`type-display opacity-0 ${titleClassName}`}>
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

        <div className="mt-12 grid items-end gap-14 lg:mt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
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
              {actions.map((action) => (
                <MagneticButton
                  key={action.href}
                  href={action.href}
                  variant={action.variant ?? "solid"}
                  size="md"
                >
                  {action.label}
                </MagneticButton>
              ))}
            </div>
          </div>
          <div data-fade className="relative">
            {aside}
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
