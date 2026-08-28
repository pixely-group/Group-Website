"use client";

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
 * Continuity is the whole brief, so the page is built from the front page's
 * own parts rather than resemblances of them: the same chrome (bar, compact
 * menu, cursor, smooth scroll, footer), the same chapter grammar (the
 * section-index eyebrow, type-headline on text-big, bg-theme grounds
 * swapping between ink and bone, max-w-7xl), the same buttons wired to the
 * same auth panel. A service page is a chapter of the site that happens to
 * have its own address — not a second site.
 *
 * The hero carries the page's fragment of the Pixely drawing — the grown-up
 * version of the glyph under the dropdown this page lives in. See
 * IdentityGlyph for the puzzle contract that makes the fragments interlock.
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
  return (
    <section
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 pt-36 pb-16 text-theme sm:px-10 lg:px-14 lg:pt-44 lg:pb-24"
    >
      <div className="mx-auto max-w-7xl">
        <p className="type-label section-index mb-8 text-(--muted)">
          {eyebrow}
        </p>
        <h1 className="type-display text-giant">
          <span className="block">{title}</span>
          <em className="type-serif-inherit block text-accent normal-case">
            {serif}
            <span aria-hidden className="caret-dot" />
          </em>
        </h1>

        <div className="mt-12 grid items-center gap-12 lg:mt-16 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="max-w-[46ch] text-[1.02rem] leading-relaxed text-(--muted)">
              {lede}
            </p>
            {/* The home hero's own stack: a column of equal widths until
                there is room for a row. */}
            <div className="mt-9 flex w-fit flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
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
          <div className="relative lg:-mr-[4%]">{glyph}</div>
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
  return (
    <section
      data-theme={ground}
      className="relative bg-theme px-6 py-[12vh] text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-7xl">
        <p className="type-label section-index mb-6 text-(--muted)">{index}</p>
        {/* One size down from the front page's chapters: these are chapters
            of a chapter, and the scale says so. */}
        <h2 className="type-headline text-mid max-w-[24ch] text-balance">
          {title}
        </h2>
        {lede && (
          <p className="mt-6 max-w-[62ch] leading-relaxed text-(--muted)">
            {lede}
          </p>
        )}
        {children && <div className="mt-14">{children}</div>}
      </div>
    </section>
  );
}

/** The chapter grammar's card: hairline, surface, a label and a sentence. */
export function FeatureGrid({
  items,
}: {
  items: { label: string; body: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-(--radius-panel) border border-(--line) bg-(--surface) p-6 transition-colors duration-300 hover:border-(--line-strong)"
        >
          <h3 className="type-label text-(--fg)">{item.label}</h3>
          <p className="mt-3 text-[0.9rem] leading-relaxed text-(--muted)">
            {item.body}
          </p>
        </div>
      ))}
    </div>
  );
}

/** A sequence that is genuinely a sequence — the one place numbering means
 *  something. Each step is marked by the brand's square and joined to the
 *  next by the hairline the whole site draws structure with. */
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
                className="hidden h-px flex-1 bg-(--line) lg:block"
              />
            )}
          </div>
          <h3 className="type-headline mt-5 text-[1.15rem]">{step.title}</h3>
          <p className="mt-3 max-w-[36ch] text-[0.9rem] leading-relaxed text-(--muted)">
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** The closing invitation, in the front page's own pairing: one way in, one
 *  conversation. */
export function ServiceCTA({
  index,
  title,
  lede,
}: {
  index: string;
  title: string;
  lede: string;
}) {
  return (
    <section
      data-theme="ink"
      className="bg-theme px-6 pt-[10vh] pb-[14vh] text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-7xl border-t border-(--line) pt-16">
        <p className="type-label section-index mb-6 text-(--muted)">{index}</p>
        <h2 className="type-display text-big max-w-[14ch]">{title}</h2>
        <p className="mt-6 max-w-[56ch] leading-relaxed text-(--muted)">
          {lede}
        </p>
        <div className="mt-10 flex w-fit flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <MagneticButton size="lg" onClick={() => openAuth("up")}>
            Get started
          </MagneticButton>
          <MagneticButton href="/#start" variant="outline" size="lg">
            Talk to an engineer
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
