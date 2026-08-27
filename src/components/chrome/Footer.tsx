"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/chrome/Navigation";
import { useLenis } from "@/components/chrome/SmoothScroll";
import WordmarkTrace from "@/components/ui/WordmarkTrace";
/* The same five columns the navigation opens as sub-menus. Written once, in
   lib/menu, because two lists that have to agree and are kept apart do not
   stay in agreement. */
import { MENU, linkHref } from "@/lib/menu";


/** Hubs whose local time the footer keeps, west to east. Algiers is the home
 *  node the corridor map is drawn around, so it has to appear in a strip
 *  labelled as the corridor's clocks — the rest are its endpoints. */
const HUBS = [
  { code: "NYC", tz: "America/New_York" },
  { code: "LON", tz: "Europe/London" },
  { code: "ALG", tz: "Africa/Algiers" },
  { code: "DXB", tz: "Asia/Dubai" },
  { code: "SGP", tz: "Asia/Singapore" },
  { code: "TYO", tz: "Asia/Tokyo" },
] as const;

const formatters = HUBS.map((hub) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: hub.tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
);

/**
 * The clock strip is the footer's live element: markets are always open
 * somewhere, which is the whole argument of the global section. Times are
 * rendered blank on the server and filled after mount, so the markup the
 * server produced and the first client paint agree.
 */
function ClockStrip() {
  const [times, setTimes] = useState<string[] | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimes(formatters.map((f) => f.format(now)));
    };
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <ul className="grid grid-cols-3 gap-y-6 sm:grid-cols-6">
      {HUBS.map((hub, i) => (
        <li key={hub.code} className="group">
          <p className="type-mono text-[1.15rem] leading-none tabular-nums transition-colors duration-300 group-hover:text-accent">
            {times ? times[i] : " "}
          </p>
          <p className="type-label mt-2 text-(--faint)">{hub.code}</p>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  const lenis = useLenis();

  const scrollTo = (href: string) => (e: React.MouseEvent) => {
    const el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el as HTMLElement, { duration: 1.6 });
    else el.scrollIntoView();
  };

  return (
    <footer
      id="resources"
      data-theme="ink"
      className="relative overflow-hidden bg-theme px-6 pt-16 pb-8 text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-7xl">
        <div className="border-t border-(--line) pt-10">
          <p className="type-label mb-8 text-(--muted)">
            Local time across the corridor
          </p>
          <ClockStrip />
        </div>

        <div className="mt-16 grid gap-12 border-t border-(--line) pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-[0.9rem] leading-relaxed text-(--muted)">
              Payments, digital identity and AI in one platform, built for
              Algeria.
            </p>
            <p className="type-label mt-8 flex items-center gap-2 text-(--faint)">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-positive" />
              </span>
              All systems operational
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {MENU.map((column) => (
              <div key={column.heading}>
                <h2 className="type-label mb-5 text-(--faint)">
                  {column.heading}
                </h2>
                <ul className="space-y-3">
                  {column.links.map((link) => {
                    const href = linkHref(column, link);
                    return (
                      <li key={link.label}>
                        <a
                          href={href}
                          onClick={scrollTo(href)}
                          data-cursor="link"
                          className="text-[0.88rem] text-(--muted) transition-colors duration-300 hover:text-accent"
                        >
                          {link.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Wordmark as a rule across the base of the page, ending on the
            brand's square full stop. The letters trace under the pointer;
            the dot does not, because it is the lit pixel and it is already
            lit. The fit measures word and dot together, so the line still
            spans the page exactly. */}
        <div aria-hidden className="mt-20 overflow-hidden">
          <WordmarkTrace text="Pixely" dot />
        </div>

        <div className="mt-8 flex flex-col gap-6 border-t border-(--line) pt-7 md:flex-row md:items-start md:justify-between">
          <p className="type-label max-w-2xl leading-relaxed text-(--faint)">
            Pixely Financial Technologies Ltd. is an authorised electronic
            money institution. Payment and account services are provided by
            Pixely and its partner institutions. Balances are safeguarded,
            not deposits, and are not covered by deposit guarantee schemes.
          </p>
          <div className="flex shrink-0 flex-wrap gap-x-7 gap-y-3">
            {["Privacy", "Terms", "Cookies", "LinkedIn", "X", "GitHub"].map(
              (link) => (
                <a
                  key={link}
                  href="#top"
                  onClick={scrollTo("#top")}
                  data-cursor="link"
                  className="type-label text-(--muted) transition-colors duration-300 hover:text-accent"
                >
                  {link}
                </a>
              ),
            )}
          </div>
        </div>

        <p className="type-label mt-8 text-(--faint)">
          © 2026 Pixely — AI-powered fintech platform
        </p>
      </div>
    </footer>
  );
}
