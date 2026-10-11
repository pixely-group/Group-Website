import DocLink from "@/components/ui/DocLink";
import HairlineFigure from "@/components/ui/HairlineFigure";
import { JO } from "@/lib/laws";

/**
 * The two pieces the Solutions pages set that the service template does not
 * carry: an audience's markers, and the laws a page names.
 */

/* — The markers ———————————————————————————————————————————————————
   Each audience on the front page carries three markers: what kind of thing
   the platform is for them, never how much of it there is. Set here the way
   the front page sets them — the marker in the mono face over a hairline —
   with the sentence the page has room for underneath. */
export function Markers({
  items,
}: {
  items: { value: string; label: string; body: string }[];
}) {
  return (
    <dl className="grid gap-x-10 gap-y-12 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.value}>
          <span
            aria-hidden
            data-draw
            className="block h-px w-full bg-(--line-strong)"
          />
          <div data-fade className="pt-6">
            <dt className="type-mono text-[1.6rem] leading-none font-medium tracking-[-0.02em]">
              {item.value}
            </dt>
            <dd className="mt-3 text-[0.95rem] font-medium">{item.label}</dd>
            <dd className="mt-3 max-w-[38ch] text-[0.9rem] leading-relaxed text-(--muted)">
              {item.body}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

/* — The laws ——————————————————————————————————————————————————————
   The globe's own references, read off the Journal Officiel (see the note on
   PILLARS in GlobalCorridors): the French edition of the issue each text
   appeared in, opened at the page it starts on. Repeated rather than
   imported because GlobalCorridors keeps them private; the URLs are the same
   ones, built the same way. Only these texts — no others are verified. */

export type Law = {
  no: string;
  kind?: "Regulation";
  subject: string;
  year: string;
  href: string;
  amended?: { no: string; year: string; href: string };
};

export const LAWS = {
  banking: { no: "23-09", subject: "Monetary and banking law", year: "2023", href: JO(2023, 43, 4) },
  psp: {
    no: "25-02",
    kind: "Regulation",
    subject: "Payment service providers · Banque d'Algérie",
    year: "2025",
    href: JO(2025, 28, 20),
  },
  ecommerce: { no: "18-05", subject: "Electronic commerce", year: "2018", href: JO(2018, 28, 4) },
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

/** The globe's law rows, laid out as a ruled list. */
export function LawList({ laws }: { laws: Law[] }) {
  return (
    <div data-fade>
      <p className="type-label mb-2 text-[0.625rem] text-(--faint)">
        Built around
      </p>
      <ul className="grid gap-x-10 border-t border-(--line) sm:grid-cols-2">
        {laws.map((law) => (
          <li
            key={law.no}
            className="border-b border-(--line) py-3 text-[0.9rem]"
          >
            <div className="flex items-baseline justify-between gap-4">
              <DocLink href={law.href}>
                {law.kind ?? "Law"} no. {law.no}
              </DocLink>
              <span className="type-mono text-[0.75rem] text-(--muted)">
                {law.year}
              </span>
            </div>
            <p className="mt-1 text-[0.8rem] leading-snug text-(--faint)">
              {law.subject}
            </p>
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
          </li>
        ))}
      </ul>
      <p className="type-label mt-8 max-w-3xl text-[0.625rem] leading-relaxed text-(--faint)">
        Each text opens in the Journal Officiel of the République Algérienne,
        in its French edition, at the page it starts on. They name the
        framework Pixely is built for; they are not a licence or a
        certification.
      </p>
    </div>
  );
}

/* — The services, drawn ————————————————————————————————————————————
   FeatureGrid's ruled columns with each service's Hairline figure over its
   rule — the Core services section's own drawings, mounted one after another
   so their first answers arrive as a sequence. */
export function ServiceFigures({
  items,
}: {
  items: { file: string; name: string; label: string; body: string }[];
}) {
  return (
    <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <div key={item.label}>
          <HairlineFigure
            file={item.file}
            name={item.name}
            delay={i * 350}
            className="-mx-2 mb-6"
          />
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
