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
/* In the order the sections actually appear. Measured, not assumed: Identity
   points at #network, which is the fourth section down, while Services points
   at #solutions, which is the eighth — so reading the bar left to right used
   to walk the page out of sequence. */
export const NAV_LINKS = [
  { label: "Platform", href: "#product" },
  { label: "Identity", href: "#network" },
  { label: "Services", href: "#solutions" },
  { label: "Company", href: "#thesis" },
  { label: "Contact", href: "#resources" },
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
/**
 * Where signing in goes. Every other link on this site is an anchor into the
 * page, because the site is the page — there is no app to hand off to yet.
 * Until there is, this lands on the same section the button does; give it the
 * real URL here and the anchor scrolling turns itself off.
 */
export const LOGIN_HREF = "#start";

export const NAV_INSETS =
  "[--nav-gutter:24px] [--nav-inset:48px] [--nav-max:52rem] " +
  "[--nav-row-right:20px] " +
  "sm:[--nav-gutter:40px] sm:[--nav-inset:96px] " +
  "lg:[--nav-gutter:56px] lg:[--nav-inset:64px] lg:[--nav-row-right:4px]";

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
  /** The same as the left. It used to start at 24px — the row's vertical
   *  padding — so the corner control would be inset equally from the top and
   *  the right; but that put the trailing control 16px closer to the edge
   *  than the wordmark was on the other side at every width above sm, which
   *  is the asymmetry you actually see. Left and right now agree. */
  padRight:
    "calc(var(--nav-gutter) + (var(--nav-end) - var(--nav-gutter)) * var(--nav-p))",
  rowPadBlock: "calc(24px - var(--nav-p) * 20px)",
  rowPadLeft: "calc(var(--nav-p) * 20px)",
  /** Matches rowPadLeft wherever the trailing control is the menu button, so
   *  the icon and the wordmark are inset the same. At lg the trailing control
   *  is the pill instead, and that goes back to 4px — the same as the
   *  condensed vertical padding, so the pill sits square in the corner. */
  rowPadRight: "calc(var(--nav-p) * var(--nav-row-right))",
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
  /** Raised while the bar is between grounds. Only the links care: theirs is
   *  the one colour in here with a transition of its own, for the pointer,
   *  and a transition restarted every frame against a moving token advances
   *  by that curve's slope rather than its duration — it trailed the rest of
   *  the bar by a third of the crossing. Off while crossing, they take the
   *  token's animated value straight and land with everything else. */
  const [crossing, setCrossing] = useState(false);
  const schemeRef = useRef<"ink" | "bone">("ink");
  const [menuOpen, setMenuOpen] = useState(false);

  /* The panel is lg:hidden, so widening past lg takes it away without
     telling React. The bar would be left riding at menu z-index in the
     forced ink treatment with nothing underneath it, so the state is closed
     at the same breakpoint the panel stops existing at. */
  useEffect(() => {
    if (!menuOpen) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    const shut = () => wide.matches && setMenuOpen(false);
    shut();
    wide.addEventListener("change", shut);
    return () => wide.removeEventListener("change", shut);
  }, [menuOpen]);
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
  /** The bar has gathered far enough that signing in has withdrawn. The
   *  withdrawal itself is scrubbed in CSS; this exists because a control
   *  that is invisible still answers the keyboard, and a tab stop you
   *  cannot see is worse than one that is merely out of the way. */
  const [gathered, setGathered] = useState(false);
  const gatheredRef = useRef(false);

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
      // Past the point where it has faded out. Compared against a ref because
      // this runs on every scrubbed frame.
      const gone = p > 0.86;
      if (gone !== gatheredRef.current) {
        gatheredRef.current = gone;
        setGathered(gone);
      }
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

  /* Which section the reader is actually in, reflected in the bar.
     Sorted by document position rather than by the order of NAV_LINKS: the
     bar reads Platform, Services, Identity, but Services is further down the
     page than Identity, so walking the links in their own order would light
     the wrong one. */
  useEffect(() => {
    type Target = { href: (typeof NAV_LINKS)[number]["href"]; el: Element };
    const targets = NAV_LINKS.map((l) => ({
      href: l.href,
      el: document.querySelector(l.href),
    }))
      .filter((t): t is Target => !!t.el)
      .sort(
        (a, b) =>
          a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top,
      );
    if (!targets.length) return;

    let last: string | null = null;
    const pick = () => {
      /* Two fifths down: high enough that a section counts once it is the
         thing being read, rather than only when it fills the screen. */
      const line = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const t of targets) {
        if (t.el.getBoundingClientRect().top <= line) current = t.href;
      }
      if (current !== last) {
        last = current;
        setActiveHref(current);
      }
    };

    /* Listened for rather than scrubbed. This ran on a ScrollTrigger over the
       document, and a trigger has to measure where the document ends — it had
       measured 17192 against a page that scrolls to 20795, so updates stopped
       3.6k pixels early and every one of them was in the footer. That is why
       Contact never lit: `pick` would have chosen it, and simply was not being
       called down there.

       Nothing here needs a trigger. There is no scrub, no pin and no start
       point, only a question asked on each frame that scrolls — which is the
       same shape the theme sampler above already uses, and has no measurement
       of its own to go stale. */
    let frame = 0;
    let fallback = 0;
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          pick();
        });
      }
      /* rAF can be throttled to a couple of frames a second in a hidden or
         backgrounded pane, which would leave the marker sitting on whichever
         section the reader last saw. Same guard the sampler above keeps. */
      window.clearTimeout(fallback);
      fallback = window.setTimeout(pick, 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    /* Deferred rather than called here: setting state straight from an effect
       body commits a render for it. */
    const raf = requestAnimationFrame(pick);

    return () => {
      cancelAnimationFrame(raf);
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Pinned sections make trigger-based theme detection unreliable, so
  // hit-test what is actually rendered underneath the bar instead.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let frame = 0;
    let cross = 0;

    const sample = () => {
      frame = 0;
      const stack = document.elementsFromPoint(
        window.innerWidth / 2,
        Math.min(56, window.innerHeight - 1),
      );
      for (const el of stack) {
        if (header.contains(el)) continue;
        const themed = el.closest("main [data-theme]");
        if (!themed) continue;
        const next =
          themed.getAttribute("data-theme") === "bone" ? "bone" : "ink";
        // Compared against a ref rather than written every sample: this runs
        // on every scroll frame, and the crossing has to be raised on the
        // change itself, not after a render has noticed one.
        if (next !== schemeRef.current) {
          schemeRef.current = next;
          setScheme(next);
          setCrossing(true);
          window.clearTimeout(cross);
          cross = window.setTimeout(() => setCrossing(false), 620);
        }
        return;
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
      window.clearTimeout(cross);
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

  /* The menu arrives as the opposite ground to the chapter it opened over:
     dark section, light menu. It is the loudest thing the site does, and it
     only works if it is always a change. The bar stands on that panel, so it
     takes the same treatment while the menu is open. */
  const menuScheme = scheme === "bone" ? "ink" : "bone";
  const barScheme = menuOpen ? menuScheme : scheme;
  const glass = barScheme === "bone" ? "bg-bone/72" : "bg-ink/64";

  return (
    <>
      <a href="#product" className="skip-link" onClick={scrollTo("#product")}>
        Skip to content
      </a>
      <header
        ref={headerRef}
        data-theme={barScheme}
        data-crossing={crossing || undefined}
        className={`nav-ground fixed inset-x-0 top-0 ${
          menuOpen ? "z-(--z-nav-over-menu)" : "z-(--z-nav)"
        }`}
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
              data-nav-glass
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
                      {/* This transition is for the pointer only; the bar
                          switches it off while it is crossing grounds. */}
                      <a
                        href={link.href}
                        onClick={scrollTo(link.href)}
                        data-cursor="link"
                        data-nav-link
                        aria-current={active ? "true" : undefined}
                        className={`type-label relative block py-2 transition-colors duration-300 ease-(--ease-swift) ${
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
              {/* Kept out of the nav list: it is an account action, not a
                  chapter of the page, and the list is what the scrollspy
                  marks. Hidden at the same breakpoint as the button, since
                  below it the mobile menu carries both. The outline against
                  the solid is the same pairing the hero makes of its two
                  calls — one invitation, one way back in. */}
              <span
                data-nav-link
                inert={gathered}
                className="nav-aside hidden sm:block"
              >
                <MagneticButton
                  href={LOGIN_HREF}
                  onClick={
                    LOGIN_HREF.startsWith("#")
                      ? scrollTo(LOGIN_HREF)
                      : undefined
                  }
                  variant="outline"
                  size="sm"
                >
                  Login
                </MagneticButton>
              </span>
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
                /* -mr-2 pays back the button's own slack. The tap target is
                   40px and the bars are 24px, so the icon sits 8px inside its
                   own box; without pulling the box out by that much, matching
                   the container padding on both sides still leaves the icon
                   8px further in than the wordmark. */
                className="relative -mr-2 flex size-10 flex-col items-center justify-center gap-[7px] lg:hidden"
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
        scheme={menuScheme}
        activeHref={activeHref}
      />
    </>
  );
}
