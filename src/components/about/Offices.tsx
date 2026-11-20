"use client";

import { useEffect, useState } from "react";

import DocLink from "@/components/ui/DocLink";
import { OFFICES, type Office } from "@/lib/company";

/**
 * The company, set as a typographic card — the city in the display voice,
 * its local time kept like the footer's clocks, and the particulars ruled
 * off in hairlines, as an envelope or a register would print them. Every
 * fact comes from lib/company; nothing on this card is typed here. The
 * cards divide into columns only when there is more than one office.
 */

/** HH:MM in the office's own zone. Blank on the server and filled after
 *  mount, so the server's markup and the first client paint agree. */
function useLocalTime(tz: string) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [tz]);
  return time;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-6 border-b border-(--line) py-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="type-label pt-[0.2em] text-(--faint)">{label}</dt>
      <dd className="text-[0.95rem] leading-relaxed">{children}</dd>
    </div>
  );
}

function OfficeCard({ office, index }: { office: Office; index: number }) {
  const time = useLocalTime(office.tz);

  return (
    <article
      aria-labelledby={`office-${index}`}
      className="flex flex-col lg:px-12 lg:first:pl-0 lg:last:pr-0"
    >
      <span
        aria-hidden
        data-draw
        className="block h-px w-full bg-(--line-strong)"
      />
      <div data-fade>
        <div className="mt-5 flex items-baseline justify-between gap-6">
          <p className="type-label text-(--faint)">
            {String(index + 1).padStart(2, "0")} — {office.country}
          </p>
          <p className="flex items-baseline gap-3">
            <span className="type-label text-(--faint)">Local time</span>
            <span className="type-mono min-w-[5ch] text-right text-[1.05rem] leading-none tabular-nums">
              {time ?? " "}
            </span>
          </p>
        </div>

        <h3
          id={`office-${index}`}
          className="type-display mt-10 text-[clamp(2.6rem,6.2vw,6rem)] leading-[0.9]"
        >
          {office.city}
          <span
            aria-hidden
            className="ml-[0.07em] inline-block size-[0.17em] bg-accent"
          />
        </h3>
        <p className="type-serif mt-4 text-[clamp(1.25rem,1.9vw,1.6rem)] text-(--muted)">
          {office.entity}
        </p>
      </div>

      <dl data-fade className="mt-10 border-t border-(--line)">
        <Row label="Address">
          <address className="not-italic">
            {office.address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </Row>
        <Row label={office.registration.label}>
          {office.registration.href ? (
            <DocLink href={office.registration.href}>
              <span className="type-mono">{office.registration.value}</span>
            </DocLink>
          ) : (
            <span className="type-mono">{office.registration.value}</span>
          )}
          {office.note && (
            <span className="type-label mt-2 block text-(--faint)">
              {office.note}
            </span>
          )}
        </Row>
        {office.phone && (
          <Row label="Telephone">
            <a
              href={`tel:${office.phone.tel}`}
              data-cursor="link"
              className="type-mono transition-colors duration-200 hover:text-accent"
            >
              {office.phone.display}
            </a>
          </Row>
        )}
        {office.email && (
          <Row label="Email">
            <a
              href={`mailto:${office.email}`}
              data-cursor="link"
              className="transition-colors duration-200 hover:text-accent"
            >
              {office.email}
            </a>
          </Row>
        )}
      </dl>
    </article>
  );
}

export default function Offices() {
  return (
    <div
      className={
        OFFICES.length > 1
          ? "grid gap-20 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-(--line)"
          : "grid max-w-3xl gap-20"
      }
    >
      {OFFICES.map((office, i) => (
        <OfficeCard key={office.city} office={office} index={i} />
      ))}
    </div>
  );
}
