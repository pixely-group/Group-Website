"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import MagneticButton from "@/components/ui/MagneticButton";

/**
 * The account, opened. The button wears the first name; under it, the panel
 * says who is signed in — the full name and address the truncated button
 * cannot — and holds the account's actions.
 *
 * It speaks the navigation sub-menu's language on purpose: the same fill,
 * the same hover intent, the same staggered items, Escape and ArrowDown
 * doing the same work. One system, whether the panel under the bar holds a
 * chapter or a person.
 *
 * Every row clears one bar: it goes somewhere real. Dashboard, Profile and
 * Settings are the account area's pages — honest scaffolds that read the
 * session server-side and refuse to invent what does not exist yet — and
 * Support is a place on the front page. The list grows by that rule and no
 * other.
 *
 * This also retires a hazard: the name used to sign out on click, with
 * nothing between an idle press and a dropped session. Sign out is now a
 * deliberate second press inside the panel.
 */

/* The nav sub-menu's own intent numbers. */
const OPEN_MS = 110;
const CLOSE_MS = 240;

export type Account = {
  provider?: string;
  name?: string;
  email?: string;
};

/* Three kinds of row: a page of the account area, a place on the front
   page, and the one action. The pages exist — each is an honest scaffold
   that reads the session server-side — which is the bar a row has to clear
   to be listed. */
const ITEMS: { label: string; act: "page" | "goto" | "signout"; href?: string }[] = [
  { label: "Dashboard", act: "page", href: "/dashboard" },
  /* No Profile row: the panel's own header IS the profile — name, address,
     provider — so the row was a door to the room you were standing in. The
     page keeps its tab inside the account area. */
  { label: "Settings", act: "page", href: "/settings" },
  { label: "Support", act: "goto", href: "#resources" },
  { label: "Sign out", act: "signout" },
];

export default function AccountMenu({
  account,
  goTo,
  onSignOut,
}: {
  account: Account;
  /** The navigation's own scroll — same glide, same travelling dot. */
  goTo: (href: string) => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const lastPointer = useRef("mouse");

  const first =
    account.name?.split(" ")[0] ?? account.email?.split("@")[0] ?? "Account";

  const schedule = (next: boolean, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), ms);
  };

  /* Scrolling or clicking elsewhere puts it away, Escape returns to the
     button — the sub-menu's manners, kept. */
  useEffect(() => {
    if (!open) return;
    const shut = () => setOpen(false);
    const down = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      rootRef.current?.querySelector("button")?.focus();
    };
    window.addEventListener("scroll", shut, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("scroll", shut);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") schedule(true, OPEN_MS);
      }}
      onPointerLeave={() => schedule(false, CLOSE_MS)}
    >
      <MagneticButton
        variant="outline"
        size="sm"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="account-panel"
        onPointerDown={(e) => {
          lastPointer.current = e.pointerType;
        }}
        onClick={() => {
          /* A mouse arrives hovering, so its click confirms what hover
             already opened rather than snapping it shut; touch and keyboard
             have no hover and get the toggle. */
          if (lastPointer.current === "mouse") setOpen(true);
          else setOpen((v) => !v);
          lastPointer.current = "mouse";
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key !== "ArrowDown") return;
          e.preventDefault();
          setOpen(true);
          requestAnimationFrame(() =>
            rootRef.current
              ?.querySelector<HTMLElement>("#account-panel button")
              ?.focus(),
          );
        }}
      >
        {first}
      </MagneticButton>

      <div
        id="account-panel"
        data-nav-panel
        data-open={open || undefined}
        aria-hidden={!open}
        inert={!open || undefined}
        className="absolute top-full right-0 z-10 pt-4"
        style={{ width: 236 }}
      >
        <div className="rounded-(--radius-panel) border border-(--line) bg-(--nav-panel-fill) p-5 backdrop-blur-xl">
          {/* Who, exactly. The one thing the 80px button can never say. */}
          <p className="truncate text-[0.9rem] font-semibold text-(--fg)">
            {account.name ?? first}
          </p>
          {account.email && (
            <p className="mt-0.5 truncate text-[0.78rem] text-(--muted)">
              {account.email}
            </p>
          )}
          {account.provider && (
            <p className="type-label mt-2 text-(--faint)">
              via {account.provider}
            </p>
          )}

          <ul className="mt-4 flex flex-col gap-0.5 border-t border-(--line) pt-4">
            {ITEMS.map((item, i) => (
              <li
                key={item.label}
                className="nav-panel-item"
                style={{ "--i": i } as React.CSSProperties}
              >
                {item.act === "page" ? (
                  <Link
                    href={item.href!}
                    tabIndex={open ? undefined : -1}
                    onClick={() => setOpen(false)}
                    data-cursor="link"
                    className="type-label -mx-2 block w-full rounded-(--radius-mock) px-2 py-2 text-left text-(--muted) transition-colors duration-200 hover:bg-(--surface) hover:text-accent focus-visible:bg-(--surface) focus-visible:text-accent"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    tabIndex={open ? undefined : -1}
                    onClick={() => {
                      setOpen(false);
                      if (item.act === "goto") goTo(item.href!);
                      else onSignOut();
                    }}
                    data-cursor="link"
                    className="type-label -mx-2 block w-full rounded-(--radius-mock) px-2 py-2 text-left text-(--muted) transition-colors duration-200 hover:bg-(--surface) hover:text-accent focus-visible:bg-(--surface) focus-visible:text-accent"
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
