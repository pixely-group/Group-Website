/** Fabricated-but-believable product data for the dashboard composition. */

export const ACCOUNTS = [
  {
    name: "USD Operating",
    number: "•• 4021",
    balance: "$4,208,116.09",
    delta: "+1.8%",
    rail: "Fedwire · RTP",
    spark: [4, 9, 6, 11, 8, 14, 12, 18, 15, 21],
  },
  {
    name: "EUR Treasury",
    number: "•• 8817",
    balance: "€1,912,004.55",
    delta: "+0.4%",
    rail: "SEPA Instant",
    spark: [12, 10, 13, 9, 12, 11, 14, 13, 16, 15],
  },
  {
    name: "GBP Payroll",
    number: "•• 2203",
    balance: "£402,318.27",
    delta: "—",
    rail: "FPS",
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
    party: "Northwind Labs",
    ref: "INV-20841",
    rail: "RTP",
    amount: "+$48,500.00",
    status: "Settled",
  },
  {
    party: "Arc Manufacturing",
    ref: "PO-1174",
    rail: "Fedwire",
    amount: "−$212,000.00",
    status: "Settled",
    negative: true,
  },
  {
    party: "Helio Systems GmbH",
    ref: "FX-EUR-0392",
    rail: "SEPA",
    amount: "−€250,000.00",
    status: "Pending",
    negative: true,
  },
  {
    party: "Vantage Logistics",
    ref: "INV-20802",
    rail: "Book",
    amount: "+$9,340.11",
    status: "Settled",
  },
  {
    party: "Pixely Payroll",
    ref: "RUN-2026-08",
    rail: "FPS",
    amount: "−£184,220.40",
    status: "Approval",
    negative: true,
  },
  {
    party: "Quarry Data Co.",
    ref: "INV-20777",
    rail: "RTP",
    amount: "+$27,904.60",
    status: "Settled",
  },
];

export const EVENTS = [
  "evt_8fk2q1 ledger.credit.posted        usd_op   +48,500.00",
  "evt_8fk2q0 payment.settled             rtp      184 ms",
  "evt_8fk2pz fx.quote.locked             eurusd   1.0842",
  "evt_8fk2py policy.approval.required    payroll  2-of-3",
  "evt_8fk2px payment.initiated           sepa     250,000.00",
] as const;

export const STAGES = [
  {
    index: "01",
    key: "ledger",
    title: "Ledger",
    heading: "One ledger, current to the millisecond.",
    body: "Every account, every entry, every event — a single source of truth your systems subscribe to, not reconcile against.",
  },
  {
    index: "02",
    key: "payments",
    title: "Payments",
    heading: "The fastest rail that clears, chosen for you.",
    body: "RTP, SEPA Instant, Fedwire, FPS or internal book transfer — Pixely routes each payment and settles most in under a second.",
  },
  {
    index: "03",
    key: "fx",
    title: "FX",
    heading: "Mid-market conversion, locked at settlement.",
    body: "Thirty-eight liquidity venues behind one quote. The rate you see is the rate that clears — spreads are a line item, not a mystery.",
  },
  {
    index: "04",
    key: "controls",
    title: "Controls",
    heading: "Policy approves before people have to.",
    body: "Limits, allowlists and n-of-m approvals travel with every dollar. Auditors get an immutable event log, not a spreadsheet.",
  },
] as const;
