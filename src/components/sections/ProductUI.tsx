import { ACCOUNTS, EVENTS, TRANSACTIONS, type TxStatus } from "@/lib/data";

function Sparkline({ points }: { points: readonly number[] }) {
  const max = Math.max(...points);
  const d = points
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"} ${(i * 60) / (points.length - 1)} ${19 - (v / max) * 16}`,
    )
    .join(" ");
  return (
    <svg viewBox="0 0 60 20" className="h-5 w-[60px]" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        className="text-signal"
      />
    </svg>
  );
}

function StatusChip({ status }: { status: TxStatus }) {
  const skin =
    status === "Settled"
      ? "bg-positive/10 text-positive"
      : status === "Pending"
        ? "bg-ink/6 text-ink/60"
        : "bg-signal/10 text-signal-deep";
  return (
    <span
      className={`inline-block rounded-[3px] px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.06em] whitespace-nowrap uppercase ${skin}`}
    >
      {status === "Approval" ? "Needs approval" : status}
    </span>
  );
}

const NAV_ITEMS = [
  "Overview",
  "Accounts",
  "Payments",
  "FX",
  "Cards",
  "Approvals",
  "Developers",
];

/**
 * The product itself: a treasury workspace rendered in real DOM so it
 * stays crisp through the camera moves. Panels carry `data-panel` handles
 * for the scroll choreography; key rows carry `data-row` handles.
 */
