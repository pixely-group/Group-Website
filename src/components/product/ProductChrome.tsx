"use client";

import { useRef } from "react";

import MagneticButton from "@/components/ui/MagneticButton";
import { useHeroIntro, useReveal } from "@/components/about/motion";
import { openAuth } from "@/lib/auth-trigger";
import { topicHref, type TopicId } from "@/lib/contact";

/**
 * The Product pages' hero and close: ServiceHero and ServiceCTA, line for
 * line, with one difference. The template's second way in points at the
 * front page's #start; a service page should open the contact form on the
 * conversation it is about, so these take the topic and point there.
 *
 * ServicePage is the template and not these pages' to edit, so the markup
 * is repeated here rather than forked there. The choreography comes from
 * the About page's copy of the template's hooks: same masks, same eases,
 * same reduced-motion guard. If the template changes, change this too.
 */

/** ServiceHero's own field: the site's flowing hairlines, pinched toward
 *  the right. */
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

/** ServiceCTA's closing echo. */
function ClosingField() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 1440 700"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {Array.from({ length: 11 }, (_, i) => (
        <path
          key={i}
          d={`M -80 ${90 + i * 62} C 420 ${60 + i * 62 + (i % 3) * 34}, 900 ${150 + i * 54}, 1520 ${250 + i * 34}`}
          stroke="#ece9e1"
          strokeOpacity={0.05 + (i % 3) * 0.015}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export function ProductHero({
  eyebrow,
  title,
  serif,
  lede,
  figure,
  topic,
  talk = "Talk to an engineer",
}: {
  eyebrow: string;
  title: string;
  serif: string;
  lede: React.ReactNode;
  /** The service's Hairline figure, or any drawing cut to the same stage. */
  figure: React.ReactNode;
  topic: TopicId;
  /** The second way in: the conversation, opened on this page's topic. */
  talk?: string;
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
              <MagneticButton size="md" onClick={() => openAuth("up")}>
                Get started
              </MagneticButton>
              <MagneticButton
                href={`/${topicHref(topic)}`}
                variant="outline"
                size="md"
              >
                {talk}
              </MagneticButton>
            </div>
          </div>
          {/* The service's figure, held to a size it reads at: the
              drawings are built for a card, and blown up past this they
              thin out rather than gain anything. */}
          <div
            data-fade
            className="relative mx-auto w-full max-w-[560px] lg:mr-0"
          >
            {figure}
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

export function ProductCTA({
  index,
  titleLines,
  lede,
  topic,
  talk = "Talk to an engineer",
}: {
  index: string;
  titleLines: [string, string];
  lede: string;
  topic: TopicId;
  talk?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <section
      ref={ref}
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 pt-[12vh] pb-[14vh] text-theme sm:px-10 lg:px-14"
    >
      <ClosingField />
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
            <MagneticButton size="lg" onClick={() => openAuth("up")}>
              Get started
            </MagneticButton>
            <MagneticButton
              href={`/${topicHref(topic)}`}
              variant="outline"
              size="lg"
            >
              {talk}
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
