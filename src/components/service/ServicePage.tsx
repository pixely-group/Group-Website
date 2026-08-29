"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

import SmoothScroll from "@/components/chrome/SmoothScroll";
import CustomCursor from "@/components/chrome/CustomCursor";
import Navigation from "@/components/chrome/Navigation";
import Footer from "@/components/chrome/Footer";
import MagneticButton from "@/components/ui/MagneticButton";
import { openAuth } from "@/lib/auth-trigger";

/**
 * The service page template — Identity is the first tenant; eWallets and
 * the rest move in after it is approved.
 *
 * Continuity is the whole brief, and on this site continuity includes the
 * choreography: the front page performs — clip-masked lines rising,
 * chapters revealing as the scroll arrives, hairline fields flowing behind
 * the type — so a chapter with its own address has to perform the same
 * way. Every pattern here is lifted from the front page's own sections
 * (FinalCTA's guarded timeline, the hero's masked rises, its echo-line
 * field), not re-invented beside them.
 *
 * The grammar in short: [data-line] rises inside an overflow-hidden mask,
 * [data-fade] rises and fades in with a stagger, [data-draw] scales open
 * from the left. Bands run them on a ScrollTrigger; the hero runs them on
 * arrival. All of it sits behind the same reduced-motion guard the front
 * page uses.
 */

export function ServiceShell({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <CustomCursor />
      <Navigation />
      <main>{children}</main>
      <Footer />
    </SmoothScroll>
  );
}

/** The front page's below-the-fold reveal, packaged: as the scroll
 *  arrives, lines rise out of their masks, fades follow, rules draw open.
 *  FinalCTA's own timeline, with the same reduced-motion guard. */
function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lines = root.querySelectorAll("[data-line]");
        const fades = root.querySelectorAll("[data-fade]");
        const draws = root.querySelectorAll("[data-draw]");
        gsap.set(lines, { yPercent: 112 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: "top 72%" },
        });
        tl.to(lines, {
          yPercent: 0,
          duration: 1.15,
          stagger: 0.09,
          ease: "expo.out",
        });
        if (fades.length)
          tl.fromTo(
            fades,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.85, stagger: 0.07 },
            lines.length ? "-=0.7" : 0,
          );
        if (draws.length)
          tl.fromTo(
            draws,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.9,
              stagger: 0.08,
              ease: "expo.out",
              transformOrigin: "0 50%",
            },
            "-=0.5",
          );
      });
      return () => mm.revert();
    }, root);
    return () => ctx.revert();
  }, [ref]);
}

/** The hero's arrival, exactly as the front page performs its own: the h1
 *  ships opacity-0 so nothing flashes pre-hydration, reduced motion gets
 *  everything set visible at once, and everyone else waits for the fonts
 *  before the lines rise out of their masks. */
function useHeroIntro(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const lines = root.querySelectorAll("[data-line]");
    const fades = root.querySelectorAll("[data-fade]");
    const headline = root.querySelector("h1");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([lines, fades], { yPercent: 0, y: 0, opacity: 1 });
      gsap.set(headline, { opacity: 1 });
      return;
    }

    let tl: gsap.core.Timeline | undefined;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      gsap.set(lines, { yPercent: 140 });
      gsap.set(headline, { opacity: 1 });
      tl = gsap
        .timeline({ delay: 0.1 })
        .to(lines, {
          yPercent: 0,
          duration: 1.25,
          stagger: 0.095,
          ease: "expo.out",
        })
        .fromTo(
          fades,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.07,
            ease: "power3.out",
          },
          "-=0.7",
        );
    });
    return () => {
      cancelled = true;
      tl?.kill();
    };
  }, [ref]);
}

/** The hero's field: the site's flowing hairlines, pinched toward the
 *  right — every route on this page is on its way to the gate. */
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

