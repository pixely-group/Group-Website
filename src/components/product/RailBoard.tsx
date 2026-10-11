/**
 * The rails a payment can leave by, as a board rather than a map: one row
 * per rail, each its own hairline with its own traffic, the way the
 * Platform dropdown draws its three roads at their own speeds. The names
 * and what each rail is for are the site's own (lib/data, the security
 * section's rail layer); nothing here says how fast any of them is.
 */

const RAILS = [
  {
    name: "Book",
    kind: "Inside the platform",
    body: "Between two accounts on Pixely, a payment is a pair of entries on one ledger. There is no rail to wait for.",
    dur: 2.4,
  },
  {
    name: "ARTS",
    kind: "Real-time gross settlement",
    body: "Large-value payments between banks, settled one at a time and in real time rather than netted at the end of the day.",
    dur: 3.2,
  },
  {
    name: "ATCI",
    kind: "Interbank clearing",
    body: "The everyday payments that pass between Algerian banks — transfers, collections and card payments — cleared on the national system.",
    dur: 3.8,
  },
  {
    name: "SWIFT",
    kind: "Cross-border",
    body: "Payments that leave the country, on the network banks use to message each other worldwide, with the foreign leg on the same record.",
    dur: 4.6,
  },
] as const;

export default function RailBoard() {
  return (
    <ol className="glyph-stage border-t border-(--line-strong)">
      {RAILS.map((rail, i) => (
        <li
          key={rail.name}
          data-fade
          className="grid gap-x-10 gap-y-4 border-b border-(--line) py-7 lg:grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,5fr)] lg:items-center"
        >
          <div className="flex items-baseline gap-4">
            <span className="type-label text-(--faint)">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="type-headline text-[1.5rem] leading-none tracking-[-0.02em]">
                {rail.name}
              </h3>
              <p className="type-label mt-3 text-(--muted)">{rail.kind}</p>
            </div>
          </div>

          {/* The rail itself: a route, a pulse on it, a stop at the far
              end. Each at its own speed, so the board has traffic rather
              than a current. */}
          <div aria-hidden className="flex items-center gap-3">
            <span className="size-[9px] shrink-0 bg-accent" />
            <svg
              className="h-[3px] flex-1"
              viewBox="0 0 100 3"
              preserveAspectRatio="none"
            >
              <line
                x1="0"
                y1="1.5"
                x2="100"
                y2="1.5"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.25"
                vectorEffect="non-scaling-stroke"
              />
              <line
                className="glyph-flow"
                x1="0"
                y1="1.5"
                x2="100"
                y2="1.5"
                pathLength={100}
                strokeDasharray="14 86"
                stroke="var(--accent)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                style={
                  {
                    "--delay": `${i * 0.6}s`,
                    "--dur": `${rail.dur}s`,
                  } as React.CSSProperties
                }
              />
            </svg>
            <span className="relative size-[9px] shrink-0 border border-(--line-strong)" />
          </div>

          <p className="max-w-[48ch] text-[0.9rem] leading-relaxed text-(--muted)">
            {rail.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
