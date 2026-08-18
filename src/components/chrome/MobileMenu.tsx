"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useLenis } from "@/components/chrome/SmoothScroll";
import { NAV_LINKS, Wordmark } from "@/components/chrome/Navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => (e: React.MouseEvent) => void;
  /** The header's compact state, mirrored so the close button lands on the
   *  toggle it replaces instead of jumping sideways. */
  scrolled: boolean;
};

/** Full-screen ink overlay menu for touch / narrow viewports. */
export default function MobileMenu({
  open,
  onClose,
  onNavigate,
  scrolled,
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
        gsap.to(panel, {
          opacity: 0,
          duration: 0.35,
          ease: "power2.inOut",
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
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        );
        if (!focusables || focusables.length === 0) return;
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
      data-theme="ink"
      className="invisible fixed inset-0 z-(--z-menu) flex flex-col justify-between overflow-y-auto bg-ink pb-10 text-bone opacity-0 lg:hidden"
      style={{ pointerEvents: "none" }}
    >
      <div
        data-menu-meta
        className={`flex min-h-10 items-center justify-between border border-transparent sm:min-h-12 ${
          scrolled
            ? "mx-3 mt-3 px-5 py-2 sm:mx-5"
            : "mx-0 mt-0 px-6 py-6 sm:px-10"
        }`}
      >
        <Wordmark />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          data-cursor="link"
          tabIndex={open ? 0 : -1}
          className="flex size-10 items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden fill="none">
            <line
              x1="3"
              y1="3"
              x2="17"
              y2="17"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1="17"
              y1="3"
              x2="3"
              y2="17"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>

      <nav aria-label="Menu" className="px-6 py-10 sm:px-10">
        <ul className="flex flex-col gap-1">
          {NAV_LINKS.map((link, i) => (
            <li key={link.href} className="overflow-hidden">
              <a
                href={link.href}
                onClick={onNavigate(link.href)}
                data-menu-link
                className="type-headline flex items-baseline gap-4 py-2 text-[clamp(1.9rem,8.6vw,2.6rem)]"
                tabIndex={open ? 0 : -1}
              >
                <span className="type-label w-7 shrink-0 text-accent">
                  0{i + 1}
                </span>
                {link.label}
              </a>
            </li>
          ))}
          <li className="mt-4 overflow-hidden">
            <a
              href="#start"
              onClick={onNavigate("#start")}
              data-menu-link
              className="type-headline flex items-baseline gap-4 py-2 text-[clamp(1.9rem,8.6vw,2.6rem)] text-accent"
              tabIndex={open ? 0 : -1}
            >
              <span className="type-label w-7 shrink-0">06</span>
              Get started
            </a>
          </li>
        </ul>
      </nav>
      <div className="mx-6 flex items-end justify-between border-t border-(--line) pt-6 sm:mx-10">
        <div data-menu-meta className="type-label text-(--muted)">
          hello@pixely.com
        </div>
        <div data-menu-meta className="type-label text-(--muted)">
          NYC — LON — SGP
        </div>
      </div>
    </div>
  );
}
