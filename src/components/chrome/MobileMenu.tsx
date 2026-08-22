"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useLenis } from "@/components/chrome/SmoothScroll";
import MagneticButton from "@/components/ui/MagneticButton";
import {
  LOGIN_HREF,
  NAV_GEOMETRY,
  NAV_INSETS,
  NAV_LINKS,
} from "@/components/chrome/Navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => (e: React.MouseEvent) => void;
  /** The bar's condense progress, frozen at the moment the menu opened, so
   *  the close button lands on the toggle it replaces. */
  navP: number;
  /** The treatment the menu itself takes — the opposite of the chapter it
   *  opened over, so it always arrives as a change of ground. */
  scheme: "ink" | "bone";
  /** The chapter the page is currently in, from the same scrollspy that
   *  marks the bar. The menu covers the bar, so without this the reader
   *  loses all sense of where they are the moment they open it. */
  activeHref: string | null;
};

/** Full-screen ink overlay menu for touch / narrow viewports. */
export default function MobileMenu({
  open,
  onClose,
  onNavigate,
  navP,
  scheme,
  activeHref,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const links = panel.querySelectorAll("[data-menu-link]");
    const meta = panel.querySelectorAll("[data-menu-meta]");

    if (open) {
      lenis?.stop();
      panel.style.visibility = "visible";
      panel.style.pointerEvents = "auto";
      if (reduced) {
        gsap.set(panel, { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 });
        gsap.set([links, meta], { yPercent: 0, opacity: 1 });
      } else {
        gsap
          .timeline()
          .set(panel, { opacity: 1 })
          .fromTo(
            panel,
            { clipPath: "inset(0% 0% 100% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.7,
              ease: "expo.inOut",
            },
          )
          .fromTo(
            links,
            { yPercent: 120 },
            {
              yPercent: 0,
              duration: 0.8,
              stagger: 0.06,
              ease: "expo.out",
            },
            "-=0.25",
          )
          .fromTo(
            meta,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 },
            "-=0.5",
          );
      }
      const first = panel.querySelector<HTMLElement>("a, button");
      first?.focus({ preventScroll: true });
    } else {
      lenis?.start();
      if (reduced) {
        gsap.set(panel, { opacity: 0 });
        panel.style.visibility = "hidden";
        panel.style.pointerEvents = "none";
      } else {
        /* The same gesture, run backwards. It used to fade, which read as a
           different thing happening: the panel comes down over the page, so
           it should go back up off it. Same curve, a touch quicker, because
           leaving should never feel as deliberate as arriving. */
        gsap.to(panel, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.55,
          ease: "expo.inOut",
          onComplete: () => {
            panel.style.visibility = "hidden";
            panel.style.pointerEvents = "none";
          },
        });
      }
    }
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        /* The control that closes this is the bar's own button, which is
           not inside the panel — so the ring has to be built rather than
           queried, or Tab walks straight out of the menu. */
        const inPanel = panelRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        );
        const toggle = document.querySelector<HTMLElement>(
          'header button[aria-controls="mobile-menu"]',
        );
        const focusables = [
          ...(toggle ? [toggle] : []),
          ...Array.from(inPanel ?? []),
        ];
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={panelRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      data-theme={scheme}
      className={`invisible fixed inset-0 z-(--z-menu) flex flex-col justify-between overflow-y-auto pb-10 opacity-0 lg:hidden ${
        scheme === "bone" ? "bg-bone text-ink" : "bg-ink text-bone"
      }`}
      style={{ pointerEvents: "none" }}
    >
      {/* Holds the bar's height open and nothing else.

          This used to reproduce the bar — wordmark, close button, the lot —
          and the copy sat 12px below the real one, so opening the menu made
          the wordmark jump as the panel wiped over it. Two bars means two
          chances to disagree. There is one bar now: the real one, which the
          menu passes under, and its own button is what closes it. This is
          only the space it stands in. */}
      <div
        aria-hidden
        className={NAV_INSETS}
        style={
          {
            "--nav-p": navP,
            "--nav-end": NAV_GEOMETRY.end,
            paddingTop: NAV_GEOMETRY.offsetTop,
            paddingLeft: NAV_GEOMETRY.padLeft,
            paddingRight: NAV_GEOMETRY.padRight,
          } as React.CSSProperties
        }
      >
        <div
          className="min-h-10"
          style={{ paddingBlock: NAV_GEOMETRY.rowPadBlock }}
        />
      </div>

      <nav aria-label="Menu" className="px-6 py-10 sm:px-10">
        <ul className="flex flex-col gap-1">
          {NAV_LINKS.map((link, i) => {
            const active = activeHref === link.href;
            return (
              <li key={link.href} className="overflow-hidden">
                <a
                  href={link.href}
                  onClick={onNavigate(link.href)}
                  data-menu-link
                  aria-current={active ? "true" : undefined}
                  className={`type-headline flex items-baseline gap-4 py-2 text-[clamp(1.9rem,8.6vw,2.6rem)] transition-colors duration-300 hover:text-accent focus-visible:text-accent ${
                    active ? "text-accent" : ""
                  }`}
                  tabIndex={open ? 0 : -1}
                >
                  {/* The index carries the mark rather than the label: the
                      labels are enormous here, and colouring one of them
                      leaves the other four looking switched off. */}
                  <span
                    className={`type-label w-7 shrink-0 transition-colors duration-300 ${
                      active ? "text-accent" : "text-(--faint)"
                    }`}
                  >
                    0{i + 1}
                  </span>
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Both of the bar's corner controls are hidden below sm and land
            here instead — as the controls they are, not as two more chapters
            on the list. They were numbered 06 and 07 in among the sections,
            which read as places on the page rather than things to press.
            Same pairing the bar and the hero make: one invitation, one way
            back in. */}
        {/* Stacked and matched. Side by side they sized themselves to their
            own words, so "Get started" was half again the width of "Login"
            and the pair read as one control and an afterthought. A column of
            two equal blocks reads as two ways in. */}
        <div
          data-menu-meta
          className="mt-9 flex max-w-sm flex-col items-stretch gap-3"
          inert={!open || undefined}
        >
          <MagneticButton
            href="#start"
            onClick={onNavigate("#start")}
            className="w-full justify-center"
          >
            Get started
          </MagneticButton>
          <MagneticButton
            href={LOGIN_HREF}
            onClick={LOGIN_HREF.startsWith("#") ? onNavigate(LOGIN_HREF) : undefined}
            variant="outline"
            className="w-full justify-center"
          >
            Login
          </MagneticButton>
        </div>
      </nav>
      <div className="mx-6 flex items-end justify-between border-t border-(--line) pt-6 sm:mx-10">
        <div data-menu-meta className="type-label text-(--muted)">
          hello@pixely.com
        </div>
        <div data-menu-meta className="type-label text-(--muted)">
          Algiers — DZ
        </div>
      </div>
    </div>
  );
}
