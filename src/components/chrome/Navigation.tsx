"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/chrome/SmoothScroll";
import MagneticButton from "@/components/ui/MagneticButton";
import MobileMenu from "@/components/chrome/MobileMenu";

/**
 * Anchors for a single-page site: every entry has to resolve to something on
 * this page. "Company" lands on the thesis, which is the company's position,
 * and "Resources" on the footer, where the reference links live.
 */
export const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Solutions", href: "#solutions" },
  { label: "Platform", href: "#network" },
  { label: "Company", href: "#thesis" },
  { label: "Resources", href: "#resources" },
] as const;

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <circle
          cx="11"
          cy="11"
          r="9.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="11"
          y1="0"
          x2="11"
          y2="22"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <ellipse
          cx="11"
          cy="11"
          rx="4.2"
          ry="9.5"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.55"
        />
      </svg>
      <span className="type-headline text-[0.95rem] tracking-[0.06em]">
        Pixely
      </span>
    </span>
  );
}

/**
 * Transparent overlay nav that condenses into a floating glass bar on
 * scroll. Adapts its palette to the chapter (`data-theme` section)
 * currently under it.
 */
export default function Navigation() {
  const lenis = useLenis();
  const [scrolled, setScrolled] = useState(false);
  const [scheme, setScheme] = useState<"ink" | "bone">("ink");
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pinned sections make trigger-based theme detection unreliable, so
  // hit-test what is actually rendered underneath the bar instead.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let frame = 0;

    const sample = () => {
      frame = 0;
      const stack = document.elementsFromPoint(
        window.innerWidth / 2,
        Math.min(56, window.innerHeight - 1),
      );
      for (const el of stack) {
        if (header.contains(el)) continue;
        const themed = el.closest("main [data-theme]");
        if (themed) {
          setScheme(
            themed.getAttribute("data-theme") === "bone" ? "bone" : "ink",
          );
          return;
        }
      }
    };

    let fallback = 0;
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sample);
      // rAF can be heavily throttled (hidden panes); keep theming honest.
      window.clearTimeout(fallback);
      fallback = window.setTimeout(sample, 160);
    };
    sample();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollTo = (href: string) => (e: React.MouseEvent) => {
    const el = document.querySelector(href);
    // Let the browser handle anything we cannot resolve, rather than
    // swallowing the click and going nowhere.
    if (!el) return;
    e.preventDefault();
    setMenuOpen(false);
    if (lenis) {
      // The menu stops Lenis while it is open so the page behind cannot
      // scroll, and a stopped instance drops scrollTo silently. Resume
      // first: closing the menu is precisely when scrolling should resume.
      lenis.start();
      lenis.scrollTo(el as HTMLElement, { duration: 1.6 });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const glass = scheme === "bone" ? "bg-bone/72" : "bg-ink/64";

  return (
    <>
      <a href="#product" className="skip-link" onClick={scrollTo("#product")}>
        Skip to content
      </a>
      <header
        ref={headerRef}
        data-theme={scheme}
        className="fixed inset-x-0 top-0 z-(--z-nav)"
      >
        <div
          className={`flex min-h-10 items-center justify-between text-(--fg) transition-all duration-700 ease-(--ease-out-expo) ${
            scrolled
              ? `mx-3 mt-3 rounded-(--radius-panel) border border-(--line) ${glass} py-2 pr-2 pl-5 backdrop-blur-xl sm:mx-5 lg:mx-8`
              : "mx-0 mt-0 border border-transparent bg-transparent py-6 pr-6 pl-6 sm:pl-10 lg:pl-14"
          }`}
        >
          <a
            href="#top"
            onClick={scrollTo("#top")}
            aria-label="Pixely — back to top"
            data-cursor="link"
            className="text-(--fg)"
          >
            <Wordmark />
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={scrollTo(link.href)}
                    data-cursor="link"
                    className="type-label relative block py-2 text-(--muted) transition-colors duration-300 hover:text-(--fg)"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {/* Wrapped rather than given `hidden` directly: the button's own
                `inline-flex` is the same specificity and wins by CSS order. */}
            <span className="hidden sm:block">
              <MagneticButton
                href="#start"
                onClick={scrollTo("#start")}
                size="sm"
              >
                Get started
              </MagneticButton>
            </span>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
              data-cursor="link"
              className="relative flex size-10 flex-col items-center justify-center gap-[7px] lg:hidden"
            >
              <span className="sr-only">
                {menuOpen ? "Close menu" : "Open menu"}
              </span>
              <span
                aria-hidden
                className={`block h-px w-6 bg-current transition-transform duration-500 ease-(--ease-out-expo) ${menuOpen ? "translate-y-[4px] rotate-45" : ""}`}
              />
              <span
                aria-hidden
                className={`block h-px w-6 bg-current transition-transform duration-500 ease-(--ease-out-expo) ${menuOpen ? "-translate-y-[4px] -rotate-45" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={scrollTo}
        scrolled={scrolled}
      />
    </>
  );
}
