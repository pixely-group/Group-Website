import DocLink from "@/components/ui/DocLink";
import { JO } from "@/lib/laws";

/**
 * Algerian law, as the globe's pillars cite it: the Journal Officiel's French
 * edition, opened at the page each text starts on. The issues and pages are
 * the ones GlobalCorridors records and verified against the gazette itself;
 * they are repeated here because that list is private to its section, and
 * nothing is added to it.
 */

export type Law = {
  no: string;
  kind?: "Regulation";
  subject: string;
  year: string;
  href: string;
  amended?: { no: string; year: string; href: string };
};

export const LAWS = {
  banking: {
    no: "23-09",
    subject: "Monetary and banking law",
    year: "2023",
    href: JO(2023, 43, 4),
  },
  psp: {
    no: "25-02",
    kind: "Regulation",
    subject: "Payment service providers · Banque d'Algérie",
    year: "2025",
    href: JO(2025, 28, 20),
  },
  ecommerce: {
    no: "18-05",
    subject: "Electronic commerce",
    year: "2018",
    href: JO(2018, 28, 4),
  },
  esignature: {
    no: "15-04",
    subject: "Electronic signature and certification",
    year: "2015",
    href: JO(2015, 6, 6),
  },
  aml: {
    no: "05-01",
    subject: "Money laundering and terrorist financing",
    year: "2005",
    href: JO(2005, 11, 3),
    amended: { no: "23-01", year: "2023", href: JO(2023, 8, 6) },
  },
  data: {
    no: "18-07",
    subject: "Protection of personal data",
    year: "2018",
    href: JO(2018, 34, 10),
    amended: { no: "25-11", year: "2025", href: JO(2025, 48, 14) },
  },
} satisfies Record<string, Law>;

/**
 * The texts a page answers to, set in FeatureGrid's grammar — a hairline
 * that draws open, then the matter under it — with what the text bears on
 * written beside each one. The note says why the page cites it; it is not a
 * claim to hold anything the text provides for.
 */
export default function LawList({
  items,
}: {
  items: { law: Law; note: string }[];
}) {
  return (
    <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ law, note }) => (
        <li key={law.no}>
          <span
            aria-hidden
            data-draw
            className="block h-px w-full bg-(--line-strong)"
          />
          <div data-fade>
            <p className="type-label mt-5 text-(--faint)">
              {law.kind ?? "Law"} · Algeria
            </p>
            <h3 className="type-headline mt-3 text-[1.15rem]">
              {law.subject}
            </h3>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-(--muted)">
              {note}
            </p>
            {/* The globe's own law row: the document to open, its year
                in the mono column, an amendment hung from it by a rule. */}
            <div className="mt-5 border-y border-(--line) py-3 text-[0.9rem]">
              <div className="flex items-baseline justify-between gap-4">
                <DocLink href={law.href}>
                  {law.kind ?? "Law"} no. {law.no}
                </DocLink>
                <span className="type-mono text-[0.75rem] text-(--muted)">
                  {law.year}
                </span>
              </div>
              {law.amended && (
                <div className="mt-3 ml-1 border-l border-(--line) pl-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <DocLink href={law.amended.href}>
                      Law no. {law.amended.no}
                    </DocLink>
                    <span className="type-mono text-[0.75rem] text-(--muted)">
                      {law.amended.year}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.8rem] leading-snug text-(--faint)">
                    Amends law no. {law.no}
                  </p>
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