export default function ProductUI() {
  return (
    <div
      data-product-frame
      className="relative w-full min-w-[880px] rounded-[6px] border border-ink/10 bg-[#f7f5f0] text-ink shadow-[0_60px_120px_-60px_rgba(10,10,11,0.5)]"
      role="img"
      aria-label="Pixely treasury workspace: accounts, payments, FX and controls in one view"
    >
      <div className="flex" style={{ transformStyle: "preserve-3d" }}>
        {/* — Sidebar */}
        <aside
          data-panel="sidebar"
          className="flex w-[196px] shrink-0 flex-col justify-between rounded-l-[6px] border-r border-ink/8 bg-[#fbfaf7] p-4"
        >
          <div>
            <div className="flex items-center gap-2 px-1">
              <svg width="15" height="15" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9.5" stroke="currentColor" strokeWidth="2" />
                <line x1="11" y1="0" x2="11" y2="22" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="type-headline text-[0.7rem]">Pixely</span>
            </div>
            <div aria-hidden className="mt-5 flex flex-col gap-0.5">
              {NAV_ITEMS.map((item, i) => (
                <span
                  key={item}
                  className={`rounded-[4px] px-2.5 py-1.5 text-[11.5px] font-medium ${
                    i === 0
                      ? "bg-ink/85 text-bone"
                      : "text-ink/62 hover:bg-ink/4"
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="border-t border-ink/8 px-1 pt-3">
            <p className="text-[11px] font-semibold">Helio Systems Inc.</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] text-ink/50 uppercase">
              <span className="inline-block size-1.5 rounded-full bg-positive" />
              Production
            </p>
          </div>
        </aside>

        {/* — Main column */}
        <div className="min-w-0 flex-1" style={{ transformStyle: "preserve-3d" }}>
          <div
            data-panel="topbar"
            className="flex items-center justify-between gap-4 border-b border-ink/8 bg-[#fbfaf7] px-5 py-2.5"
          >
            <p className="text-[12px] text-ink/55">
              Treasury <span className="mx-1 text-ink/30">/</span>
              <span className="font-medium text-ink">Overview</span>
            </p>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-6 rounded-[4px] border border-ink/10 bg-white/70 px-2.5 py-1 text-[11px] text-ink/45">
                Search
                <kbd className="font-mono text-[9px] text-ink/35">⌘K</kbd>
              </span>
              <span
                data-ui="new-payment"
                className="rounded-[4px] bg-signal px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                New payment
              </span>
            </div>
          </div>

          <div
            className="grid grid-cols-[minmax(0,1fr)_272px]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="min-w-0 p-4" style={{ transformStyle: "preserve-3d" }}>
              {/* — Balances */}
              <div data-panel="balances" className="grid grid-cols-3 gap-3">
                {ACCOUNTS.map((acct) => (
                  <div
                    key={acct.name}
                    className="rounded-[5px] border border-ink/8 bg-[#fdfcfa] p-3"
                  >
                    <div className="flex items-baseline justify-between">
                      <p className="text-[11px] font-semibold">{acct.name}</p>
                      <p className="font-mono text-[9px] text-ink/40">
                        {acct.number}
                      </p>
                    </div>
                    <p
                      data-ui={acct.name === "USD Operating" ? "usd-balance" : undefined}
                      className="type-mono mt-2.5 text-[15px] font-medium tracking-[-0.02em] whitespace-nowrap"
                    >
                      {acct.balance}
                    </p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="font-mono text-[9px] tracking-[0.08em] text-ink/45 uppercase">
                        {acct.rail}
                      </p>
                      <Sparkline points={acct.spark} />
                    </div>
                  </div>
                ))}
              </div>

              {/* — Transactions */}
              <div
                data-panel="table"
                className="mt-3 overflow-hidden rounded-[5px] border border-ink/8 bg-[#fdfcfa]"
              >
                <div className="flex items-center justify-between border-b border-ink/7 px-3.5 py-2">
                  <p className="text-[11px] font-semibold">Latest activity</p>
                  <p className="font-mono text-[9px] tracking-[0.1em] text-ink/40 uppercase">
                    Live · streaming
                  </p>
                </div>
                <table className="w-full text-[11.5px]">
                  <thead>
                    <tr className="border-b border-ink/6 text-left font-mono text-[9px] tracking-[0.1em] text-ink/40 uppercase">
                      <th className="py-1.5 pl-3.5 font-normal">Counterparty</th>
                      <th className="font-normal">Ref</th>
                      <th className="font-normal">Rail</th>
                      <th className="text-right font-normal">Amount</th>
                      <th className="py-1.5 pr-3.5 pl-4 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TRANSACTIONS.map((tx) => (
                      <tr
                        key={tx.ref}
                        data-row={tx.ref}
                        className="border-b border-ink/5 last:border-0"
                      >
                        <td className="py-[7px] pl-3.5 font-medium">
                          {tx.party}
                        </td>
                        <td className="font-mono text-[10px] text-ink/50">
                          {tx.ref}
                        </td>
                        <td>
                          <span className="rounded-[3px] border border-ink/10 px-1 py-px font-mono text-[9px] text-ink/55">
                            {tx.rail}
                          </span>
                        </td>
                        <td
                          className={`type-mono pr-0 text-right text-[11px] font-medium ${
                            tx.negative ? "text-ink/75" : "text-positive"
                          }`}
                        >
                          {tx.amount}
                        </td>
                        <td className="py-[7px] pr-3.5 pl-4">
                          <StatusChip status={tx.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* — Side rail */}
            <div
              data-panel="side"
              className="flex flex-col gap-3 border-l border-ink/8 bg-[#faf9f5] p-4"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                data-panel="fx"
                className="rounded-[5px] border border-ink/8 bg-[#fdfcfa] p-3"
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-[11px] font-semibold">FX — EUR → USD</p>
                  <p className="font-mono text-[9px] text-positive">MID</p>
                </div>
                <p className="type-mono mt-2 text-[20px] font-medium">1.0842</p>
                <div className="mt-2 space-y-1 border-t border-ink/6 pt-2 font-mono text-[9.5px] text-ink/55">
                  <div className="flex justify-between">
                    <span>Convert</span>
                    <span>€250,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>You receive</span>
                    <span className="text-ink">$271,050.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Locked for</span>
                    <span>28s</span>
                  </div>
                </div>
              </div>

              <div
                data-panel="approvals"
                className="rounded-[5px] border border-ink/8 bg-[#fdfcfa] p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold">Approvals</p>
                  <span className="rounded-full bg-signal/10 px-1.5 font-mono text-[9px] text-signal-deep">
                    1 open
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-ink/70">
                  Payroll run 2026-08 · £184,220.40
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="h-1 flex-1 rounded-full bg-signal/80" />
                  <span className="h-1 flex-1 rounded-full bg-signal/80" />
                  <span className="h-1 flex-1 rounded-full bg-ink/10" />
                  <span className="ml-1 font-mono text-[9px] text-ink/50">
                    2 of 3
                  </span>
                </div>
                <p className="mt-2 font-mono text-[9px] tracking-[0.06em] text-ink/45 uppercase">
                  Policy: payouts &gt; £50k
                </p>
              </div>

              <div
                data-panel="events"
                // A dark panel inside a light chapter: the cursor has to
                // ignore the section theme and stay light over it.
                data-cursor-theme="ink"
                className="flex-1 rounded-[5px] border border-ink/8 bg-ink p-3 text-bone/80"
              >
                <p className="mb-2 flex items-center justify-between font-mono text-[9px] tracking-[0.1em] text-bone/45 uppercase">
                  Event stream
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-signal" />
                </p>
                <div className="space-y-1.5 font-mono text-[8.5px] leading-relaxed whitespace-pre text-bone/65">
                  {EVENTS.map((line) => (
                    <p key={line} data-event-line>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