export function ServiceHero({
  eyebrow,
  title,
  serif,
  lede,
  glyph,
}: {
  eyebrow: string;
  /** The statement, in the two voices: display carries the subject, serif
   *  answers it, and the caret-dot closes the sentence the way the wordmark
   *  closes the name. */
  title: string;
  serif: string;
  lede: React.ReactNode;
  glyph: React.ReactNode;
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
          {/* The serif line's mask leaves room for its descenders — the
              display lines above are caps and need none. */}
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
            {/* The home hero's own stack: a column of equal widths until
                there is room for a row. */}
            <div
              data-fade
              className="mt-9 flex w-fit flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
            >
              <MagneticButton size="md" onClick={() => openAuth("up")}>
                Get started
              </MagneticButton>
              <MagneticButton href="/#start" variant="outline" size="md">
                Talk to an engineer
              </MagneticButton>
            </div>
          </div>
          {/* The fragment. It reaches a little past the column on wide
              screens — a piece cut from a larger sheet should look cut
              from one. */}
          <div data-fade className="relative lg:-mr-[5%]">
            {glyph}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ServiceBand({
  index,
  title,
  lede,
  ground,
  children,
}: {
  index: string;
  title: string;
  lede?: React.ReactNode;
  ground: "ink" | "bone";
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <section
      ref={ref}
      data-theme={ground}
      className="relative bg-theme px-6 py-[13vh] text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-7xl">
        <p data-fade className="type-label section-index mb-6 text-(--muted)">
          {index}
        </p>
        <h2 className="type-headline text-big max-w-[18ch] text-balance">
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-line className="block">
              {title}
            </span>
          </span>
        </h2>
        {lede && (
          <p
            data-fade
            className="mt-6 max-w-[62ch] leading-relaxed text-(--muted)"
          >
            {lede}
          </p>
        )}
        {children && <div className="mt-14">{children}</div>}
      </div>
    </section>
  );
}

/** The chapter grammar's list: hairline-ruled columns, the way the front
 *  page sets its supporting matter — not boxes. Each rule draws open as
 *  the scroll arrives. */
export function FeatureGrid({
  items,
}: {
  items: { label: string; body: string }[];
}) {
  return (
    <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <div key={item.label}>
          <span
            aria-hidden
            data-draw
            className="block h-px w-full bg-(--line-strong)"
          />
          <div data-fade>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="type-label text-(--faint)">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="type-label text-(--fg)">{item.label}</h3>
            </div>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-(--muted)">
              {item.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** A sequence that is genuinely a sequence — the one place numbering means
 *  something. Each step is marked by the brand's square and joined to the
 *  next by a hairline that draws itself toward it. */
export function FlowSteps({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    <ol className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <li key={step.title}>
          <div className="flex items-center gap-4">
            <span aria-hidden className="size-[9px] shrink-0 bg-accent" />
            <span className="type-label text-(--faint)">
              {String(i + 1).padStart(2, "0")}
            </span>
            {/* The joint to the next step, drawn only where there is one. */}
            {i < steps.length - 1 && (
              <span
                aria-hidden
                data-draw
                className="hidden h-px flex-1 bg-(--line) lg:block"
              />
            )}
          </div>
          <div data-fade>
            <h3 className="type-headline mt-5 text-[1.15rem]">{step.title}</h3>
            <p className="mt-3 max-w-[36ch] text-[0.9rem] leading-relaxed text-(--muted)">
              {step.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The closing invitation, staged the way the front page closes: the echo
 *  field behind, the statement rising out of its masks, one way in and one
 *  conversation. */
export function ServiceCTA({
  index,
  titleLines,
  lede,
}: {
  index: string;
  /** The statement, one mask per line. */
  titleLines: [string, string];
  lede: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <section
      ref={ref}
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 pt-[12vh] pb-[14vh] text-theme sm:px-10 lg:px-14"
    >
      {/* The front page's own closing echo. */}
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
            <MagneticButton href="/#start" variant="outline" size="lg">
              Talk to an engineer
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
