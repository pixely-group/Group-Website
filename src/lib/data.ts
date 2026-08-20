/** Fabricated-but-believable product data for the dashboard composition.
 *
 *  Pixely is an Algerian platform, so the workspace is an Algerian importer's:
 *  dinar accounts for operating and payroll, one euro account for the supplier
 *  side, and the rails the country actually clears on — ARTS for real-time
 *  gross settlement, ATCI for interbank clearing, SWIFT for cross-border.
 *
 *  Amounts follow the local convention the wallet already uses: space
 *  thousands, comma decimals. The dinar is the base currency and carries no
 *  marker; only foreign amounts take a symbol, so a € in this data always
 *  means the money left the country.
 */

export const ACCOUNTS = [
  {
    name: "DZD Operating",
    number: "•• 4021",
    balance: "4 208 116,09",
    delta: "+1.8%",
    rail: "ARTS · ATCI",
    spark: [4, 9, 6, 11, 8, 14, 12, 18, 15, 21],
  },
  {
    name: "EUR Trade",
    number: "•• 8817",
    balance: "€1 912 004,55",
    delta: "+0.4%",
    rail: "SWIFT",
    spark: [12, 10, 13, 9, 12, 11, 14, 13, 16, 15],
  },
  {
    name: "DZD Payroll",
    number: "•• 2203",
    balance: "402 318,27",
    delta: "—",
    rail: "ATCI",
    spark: [8, 8, 9, 8, 9, 9, 8, 9, 9, 10],
  },
] as const;

export type TxStatus = "Settled" | "Pending" | "Approval";

export const TRANSACTIONS: {
  party: string;
  ref: string;
  rail: string;
  amount: string;
  status: TxStatus;
  negative?: boolean;
}[] = [
  {
    party: "Atlas Agro SPA",
    ref: "INV-20841",
    rail: "ATCI",
    amount: "+4 850 000,00",
    status: "Settled",
  },
  {
    party: "Hodna Manufacturing",
    ref: "PO-1174",
    rail: "ARTS",
    amount: "−21 200 000,00",
    status: "Settled",
    negative: true,
  },
  {
    /* The one payment that leaves the country, and the row the FX and
       payments stages both point at — its ref is matched in globals.css and
       in ProductExperience's pulse targets, so it stays put. */
    party: "Rheinwerk GmbH",
    ref: "FX-EUR-0392",
    rail: "SWIFT",
    amount: "−€250 000,00",
    status: "Pending",
    negative: true,
  },
  {
    party: "Sahel Logistics",
    ref: "INV-20802",
    rail: "Book",
    amount: "+934 011,45",
    status: "Settled",
  },
  {
    /* Likewise pinned: the controls stage pulses to RUN-2026-08. */
    party: "Pixely Payroll",
    ref: "RUN-2026-08",
    rail: "ATCI",
    amount: "−18 422 040,00",
    status: "Approval",
    negative: true,
  },
  {
    party: "Casbah Data Co.",
    ref: "INV-20777",
    rail: "ARTS",
    amount: "+2 790 460,60",
    status: "Settled",
  },
];

export const EVENTS = [
  "evt_8fk2q1 ledger.credit.posted        dzd_op   +4 850 000,00",
  "evt_8fk2q0 payment.settled             arts     confirmed",
  "evt_8fk2pz fx.quote.locked             eurdzd   147.2040",
  "evt_8fk2py policy.approval.required    payroll  2-of-3",
  "evt_8fk2px payment.initiated           swift    250 000,00",
] as const;

export const STAGES = [
  {
    index: "01",
    key: "payments",
    title: "Payments",
    heading: "Real-time payments, transfers and collections.",
    body: "Person to person, business to business, and merchant collection — cleared in real time rather than batched overnight.",
  },
  {
    index: "02",
    key: "identity",
    title: "Identity",
    heading: "Proved once, trusted everywhere after.",
    body: "Digital identity verification, eKYC and KYB, and authentication built so a customer proves who they are once rather than at every counter.",
  },
  {
    index: "03",
    key: "ai",
    title: "Intelligence",
    heading: "Fraud caught before the money leaves.",
    body: "Fraud detection, intelligent automation and AI-assisted decisioning, running on the same platform that moves the payment.",
  },
  {
    index: "04",
    key: "compliance",
    title: "Compliance",
    heading: "Regulatory-ready by construction.",
    body: "Compliance, risk management and audit-ready reporting built into the platform rather than assembled afterwards.",
  },
] as const;
