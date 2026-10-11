import DocLink from "@/components/ui/DocLink";
import type { Gazette, Law } from "@/components/company/laws";

/**
 * One pillar's texts, set as a register: each law on its own hairline-ruled
 * row — the number in the display voice, what it governs beside it, and
 * where it was published as the link to the text itself. An amendment is a
 * row of its own hung from the law it amends by a rule at its left, as the
 * strip under the globe hangs it, because the number a reader will look up
 * is the original's.
 */

const cite = (g: Gazette) =>
  `Journal Officiel no. ${g.issue} · ${g.date} · p. ${g.page}`;

export default function LawLedger({ laws }: { laws: Law[] }) {
  return (
    <ol>
      {laws.map((law) => (
        <li key={law.no}>
          <span
            aria-hidden
            data-draw
            className="block h-px w-full bg-(--line-strong)"
          />
          <div
            data-fade
            className="grid gap-x-10 gap-y-5 pt-7 pb-12 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:grid-cols-[minmax(0,3fr)_minmax(0,6fr)_minmax(0,3fr)]"
          >
            <div>
              <p className="type-label text-(--faint)">
                {law.kind ?? "Law"} · {law.year}
              </p>
              <h3 className="type-display mt-3 text-[clamp(2.6rem,5.4vw,4.6rem)] leading-[0.9] tracking-[-0.02em]">
                {law.no}
              </h3>
            </div>
            <div>
              <p className="type-label text-(--fg)">{law.subject}</p>
              <p className="mt-3 max-w-[52ch] leading-relaxed text-(--muted)">
                {law.about}
              </p>
              <p className="type-label mt-4 text-(--faint)">
                Made {law.made}
              </p>
            </div>
            <div className="text-[0.9rem] md:col-start-2 lg:col-start-auto lg:pt-[1.35rem] lg:text-right">
              <DocLink href={law.href}>{cite(law.gazette)}</DocLink>
            </div>

            {law.amended && (
              <div className="ml-1 border-l border-(--line) pl-5 md:col-start-2 lg:col-span-2 lg:col-start-2">
                <div className="flex flex-col gap-y-3 lg:flex-row lg:items-baseline lg:justify-between lg:gap-x-10">
                  <div>
                    <p className="type-label text-(--faint)">
                      Amended by · {law.amended.year}
                    </p>
                    <p className="type-headline mt-2 text-[1.5rem] leading-none">
                      Law no. {law.amended.no}
                    </p>
                    <p className="mt-3 text-[0.9rem] leading-relaxed text-(--muted)">
                      Amends law no. {law.no}. Made{" "}
                      {law.amended.made}.
                    </p>
                  </div>
                  <div className="text-[0.9rem] lg:text-right">
                    <DocLink href={law.amended.href}>
                      {cite(law.amended.gazette)}
                    </DocLink>
                  </div>
                </div>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
