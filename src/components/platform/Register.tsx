/**
 * A register: a short list whose order or whose names matter enough to be
 * read across, row by row — the five security layers, the rails. Set the
 * way SecurityArchitecture sets its own register: an index, a name in the
 * display face, the specification in the mono label, and one sentence on
 * what the row is for. Hairline-ruled, each rule drawing open as the scroll
 * arrives, like the chapter grammar's other lists.
 *
 * The index carries the drawings' junction — an outlined square that
 * breathes on the shared clock — so a register reads as stops on a line
 * rather than as a table.
 */
export default function Register({
  rows,
}: {
  rows: { index: string; name: string; spec: string; note: string }[];
}) {
  return (
    <ol className="glyph-stage border-b border-(--line)">
      {rows.map((row, i) => (
        <li key={row.index}>
          <span
            aria-hidden
            data-draw
            className="block h-px w-full bg-(--line-strong)"
          />
          <div
            data-fade
            className="grid gap-x-10 gap-y-3 py-7 sm:grid-cols-[6.5rem_minmax(0,1fr)] lg:grid-cols-[6.5rem_minmax(0,4fr)_minmax(0,4fr)_minmax(0,5fr)] lg:items-baseline"
          >
            <p className="type-label flex items-center gap-3 text-(--muted)">
              <svg aria-hidden width="9" height="9" viewBox="0 0 9 9" className="shrink-0 text-(--fg)">
                <rect
                  className="glyph-node"
                  x="0.5"
                  y="0.5"
                  width="8"
                  height="8"
                  fill="none"
                  stroke="currentColor"
                  opacity="0.6"
                  style={{ "--i": i } as React.CSSProperties}
                />
              </svg>
              {row.index}
            </p>
            <h3 className="type-headline text-[clamp(1.35rem,2.2vw,1.9rem)]">
              {row.name}
            </h3>
            <p className="type-label leading-relaxed text-(--muted) sm:col-start-2 lg:col-start-auto">
              {row.spec}
            </p>
            <p className="max-w-[44ch] text-[0.9rem] leading-relaxed text-(--muted) sm:col-start-2 lg:col-start-auto">
              {row.note}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
