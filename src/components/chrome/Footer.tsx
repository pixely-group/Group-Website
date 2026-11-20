"use client";

import { useEffect, useState } from "react";
import { Wordmark, useAnchor } from "@/components/chrome/Navigation";
import { useLenis } from "@/components/chrome/SmoothScroll";
import Link from "next/link";

import DocLink from "@/components/ui/DocLink";
import WordmarkTrace from "@/components/ui/WordmarkTrace";
import { OFFICES } from "@/lib/company";
import { announceTopic } from "@/lib/contact";
/* The same five columns the navigation opens as sub-menus. Written once, in
   lib/menu, because two lists that have to agree and are kept apart do not
   stay in agreement. */
import { MENU, linkHref } from "@/lib/menu";

/* The index columns; Legal is set apart, in the base line, where a reader
   looks for it. */
const COLUMNS = MENU.filter((c) => c.heading !== "Legal");
const LEGAL = MENU.find((c) => c.heading === "Legal")!.links;


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
  const anchor = useAnchor();

  const scrollTo = (href: string) => (e: React.MouseEvent) => {
    /* Routes and off-home anchors fall through to the browser. */
    if (!href.startsWith("#")) return;
    const el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el as HTMLElement, { duration: 1.6 });
    else el.scrollIntoView();
    announceTopic(el);
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
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {COLUMNS.map((column) => (
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
                          href={anchor(href)}
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

        {/* The company and where it is. Written once, in lib/company, and
            read here, on the About page and in the legal documents, so an
            address is never right in one and stale in another. */}
        <section id="offices" aria-labelledby="offices-heading" className="mt-16 border-t border-(--line) pt-10">
          <h2 id="offices-heading" className="type-label mb-8 text-(--muted)">
            Office
          </h2>
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            {OFFICES.map((office) => (
              <address key={office.city} className="not-italic">
                <p className="type-headline text-[1.5rem] leading-none">{office.city}</p>
                <p className="type-label mt-3 text-(--fg)">{office.entity}</p>
                <p className="mt-5 text-[0.9rem] leading-relaxed text-(--muted)">
                  {office.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
                <dl className="mt-5 space-y-2 border-t border-(--line) pt-4 text-[0.85rem]">
                  <div className="flex gap-3">
                    <dt className="type-label w-24 shrink-0 pt-px text-(--faint)">{office.registration.label}</dt>
                    <dd className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="type-mono text-(--muted)">
                        {office.registration.href ? (
                          <DocLink href={office.registration.href}>{office.registration.value}</DocLink>
                        ) : (
                          office.registration.value
                        )}
                      </span>
                      {/* What the number registers, beside it. */}
                      {office.note && <span className="type-label whitespace-nowrap text-(--faint)">{office.note}</span>}
                    </dd>
                  </div>
                  {office.phone && (
                    <div className="flex gap-3">
                      <dt className="type-label w-24 shrink-0 pt-px text-(--faint)">Phone</dt>
                      <dd>
                        <a href={`tel:${office.phone.tel}`} data-cursor="link" className="type-mono text-(--muted) transition-colors duration-300 hover:text-accent">
                          {office.phone.display}
                        </a>
                      </dd>
                    </div>
                  )}
                  {office.email && (
                    <div className="flex gap-3">
                      <dt className="type-label w-24 shrink-0 pt-px text-(--faint)">Email</dt>
                      <dd>
                        <a href={`mailto:${office.email}`} data-cursor="link" className="text-(--muted) transition-colors duration-300 hover:text-accent">
                          {office.email}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </address>
            ))}
          </div>
        </section>

        {/* Wordmark as a rule across the base of the page, ending on the
            brand's square full stop. The letters trace under the pointer;
            the dot does not, because it is the lit pixel and it is already
            lit. The fit measures word and dot together, so the line still
            spans the page exactly. */}
        <div aria-hidden className="mt-20 overflow-hidden">
          <WordmarkTrace text="Pixely" dot />
        </div>

        <div className="mt-8 flex flex-col gap-6 border-t border-(--line) pt-7 md:flex-row md:items-start md:justify-between">
          {/* Who is behind the site, as the registers have it. Nothing here
              claims a licence: none is held, and none is implied. */}
          <p className="type-label max-w-2xl leading-relaxed text-(--faint)">
            {OFFICES[0].entity} is a company registered in Algeria,
            {" "}{OFFICES[0].registration.label} {OFFICES[0].registration.value}, at {OFFICES[0].address.slice(0, 3).join(", ")}.
            It operates this website. No payment, banking or financial services
            are provided through this website.
          </p>
          <div className="flex shrink-0 flex-wrap gap-x-7 gap-y-3">
            {LEGAL.map((link) => (
              <Link
                key={link.label}
                href={link.href!}
                data-cursor="link"
                className="type-label text-(--muted) transition-colors duration-300 hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
            {/* The social links, as they were. Their profile addresses are
                still to come; until then they keep their original target. */}
            {["LinkedIn", "X", "GitHub"].map((link) => (
              <a
                key={link}
                href={anchor("#top")}
                onClick={scrollTo("#top")}
                data-cursor="link"
                className="type-label text-(--muted) transition-colors duration-300 hover:text-accent"
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        <p className="type-label mt-8 text-(--faint)">
          © {new Date().getFullYear()} Pixely — AI-powered fintech platform
        </p>
      </div>
    </footer>
  );
}
