import { LAWS } from "@/lib/laws";
import Link from "next/link";
import type { ReactNode } from "react";

import { ServiceShell } from "@/components/service/ServicePage";
import DocLink from "@/components/ui/DocLink";
import { LEGAL_UPDATED, OFFICES, OPERATOR, PRIVACY_EMAIL } from "@/lib/company";

/**
 * The shell the three legal documents share: privacy, terms, cookies.
 *
 * A legal page on this site is still a page on this site, so it sits inside
 * the same shell as the service pages (real navigation, real footer, the same
 * smooth scroll) and keeps the ink ground, the index label and the headline
 * the rest of the site speaks in. What changes is the reading: a contents
 * column that stays put on large screens, a 68ch measure, and sections
 * numbered and ruled so a reader can find the paragraph they came for.
 *
 * Everything here is a server component. ServiceShell is a client boundary,
 * but what passes through it as children still renders on the server, so the
 * documents ship as HTML and read without JavaScript. The contents links are
 * plain anchors: the browser's own jump, with scroll-margin clearing the
 * navigation bar.
 *
 * Facts about the companies come from lib/company.ts and nowhere else.
 */

export type LegalDoc = "privacy" | "terms" | "cookies";

export type LegalSection = {
  /** The anchor: short, stable, lowercase. */
  id: string;
  title: string;
  body: ReactNode;
};

const DOCS: { doc: LegalDoc; href: string; label: string; name: string }[] = [
  { doc: "privacy", href: "/privacy", label: "Privacy", name: "Privacy notice" },
  { doc: "terms", href: "/terms", label: "Terms", name: "Terms of use" },
  { doc: "cookies", href: "/cookies", label: "Cookies", name: "Cookie policy" },
];

/** Places the documents send readers off the site. The two laws are the
 *  French edition of the Journal Officiel, opened at the page each law starts
 *  on, as the globe on the front page links them. */
export const EXTERNAL = {
  ico: "https://ico.org.uk/",
  anpdp: "https://anpdp.dz/",
  law1807: LAWS["18-07"].href,
  law2511: LAWS["18-07"].amended!.href,
  googlePrivacy: "https://policies.google.com/privacy",
  applePrivacy: "https://www.apple.com/legal/privacy/",
} as const;

const pad = (n: number) => String(n).padStart(2, "0");

/* One link style for prose, matching DocLink's, so a link to another of
   these documents and a link off the site read as the same kind of thing;
   only the arrow tells them apart. */
const proseLink =
  "text-(--muted) underline decoration-1 underline-offset-4 transition-colors duration-200 hover:text-accent";

export default function LegalPage({
  doc,
  title,
  lede,
  sections,
}: {
  doc: LegalDoc;
  title: string;
  lede: ReactNode;
  sections: LegalSection[];
}) {
  const current = DOCS.find((d) => d.doc === doc)!;

  return (
    <ServiceShell>
      <div
        data-theme="ink"
        className="bg-theme px-6 pt-36 pb-24 text-theme sm:px-10 lg:px-14 lg:pt-44 lg:pb-32"
      >
        <div className="mx-auto max-w-7xl">
          {/* Masthead */}
          <header>
            <p className="type-label section-index text-(--muted)">
              Legal — {current.label}
            </p>
            <h1 className="type-headline mt-7 text-[clamp(2.4rem,7vw,5.25rem)]">
              {title}
            </h1>
            <div className="mt-8 max-w-[56ch] text-[1.0625rem] leading-[1.65] text-(--muted)">
              {lede}
            </div>
            <div className="mt-12 flex flex-col gap-5 border-t border-(--line) pt-5 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="type-label text-(--faint)">
                Last updated <span className="text-(--muted)">{LEGAL_UPDATED}</span>
              </p>
              <DocSwitcher current={doc} />
            </div>
          </header>

          <div className="mt-14 lg:mt-20 lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-20 xl:gap-28">
            {/* Contents: a column that stays put on large screens… */}
            <nav aria-label="Contents" className="hidden lg:block">
              <div className="sticky top-32">
                <p className="type-label text-(--faint)">Contents</p>
                <Contents sections={sections} />
              </div>
            </nav>

            {/* …and a fold-away list above the text everywhere else. */}
            <details className="group mb-12 border-y border-(--line) lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
                <span className="type-label text-(--muted)">
                  Contents · {sections.length} sections
                </span>
                <span
                  aria-hidden
                  className="type-label text-(--faint) transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <nav aria-label="Contents" className="pb-5">
                <Contents sections={sections} />
              </nav>
            </details>

            <article className="max-w-[68ch]">
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  aria-labelledby={`${s.id}-title`}
                  className="scroll-mt-32 border-t border-(--line) py-12 first:border-t-0 first:pt-0 lg:py-14"
                >
                  <p className="type-label text-accent">{pad(i + 1)}</p>
                  <h2
                    id={`${s.id}-title`}
                    className="mt-3 text-[clamp(1.35rem,2.2vw,1.7rem)] leading-[1.2] font-medium tracking-[-0.01em] text-(--fg)"
                  >
                    {s.title}
                  </h2>
                  <div className="mt-6 space-y-4 text-[1rem] leading-[1.7] text-(--muted) [&_strong]:font-medium [&_strong]:text-(--fg)">
                    {s.body}
                  </div>
                </section>
              ))}
            </article>
          </div>

          <OperatorBlock />
        </div>
      </div>
    </ServiceShell>
  );
}

