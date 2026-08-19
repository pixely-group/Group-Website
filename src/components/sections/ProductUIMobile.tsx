import { ACCOUNTS, TRANSACTIONS } from "@/lib/data";

/**
 * Phone rendition of the workspace. Not the desktop frame scaled down —
 * at 375px that would render 11px type at roughly 4px. This is the same
 * product composed for a narrow column.
 */
export default function ProductUIMobile() {
  const [usd, eur, gbp] = ACCOUNTS;

  return (
    <div
      className="w-full overflow-hidden rounded-(--radius-panel) border border-ink/10 bg-[#f7f5f0] text-ink shadow-[0_40px_80px_-50px_rgba(10,10,11,0.5)]"
      role="img"
      aria-label="Znapy treasury workspace on mobile: balances, activity, FX and an open approval"
    >
      <div className="flex items-center justify-between border-b border-ink/8 bg-[#fbfaf7] px-4 py-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9.5" stroke="currentColor" strokeWidth="2" />
            <line x1="11" y1="0" x2="11" y2="22" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="type-headline text-[0.68rem]">Treasury</span>
        </div>
        <span className="rounded-(--radius-mock) bg-signal px-2.5 py-1 text-[10px] font-semibold text-white">
          New payment
        </span>
      </div>

      <div className="p-4">
        <p className="font-mono text-[9px] tracking-[0.12em] text-ink/45 uppercase">
          {usd.name} · {usd.number}
        </p>
        <p className="type-mono mt-1.5 text-[1.6rem] leading-none font-medium tracking-[-0.03em]">
          {usd.balance}
        </p>
        <p className="mt-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.08em] text-ink/50 uppercase">
          <span className="text-positive">{usd.delta}</span> · {usd.rail}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {[eur, gbp].map((acct) => (
            <div
              key={acct.name}
              className="rounded-(--radius-mock) border border-ink/8 bg-[#fdfcfa] p-2.5"
            >
              <p className="font-mono text-[8.5px] tracking-[0.1em] text-ink/45 uppercase">
                {acct.name}
              </p>
              <p className="type-mono mt-1 text-[12px] font-medium">
                {acct.balance}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-(--radius-mock) border border-ink/8 bg-[#fdfcfa]">
          <p className="flex items-center justify-between border-b border-ink/7 px-3 py-2 text-[10.5px] font-semibold">
            Latest activity
            <span className="font-mono text-[8.5px] font-normal tracking-[0.1em] text-ink/40 uppercase">
              Live
            </span>
          </p>
          <ul>
            {TRANSACTIONS.slice(0, 4).map((tx) => (
              <li
                key={tx.ref}
                className="flex items-center justify-between gap-3 border-b border-ink/5 px-3 py-2.5 last:border-0"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-medium">
                    {tx.party}
                  </span>
                  <span className="mt-0.5 block font-mono text-[8.5px] tracking-[0.06em] text-ink/45 uppercase">
                    {tx.rail} · {tx.status}
                  </span>
                </span>
                <span
                  className={`type-mono shrink-0 text-[11px] font-medium ${
                    tx.negative ? "text-ink/75" : "text-positive"
                  }`}
                >
                  {tx.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-(--radius-mock) border border-ink/8 bg-[#fdfcfa] p-3">
            <p className="text-[10px] font-semibold">EUR → USD</p>
            <p className="type-mono mt-1.5 text-[15px] font-medium">1.0842</p>
            <p className="mt-1 font-mono text-[8.5px] tracking-[0.08em] text-ink/45 uppercase">
              Mid · locked 28s
            </p>
          </div>
          <div className="rounded-(--radius-mock) border border-ink/8 bg-[#fdfcfa] p-3">
            <p className="flex items-center justify-between text-[10px] font-semibold">
              Approvals
              <span className="rounded-full bg-signal/10 px-1.5 font-mono text-[8.5px] text-signal-deep">
                1
              </span>
            </p>
            <p className="mt-1.5 text-[10px] leading-snug text-ink/70">
              Payroll · £184,220.40
            </p>
            <div className="mt-2 flex items-center gap-1">
              <span className="h-1 flex-1 rounded-full bg-signal/80" />
              <span className="h-1 flex-1 rounded-full bg-signal/80" />
              <span className="h-1 flex-1 rounded-full bg-ink/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
