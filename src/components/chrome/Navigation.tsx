"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { CURSOR_DOT_LINK_PX } from "@/components/chrome/CustomCursor";
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
 * gutter; condensed it gathers to a measure and centres on it.
 *
 * That measure is set from what the bar actually holds. Its three blocks —
 * wordmark, links, control — come to 703px, and 52rem leaves about 105px of
 * air across the two gaps once the row's own padding is taken off, which is
 * what makes it read as a pill around its contents rather than a bar that
 * happens to be shorter. The lg inset drops to 64px so the measure, not the
 * inset, is what governs from 1024 up: max() takes the inset only on screens
 * too narrow for the measure to fit.
 */
export const NAV_INSETS =
  "[--nav-gutter:24px] [--nav-inset:48px] [--nav-max:52rem] " +
  "sm:[--nav-gutter:40px] sm:[--nav-inset:96px] " +
  "lg:[--nav-gutter:56px] lg:[--nav-inset:64px]";

/**
 * Geometry interpolated by `--nav-p`, 0 (at rest) → 1 (condensed). Every
 * value here is a length, which is the point: the inset is carried by
 * padding rather than a max-width cap, because `max-width` cannot
 * interpolate away from `none` and snaps mid-transition.
 */
export const NAV_GEOMETRY = {
  /** Where the bar's edges land once condensed. */
  end: "max(var(--nav-inset), (100% - var(--nav-max)) / 2)",
  offsetTop: "calc(var(--nav-p) * 12px)",
  /** Left follows the page gutter at rest, so the wordmark sits on the same
   *  column as the hero headline. */
  padLeft:
    "calc(var(--nav-gutter) + (var(--nav-end) - var(--nav-gutter)) * var(--nav-p))",
  /** Right starts at the row's own vertical padding instead of the gutter,
   *  so the corner control is inset equally from the top and the right even
   *  before the bar has a visible edge. */
  padRight: "calc(24px + (var(--nav-end) - 24px) * var(--nav-p))",
  rowPadBlock: "calc(24px - var(--nav-p) * 20px)",
  rowPadLeft: "calc(var(--nav-p) * 20px)",
  /** Matches the condensed vertical padding exactly, so the corner stays
   *  square. Changing one without the other threw it out last time. */
  rowPadRight: "calc(var(--nav-p) * 4px)",
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
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navP = useRef(0);
  const navRef = useRef<HTMLElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  // Whether the marker has been positioned once already. Deciding this from
  // the dot's current opacity is unreliable: if the fade has not run yet the
  // travel is mistaken for a first placement and never glides.
  const dotPlaced = useRef(false);
  const activeHrefRef = useRef<string | null>(null);
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
    setActiveHref(href);
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

  // A single marker that moves to whichever entry is selected. Five dots
  // fading in and out cannot show the journey between them.
  const placeDot = useCallback((href: string | null, glide: boolean) => {
    const dot = dotRef.current;
    const nav = navRef.current;
    if (!dot || !nav) return;

    const index = NAV_LINKS.findIndex((l) => l.href === href);
    if (index < 0) {
      gsap.to(dot, { opacity: 0, duration: 0.2, overwrite: true });
      return;
    }
    const link = nav.querySelectorAll("a")[index];
    if (!link) return;

    const navBox = nav.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    const x = box.left - navBox.left - 12;
    const y = box.top - navBox.top + box.height / 2 - CURSOR_DOT_LINK_PX / 2;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Travel only from a known position; the first selection should appear
    // in place rather than fly in from the corner.
    if (glide && dotPlaced.current && !reduced) {
      gsap.to(dot, {
        x,
        y,
        opacity: 1,
        duration: 0.55,
        ease: "expo.out",
        overwrite: true,
      });
    } else {
      gsap.set(dot, { x, y });
      gsap.to(dot, {
        opacity: 1,
        duration: reduced ? 0 : 0.28,
        overwrite: true,
      });
    }
    dotPlaced.current = true;
  }, []);

  useEffect(() => {
    activeHrefRef.current = activeHref;
    placeDot(activeHref, true);
  }, [activeHref, placeDot]);

  // Realignment lives apart from selection on purpose. ResizeObserver fires
  // once the moment it observes, and document.fonts.ready is already resolved
  // after first load — so running these alongside a selection change would
  // overwrite the travel tween the instant it was created, and the marker
  // would jump instead of moving.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let ignoreFirst = true;
    const ro = new ResizeObserver(() => {
      if (ignoreFirst) {
        ignoreFirst = false;
        return;
      }
      placeDot(activeHrefRef.current, false);
    });
    ro.observe(nav);
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) placeDot(activeHrefRef.current, false);
    });
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [placeDot]);

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
          style={
            {
              "--nav-end": NAV_GEOMETRY.end,
              paddingTop: NAV_GEOMETRY.offsetTop,
              paddingLeft: NAV_GEOMETRY.padLeft,
              paddingRight: NAV_GEOMETRY.padRight,
            } as React.CSSProperties
          }
        >
          <div
            className="relative flex min-h-10 items-center justify-between text-(--fg)"
            style={{
              paddingBlock: NAV_GEOMETRY.rowPadBlock,
              paddingLeft: NAV_GEOMETRY.rowPadLeft,
              paddingRight: NAV_GEOMETRY.rowPadRight,
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

            <nav
              ref={navRef}
              aria-label="Primary"
              className="relative hidden lg:block"
            >
              {/* Sized from the cursor's dot as it renders beside a link. */}
              <span
                ref={dotRef}
                aria-hidden
                style={{
                  width: CURSOR_DOT_LINK_PX,
                  height: CURSOR_DOT_LINK_PX,
                  opacity: 0,
                }}
                className="pointer-events-none absolute top-0 left-0 rounded-full bg-accent"
              />
              <ul className="flex items-center gap-9">
                {NAV_LINKS.map((link) => {
                  const active = activeHref === link.href;
                  return (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        onClick={scrollTo(link.href)}
                        data-cursor="link"
                        aria-current={active ? "true" : undefined}
                        className={`type-label relative block py-2 transition-colors duration-300 ${
                          active
                            ? "text-accent"
                            : "text-(--muted) hover:text-accent focus-visible:text-accent"
                        }`}
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
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
