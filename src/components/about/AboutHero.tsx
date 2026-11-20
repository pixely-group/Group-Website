"use client";

import { useRef } from "react";

import MagneticButton from "@/components/ui/MagneticButton";
import { EchoField, useHeroIntro } from "@/components/about/motion";
import { OFFICES } from "@/lib/company";

/**
 * The About page's arrival, in ServiceHero's grammar: the display line and
 * its serif answer rising from their masks, the lede and the way in fading up
 * behind them. Where a service page sets its fragment of the drawing, this
 * one sets the manifesto's opening sentence — the company's reason for
 * existing, in the words the front page already uses for it.
 */
export default function AboutHero() {
  const ref = useRef<HTMLElement>(null);
  useHeroIntro(ref);

  const [algiers] = OFFICES;

  return (
    <section
      ref={ref}
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 pt-36 pb-16 text-theme sm:px-10 lg:px-14 lg:pt-44 lg:pb-24"
    >
      <EchoField count={12} />
      <div className="relative mx-auto max-w-7xl">
        <p data-fade className="type-label section-index mb-8 text-(--muted)">
          Company — About
        </p>
        <h1 className="type-display text-[clamp(2.3rem,8.5vw,9rem)] opacity-0">
          <span className="block overflow-hidden pb-[0.02em]">
            <span data-line className="block">
              One platform,
            </span>
          </span>
          <span className="-mb-[0.16em] block overflow-hidden pb-[0.16em]">
            <em
              data-line
              className="type-serif-inherit block text-accent normal-case"
            >
              built in Algeria
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
              Pixely builds payments, digital identity and AI into one
              platform for Algeria, and connects it outward. The company
              that carries the name is {algiers.entity}, in {algiers.city}.
            </p>
            <div
              data-fade
              className="mt-9 flex w-fit flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
            >
              <MagneticButton href="/#contact" size="md">
                Talk to us
              </MagneticButton>
              <MagneticButton
                href="/platform/identity"
                variant="outline"
                size="md"
              >
                See the platform
              </MagneticButton>
            </div>
          </div>

          {/* The manifesto's first sentence, set as the front page sets it:
              the statement in the text face, its two nouns in the serif. */}
          <figure data-fade className="border-t border-(--line) pt-7">
            <blockquote className="text-[clamp(1.45rem,2.6vw,2.4rem)] leading-[1.22] font-medium tracking-[-0.01em]">
              A payment is <em className="type-serif">data</em>. So is an{" "}
              <em className="type-serif">identity</em>. We are building the
              platform where both move at the speed of the{" "}
              <em className="type-serif text-accent">network</em>.
            </blockquote>
            <figcaption className="type-label mt-7 flex items-center gap-3 text-(--faint)">
              <span aria-hidden className="size-[7px] bg-accent" />
              Pixely — payment and identity, one platform
            </figcaption>
          </figure>
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
