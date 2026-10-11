"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

/* Who it is for, written as what the platform is built to do for each of
   them. There are no figures here: the platform is not live, and a time to
   first payment, a match rate or a count of markets would be a number nobody
   has measured. The three markers under each say what kind of thing it is,
   not how much of it there is. */
const DIMENSIONS = [
  {
    id: "startups",
    label: "Startups",
    headline: "Launch a financial product on one integration.",
    body: "Accounts, payments, identity checks and fraud screening behind a single API, so a team builds its product rather than a stack of providers.",
    stats: [
      ["One API", "Payments, wallets, identity and AI"],
      ["Sandbox", "Simulated rails to build against"],
      ["Built in", "KYC and AML from the first user"],
    ],
    rail: ["Accounts API", "Sandbox", "Test rails", "Go-live review"],
  },
  {
    id: "enterprises",
    label: "Enterprises",
    headline: "One control plane over every entity and account.",
    body: "Entities, currencies and rails brought into a single ledger with role-based control, while the banks you already work with stay connected underneath.",
    stats: [
      ["One ledger", "Across entities and currencies"],
      ["Real time", "Cash visibility, not end of day"],
      ["Roles", "Approvals that match your organisation"],
    ],
    rail: ["Entity graph", "Approval matrix", "ERP sync", "Audit export"],
  },
  {
    id: "platforms",
    label: "Platforms",
    headline: "Collect, split and pay out programmatically.",
    body: "Funds split, held and disbursed by rule, with obligations tracked for each seller and every payout on a record you can audit.",
    stats: [
      ["Per seller", "Ledgers, holds and reserves"],
      ["By rule", "Splits and payouts in code"],
      ["Traceable", "Every movement on the record"],
    ],
    rail: ["Split rules", "Holds", "Payout router", "Seller ledgers"],
  },
  {
    id: "treasury",
    label: "Financial teams",
    headline: "Close the month while the month is still running.",
    body: "Every movement categorised, matched and exportable as it happens, so reconciliation becomes a property of the ledger rather than a monthly event.",
    stats: [
      ["Continuous", "Reconciliation, not month-end"],
      ["Matched", "As transactions settle"],
      ["Immutable", "An evidence trail for auditors"],
    ],
    rail: ["Auto-match", "Categories", "Close pack", "Auditor access"],
  },
  {
    id: "global",
    label: "Global businesses",
    headline: "Algeria, connected to the markets it trades with.",
    body: "Built for Algeria and connected outward, so value can move between Algerian businesses and their partners abroad on one platform.",
    stats: [
      ["Algeria", "Built here, for here"],
      ["Outward", "Corridors to trading partners"],
      ["One view", "Domestic and cross-border together"],
    ],
    rail: ["Local accounts", "FX", "Corridors", "Records"],
  },
] as const;

export default function UseCases() {
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const previous = useRef(0);

  // Animate the panel whenever the dimension changes.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || previous.current === active) {
      previous.current = active;
      return;
    }
    previous.current = active;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panel.querySelectorAll("[data-swap]"),
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.055,
          ease: "expo.out",
          overwrite: true,
        },
      );
    }, panel);
    return () => ctx.revert();
  }, [active]);

  // Roving focus per the tabs pattern. Kept out of the state updater, which
  // must stay pure.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const last = DIMENSIONS.length - 1;
      let target: number;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          target = active === last ? 0 : active + 1;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          target = active === 0 ? last : active - 1;
          break;
        case "Home":
          target = 0;
          break;
        case "End":
          target = last;
          break;
        default:
          return;
      }
      e.preventDefault();
      setActive(target);
      tabRefs.current[target]?.focus();
    },
    [active],
  );

  const dimension = DIMENSIONS[active];

  return (
    <section
      id="solutions"
      data-theme="bone"
      className="relative bg-theme px-6 py-[15vh] text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-7xl">
        <p className="type-label section-index mb-6 text-(--muted)">
          07 — Who it is for
        </p>
        <h2 className="type-headline text-big max-w-[16ch] text-balance">
          The same rails, seen from five directions.
        </h2>

        <div
          role="tablist"
          aria-label="Customer types"
          onKeyDown={onKeyDown}
          className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-b border-(--line) pb-5"
        >
          {DIMENSIONS.map((d, i) => (
            <button
              key={d.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`usecase-tab-${d.id}`}
              aria-selected={active === i}
              aria-controls={`usecase-panel-${d.id}`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => setActive(i)}
              data-cursor="link"
              className={`type-label relative pb-2 transition-colors duration-300 ${
                active === i
                  ? "text-accent"
                  : "text-(--muted) hover:text-(--fg)"
              }`}
            >
              <span className="mr-2 text-[9px] opacity-60">
                0{i + 1}
              </span>
              {d.label}
              <span
                aria-hidden
                className={`absolute bottom-0 left-0 h-px bg-accent transition-all duration-500 ease-(--ease-out-expo) ${
                  active === i ? "w-full" : "w-0"
                }`}
              />
            </button>
          ))}
        </div>

        <div
          ref={panelRef}
          role="tabpanel"
          id={`usecase-panel-${dimension.id}`}
          aria-labelledby={`usecase-tab-${dimension.id}`}
          tabIndex={0}
          className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16"
        >
          <div>
            <h3
              data-swap
              className="type-headline text-mid max-w-[18ch] text-balance"
            >
              {dimension.headline}
            </h3>
            <p
              data-swap
              className="mt-6 max-w-xl text-[0.98rem] leading-relaxed text-(--muted)"
            >
              {dimension.body}
            </p>
            <ul data-swap className="mt-9 flex flex-wrap gap-2">
              {dimension.rail.map((chip) => (
                <li
                  key={chip}
                  className="type-label rounded-(--radius-chip) border border-(--line) px-3.5 py-2.5 text-(--muted)"
                >
                  {chip}
                </li>
              ))}
            </ul>
          </div>

          <dl className="grid content-start">
            {dimension.stats.map(([value, label]) => (
              <div
                key={label}
                data-swap
                className="border-t border-(--line) py-5 last:border-b"
              >
                <dt className="type-mono text-[1.6rem] leading-none font-medium tracking-[-0.02em]">
                  {value}
                </dt>
                <dd className="mt-2.5 text-[0.88rem] leading-relaxed text-(--muted)">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
