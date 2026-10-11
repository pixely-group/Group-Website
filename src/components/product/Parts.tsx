import DocLink from "@/components/ui/DocLink";
import { JO } from "@/lib/laws";

/**
 * The pieces the Product pages set beside their copy, all cut from things
 * the site already has: the Identity page's signal-stream panel, the event
 * stream on the front page's workspace, and the law list under the globe.
 * Nothing here is a new visual language — only the old one, filled with
 * each service's own matter.
 */

/** The panel the Identity page's signal stream stands in: a surface, a
 *  hairline border, a labelled head with the pulsing square. `note` is the
 *  quiet word on the right of the head — on every panel that shows sample
 *  data, it says so. */
export function StagePanel({
  label,
  note,
  children,
  className = "",
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full min-h-[320px] flex-col rounded-(--radius-panel) border border-(--line) bg-(--surface) p-6 ${className}`}
    >
      <p className="type-label flex items-center justify-between gap-4 border-b border-(--line) pb-4 text-(--faint)">
        <span>{label}</span>
        <span className="flex items-center gap-3">
          {note && <span className="text-[0.625rem]">{note}</span>}
          <span aria-hidden className="size-1.5 animate-pulse bg-accent" />
        </span>
      </p>
      {children}
    </div>
  );
}

export type Verdict = "positive" | "negative" | "accent" | "muted";

const TONE: Record<Verdict, string> = {
  positive: "text-(--color-positive)",
  negative: "text-(--color-negative)",
  accent: "text-accent",
  muted: "text-(--muted)",
};

/** SignalStream's own marquee, for any list of rows: the list twice, slid
 *  by half its height on the site's `.signal-stream` loop. Reduced motion
 *  never starts it, and the first screenful simply stands. */
export function Stream({
  rows,
}: {
  rows: { key: string; what: string; verdict: string; tone: Verdict }[];
}) {
  return (
    <div
      className="relative mt-4 min-h-[300px] flex-1 overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
      }}
    >
      {/* Out of flow, so the panel takes the height of the copy beside it
          rather than the height of the list. */}
      <div className="signal-stream absolute inset-x-0 top-0">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1}>
            {rows.map((row, i) => (
              <li
                key={`${row.key}-${i}`}
                className="flex items-baseline justify-between gap-4 py-2.5 font-mono text-[0.7rem] tracking-[0.04em]"
              >
                <span className="shrink-0 text-(--fg)">{row.key}</span>
                <span className="flex-1 truncate text-right text-(--faint)">
                  {row.what}
                </span>
                <span className={`shrink-0 ${TONE[row.tone]}`}>
                  {row.verdict}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/* — The laws ————————————————————————————————————————————————————
   The same texts, at the same addresses, as the law list under the globe
   (GlobalCorridors): the Journal Officiel's French edition, opened at the
   page each text starts on. Repeated rather than imported because that
   list is private to its section; the issue and page numbers below are
   copied from it, not looked up again. */

export type Law = {
  no: string;
  kind?: "Regulation";
  subject: string;
  year: string;
  href: string;
  amended?: { no: string; year: string; href: string };
};

export const LAWS = {
  "23-09": {
    no: "23-09",
    subject: "Monetary and banking law",
    year: "2023",
    href: JO(2023, 43, 4),
  },
  "25-02": {
    no: "25-02",
    kind: "Regulation",
    subject: "Payment service providers · Banque d'Algérie",
    year: "2025",
    href: JO(2025, 28, 20),
  },
  "18-05": {
    no: "18-05",
    subject: "Electronic commerce",
    year: "2018",
    href: JO(2018, 28, 4),
  },
  "05-01": {
    no: "05-01",
    subject: "Money laundering and terrorist financing",
    year: "2005",
    href: JO(2005, 11, 3),
    amended: { no: "23-01", year: "2023", href: JO(2023, 8, 6) },
  },
  "18-07": {
    no: "18-07",
    subject: "Protection of personal data",
    year: "2018",
    href: JO(2018, 34, 10),
    amended: { no: "25-11", year: "2025", href: JO(2025, 48, 14) },
  },
} satisfies Record<string, Law>;

/** The globe's law list, row for row: number and year on one line, what
 *  the text governs beneath, an amendment hung from the law it amends.
 *  `bears` is the page's own line on what each text means for this
 *  service. */
export function LawList({
  laws,
}: {
  laws: { law: Law; bears: string }[];
}) {
  return (
    <div>
      <ul
        className={`grid gap-x-10 border-t border-(--line) sm:grid-cols-2 ${
          laws.length === 3 ? "lg:grid-cols-3" : ""
        }`}
      >
        {laws.map(({ law, bears }) => (
          <li key={law.no} className="border-b border-(--line) py-6" data-fade>
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
            <p className="mt-5 max-w-[40ch] text-[0.9rem] leading-relaxed text-(--muted)">
              {bears}
            </p>
          </li>
        ))}
      </ul>
      <p
        data-fade
        className="type-label mt-10 max-w-3xl text-[0.625rem] leading-relaxed text-(--faint)"
      >
        Each text opens in the Journal Officiel of the République Algérienne,
        in its French edition, at the page it starts on. They name the
        framework the platform is being built for; they are not a licence or
        a certification.
      </p>
    </div>
  );
}