function Contents({ sections }: { sections: LegalSection[] }) {
  return (
    <ol className="mt-5 space-y-2.5">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            data-cursor="link"
            className="group/item flex items-baseline gap-4 text-[0.875rem] leading-snug text-(--muted) transition-colors duration-200 hover:text-(--fg)"
          >
            <span className="type-label shrink-0 text-(--faint) transition-colors duration-200 group-hover/item:text-accent">
              {pad(i + 1)}
            </span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/** The three documents, each a step from the others. */
function DocSwitcher({ current }: { current: LegalDoc }) {
  return (
    <nav aria-label="Legal documents">
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {DOCS.map((d) => {
          const here = d.doc === current;
          return (
            <li key={d.doc}>
              <Link
                href={d.href}
                aria-current={here ? "page" : undefined}
                data-cursor="link"
                className={`type-label transition-colors duration-200 ${
                  here
                    ? "text-(--fg)"
                    : "text-(--faint) hover:text-accent"
                }`}
              >
                {d.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Who stands behind the document, set as a colophon. */
function OperatorBlock() {
  const others = OFFICES.filter((o) => o !== OPERATOR);
  return (
    <footer className="mt-20 border-t border-(--line) pt-10 lg:mt-28">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-20 xl:gap-28">
        <p className="type-label text-(--faint)">Operator</p>
        <div className="text-[0.9375rem] leading-[1.65] text-(--muted)">
          <p className="text-(--fg)">{OPERATOR.entity}</p>
          <p className="mt-2">
            A private limited company registered in England and Wales,{" "}
            {OPERATOR.registration.label.toLowerCase()}{" "}
            {OPERATOR.registration.href ? (
              <DocLink href={OPERATOR.registration.href}>
                {OPERATOR.registration.value}
              </DocLink>
            ) : (
              OPERATOR.registration.value
            )}
            .
          </p>
          <p className="mt-2">Registered office: {OPERATOR.address.join(", ")}.</p>
        </div>
        <div className="text-[0.9375rem] leading-[1.65] text-(--muted) sm:col-start-2 lg:col-start-auto">
          {others.map((o) => (
            <div key={o.entity}>
              <p className="text-(--fg)">{o.entity}</p>
              <p className="mt-2">
                Group company in {o.country}. {o.registration.label}{" "}
                <span className="type-mono">{o.registration.value}</span>.
              </p>
              <p className="mt-2">{o.address.join(", ")}.</p>
            </div>
          ))}
          <p className="mt-4">
            Questions about these documents: <Mail />
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ————————————————————————————————————————
   Prose parts the documents are written in
   ———————————————————————————————————————— */

/** A small table: a term on the left, what it means on the right, a hairline
 *  between rows. For anything that would otherwise be a run-on paragraph of
 *  "what, why, how long". */
export function Facts({
  items,
  caption,
}: {
  items: [term: ReactNode, detail: ReactNode][];
  caption?: ReactNode;
}) {
  return (
    <div className="pt-2">
      {caption ? (
        <p className="mb-3 text-[1rem] font-medium text-(--fg)">{caption}</p>
      ) : null}
      <dl className="divide-y divide-(--line) border-y border-(--line)">
        {items.map(([term, detail], i) => (
          <div
            key={i}
            className="grid gap-1 py-3.5 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-6"
          >
            <dt className="type-label pt-[0.3em] text-(--faint)">{term}</dt>
            <dd className="text-(--muted)">{detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** A list with the site's hairline dash for a bullet. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="relative pl-6 before:absolute before:top-[0.85em] before:left-0 before:h-px before:w-3 before:bg-(--line-strong)"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** A heading inside a section, for a section that holds several things. */
export function Sub({ children }: { children: ReactNode }) {
  return (
    <h3 className="pt-4 text-[1rem] font-medium text-(--fg)">{children}</h3>
  );
}

/** A link to another of the three documents, or a part of one. */
export function DocRef({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} data-cursor="link" className={proseLink}>
      {children}
    </Link>
  );
}

/** The address for privacy and legal questions. */
export function Mail() {
  return (
    <a href={`mailto:${PRIVACY_EMAIL}`} data-cursor="link" className={proseLink}>
      {PRIVACY_EMAIL}
    </a>
  );
}

/** A cookie or field name, set in the machine voice. */
export function Code({ children }: { children: ReactNode }) {
  return <code className="type-mono text-[0.875em] text-(--fg)">{children}</code>;
}
