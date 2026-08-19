"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
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

/** Scroll distance over which the bar gathers itself, in px. */
const CONDENSE_OVER = 200;

/**
 * Breakpoint ends for the horizontal inset. At rest the bar spans the page's
 * gutter; condensed it draws inward by a fixed step — 8, 16 or 24px a side.
 * Deliberately modest and independent of viewport width: centring the bar
 * within a fixed measure made wide screens contract by hundreds of pixels,
 * which reads as the bar collapsing rather than settling.
 */
export const NAV_INSETS =
  "[--nav-gutter:24px] [--nav-inset:32px] " +
  "sm:[--nav-gutter:40px] sm:[--nav-inset:56px] " +
  "lg:[--nav-gutter:56px] lg:[--nav-inset:80px]";

/**
 * Geometry interpolated by `--nav-p`, 0 (at rest) → 1 (condensed). Every
 * value here is a length, which is the point: the inset is carried by
 * padding rather than a max-width cap, because `max-width` cannot
 * interpolate away from `none` and snaps mid-transition.
 */
export const NAV_GEOMETRY = {
  offsetTop: "calc(var(--nav-p) * 12px)",
  padInline:
    "calc(var(--nav-gutter) + (var(--nav-inset) - var(--nav-gutter)) * var(--nav-p))",
  padBlock: "calc(24px - var(--nav-p) * 16px)",
  padLeft: "calc(var(--nav-p) * 20px)",
  padRight: "calc(var(--nav-p) * 8px)",
} as const;

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
        <circle cx="11" cy="11" r="9.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="11" y1="0" x2="11" y2="22" stroke="currentColor" strokeWidth="1.5" />
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
 * Overlay nav that gathers into a floating glass bar as you scroll. The
 * change is scrubbed against scroll position rather than switched at a
 * threshold, so it tracks the page instead of happening to it. Palette
 * follows the chapter (`data-theme`) currently beneath the bar.
 */
export default function Navigation() {
  const lenis = useLenis();
  const [scheme, setScheme] = useState<"ink" | "bone">("ink");
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navP = useRef(0);
  // The menu reproduces the bar's geometry, and opening it stops Lenis —
  // which can reset scroll and move the bar underneath. So the menu keeps
  // whatever the bar measured at the moment the toggle was pressed.
  const [menuNavP, setMenuNavP] = useState(0);

  // Condensing is driven exactly like every other scrubbed moment on the
  // page: a GSAP scrub for the smoothing lag, and an eased tween so the
  // change settles rather than tracking the wheel one-to-one. A raw
  // scrollY/range mapping is linear and unsmoothed, which is what made this
  // feel unlike the rest of the site.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const setP = (p: number) => {
      navP.current = p;
      header.style.setProperty("--nav-p", p.toFixed(4));
    };

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const proxy = { p: 0 };
        const tween = gsap.to(proxy, {
          p: 1,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: `+=${CONDENSE_OVER}`,
            scrub: 0.6,
          },
          onUpdate: () => setP(proxy.p),
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const st = ScrollTrigger.create({
          trigger: document.documentElement,
          start: "top top",
          end: `+=${CONDENSE_OVER}`,
          onUpdate: (self) => setP(self.progress > 0.5 ? 1 : 0),
        });
        return () => st.kill();
      });

      return () => mm.revert();
    });

    return () => ctx.revert();
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
          setScheme(themed.getAttribute("data-theme") === "bone" ? "bone" : "ink");
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

  const toggleMenu = useCallback(() => {
    setMenuNavP(navP.current);
    setMenuOpen((v) => !v);
  }, []);

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
        style={{ "--nav-p": 0 } as React.CSSProperties}
      >
        {/* Full-bleed at rest, so the wordmark sits on the page's gutter and
            lines up with the hero headline; it draws in to a floating pill as
            the bar condenses. */}
        <div
          className={NAV_INSETS}
          style={{
            paddingTop: NAV_GEOMETRY.offsetTop,
            paddingInline: NAV_GEOMETRY.padInline,
          }}
        >
          <div
            className="relative flex min-h-10 items-center justify-between text-(--fg)"
            style={{
              paddingBlock: NAV_GEOMETRY.padBlock,
              paddingLeft: NAV_GEOMETRY.padLeft,
              paddingRight: NAV_GEOMETRY.padRight,
            }}
          >
            {/* Glass fades in as one composited layer. Animating background,
                border and backdrop-filter separately is heavier and never
                quite lands together. */}
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-0 rounded-(--radius-panel) border border-(--line) ${glass} backdrop-blur-xl`}
              style={{ opacity: "var(--nav-p)" }}
            />

            <a
              href="#top"
              onClick={scrollTo("#top")}
              aria-label="Pixely — back to top"
              data-cursor="link"
              className="relative text-(--fg)"
            >
              <Wordmark />
            </a>

            <nav aria-label="Primary" className="relative hidden lg:block">
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

            <div className="relative flex items-center gap-3">
              {/* Wrapped rather than given `hidden` directly: the button's own
                  `inline-flex` is the same specificity and wins by CSS order. */}
              <span className="hidden sm:block">
                <MagneticButton href="#start" onClick={scrollTo("#start")} size="sm">
                  Get started
                </MagneticButton>
              </span>
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={toggleMenu}
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
        </div>
      </header>
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={scrollTo}
        navP={menuNavP}
      />
    </>
  );
}
