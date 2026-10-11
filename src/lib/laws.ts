/**
 * The Algerian legal framework Pixely is built for: every law the site
 * cites, in one list. The globe's strip, the Legal framework page and the
 * product, solution and platform pages all read it, so a law is cited the
 * same way everywhere and corrected in one place.
 *
 * Each link goes to the Journal Officiel itself, the official gazette
 * published by the Secrétariat Général du Gouvernement at joradp.dz: the
 * French edition of the issue the text appeared in, opened at the page it
 * starts on. Every issue, date and page here was read off the issue's own
 * text, not inferred from the URL pattern.
 */

export const JO = (year: number, issue: number, page: number) =>
  `https://www.joradp.dz/FTP/jo-francais/${year}/F${year}${String(issue).padStart(3, "0")}.pdf#page=${page}`;

export type Gazette = { issue: number; date: string; page: number };

export type Law = {
  no: string;
  kind?: "Regulation";
  subject: string;
  year: string;
  href: string;
  /** The day the text was made. */
  made: string;
  gazette: Gazette;
  /** What it governs, in a sentence. */
  about: string;
  amended?: {
    no: string;
    year: string;
    href: string;
    made: string;
    gazette: Gazette;
  };
};

export type Pillar = { value: string; label: string; body: string; laws: Law[] };

export const PILLARS: Pillar[] = [
  {
    value: "Payments",
    label: "Real time, not overnight",
    body: "Person to person, business and merchant payments settle as they happen — not gathered into a nightly batch and cleared the next working day.",
    laws: [
      {
        no: "23-09",
        subject: "Monetary and banking law",
        year: "2023",
        href: JO(2023, 43, 4),
        made: "21 June 2023",
        gazette: { issue: 43, date: "27 June 2023", page: 4 },
        about:
          "The law that governs money and credit in Algeria: the Banque d'Algérie, the banks and financial establishments, and the payment services they provide.",
      },
      {
        no: "25-02",
        kind: "Regulation",
        subject: "Payment service providers · Banque d'Algérie",
        year: "2025",
        href: JO(2025, 28, 20),
        made: "14 April 2025",
        gazette: { issue: 28, date: "7 May 2025", page: 20 },
        about:
          "The Banque d'Algérie's rules for the authorisation, licensing and operation of payment service providers.",
      },
      {
        no: "18-05",
        subject: "Electronic commerce",
        year: "2018",
        href: JO(2018, 28, 4),
        made: "10 May 2018",
        gazette: { issue: 28, date: "16 May 2018", page: 4 },
        about:
          "The general rules for electronic commerce: what anyone selling online owes the buyer, how a contract is made on a screen, and how it is paid for.",
      },
    ],
  },
  {
    value: "Identity",
    label: "Proved once, trusted after",
    body: "A person or a business proves who they are once — document, face and signature — and every service on the platform can rely on it after.",
    laws: [
      {
        no: "15-04",
        subject: "Electronic signature and certification",
        year: "2015",
        href: JO(2015, 6, 6),
        made: "1 February 2015",
        gazette: { issue: 6, date: "10 February 2015", page: 6 },
        about:
          "The general rules for electronic signature and certification: when a signature made electronically carries legal weight, and who may certify it.",
      },
    ],
  },
  {
    value: "Compliance",
    label: "Regulatory-ready by construction",
    body: "Anti-money-laundering checks, risk scoring and an audit trail run inside each transaction, rather than being reconciled after it.",
    laws: [
      {
        no: "05-01",
        subject: "Money laundering and terrorist financing",
        year: "2005",
        href: JO(2005, 11, 3),
        made: "6 February 2005",
        gazette: { issue: 11, date: "9 February 2005", page: 3 },
        about:
          "The prevention of and fight against money laundering and terrorist financing: the duties of vigilance, verification and reporting that fall on those who handle funds.",
        amended: {
          no: "23-01",
          year: "2023",
          href: JO(2023, 8, 6),
          made: "7 February 2023",
          gazette: { issue: 8, date: "8 February 2023", page: 6 },
        },
      },
    ],
  },
  {
    value: "Algeria",
    label: "Where it is being built",
    body: "Built in Algeria, for Algeria. Personal data stays under Algerian law, and leaves the country only with the national authority's authorisation.",
    laws: [
      {
        no: "18-07",
        subject: "Protection of personal data",
        year: "2018",
        href: JO(2018, 34, 10),
        made: "10 June 2018",
        gazette: { issue: 34, date: "10 June 2018", page: 10 },
        about:
          "The protection of individuals in the processing of their personal data, overseen by a national authority — whose authorisation a transfer abroad requires (article 44).",
        amended: {
          no: "25-11",
          year: "2025",
          href: JO(2025, 48, 14),
          made: "24 July 2025",
          gazette: { issue: 48, date: "24 July 2025", page: 14 },
        },
      },
    ],
  },
];

/** Every text by its number, for a page that cites one or two. */
export const LAWS: Record<string, Law> = Object.fromEntries(PILLARS.flatMap((p) => p.laws).map((l) => [l.no, l]));
