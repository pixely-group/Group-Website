/**
 * What a call to the platform is designed to look like — and only that. The
 * API is not published, so the sample is labelled illustrative above and
 * below: no endpoint here is a promise, and no name in it is a contract.
 *
 * Set in the site's mono, in the event stream's own dark panel: request
 * first, then the events the ledger would emit for it, written the way the
 * front page's workspace writes them.
 */

type Tok = [text: string, tone?: "key" | "str" | "accent" | "faint"];

const TONE: Record<NonNullable<Tok[1]>, string> = {
  key: "text-bone/85",
  str: "text-bone/55",
  accent: "text-signal",
  faint: "text-bone/35",
};

const REQUEST: Tok[][] = [
  [["POST", "accent"], [" /v1/payments"]],
  [["Idempotency-Key: ", "faint"], ["run-2026-08-payroll", "str"]],
  [],
  [["{"]],
  [["  \"from\"", "key"], [": "], ["\"acct_dzd_payroll\"", "str"], [","]],
  [["  \"rail\"", "key"], [": "], ["\"auto\"", "str"], [","]],
  [["  \"reference\"", "key"], [": "], ["\"RUN-2026-08\"", "str"], [","]],
  [["  \"approvals\"", "key"], [": "], ["\"policy\"", "str"]],
  [["}"]],
];

const EVENTS: Tok[][] = [
  [["evt ", "faint"], ["payment.initiated", "key"], ["         atci", "str"]],
  [["evt ", "faint"], ["policy.approval.required", "key"], ["  payroll", "str"]],
  [["evt ", "faint"], ["policy.approval.granted", "key"], ["   payroll", "str"]],
  [["evt ", "faint"], ["ledger.debit.posted", "key"], ["       dzd_payroll", "str"]],
  [["evt ", "faint"], ["payment.settled", "key"], ["           atci", "str"]],
];

function Lines({ lines }: { lines: Tok[][] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="block min-h-[1.7em]">
          {line.map(([text, tone], j) => (
            <span key={j} className={tone ? TONE[tone] : "text-bone/70"}>
              {text}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

export default function CodeSample() {
  return (
    <figure
      data-cursor-theme="ink"
      className="overflow-hidden rounded-(--radius-panel) border border-bone/10 bg-[#111114]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-bone/10 px-5 py-3">
        <p className="type-label text-[0.625rem] text-bone/45">Request</p>
        <p className="type-label flex items-center gap-2 text-[0.625rem] text-bone/45">
          <span aria-hidden className="size-[6px] bg-accent" />
          Illustrative
        </p>
      </div>
      <pre className="overflow-x-auto px-5 py-5 font-mono text-[0.78rem] leading-[1.7]">
        <code>
          <Lines lines={REQUEST} />
        </code>
      </pre>
      <div className="border-t border-bone/10 px-5 py-3">
        <p className="type-label text-[0.625rem] text-bone/45">
          Events, in order
        </p>
      </div>
      <pre className="overflow-x-auto px-5 py-5 font-mono text-[0.72rem] leading-[1.7]">
        <code>
          <Lines lines={EVENTS} />
        </code>
      </pre>
      <figcaption className="border-t border-bone/10 px-5 py-3 text-[0.75rem] leading-relaxed text-bone/45">
        A sketch of the shape the API is being designed to, not a published
        endpoint. The reference comes with developer access.
      </figcaption>
    </figure>
  );
}
