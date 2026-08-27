"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLenis } from "@/components/chrome/SmoothScroll";
import MagneticButton from "@/components/ui/MagneticButton";
import MobileMenu from "@/components/chrome/MobileMenu";
import { columnFor, linkHref } from "@/lib/menu";

/**
 * Anchors for a single-page site: every entry has to resolve to something on
 * this page. "Company" lands on the thesis, which is the company's position,
 * and "Resources" on the footer, where the reference links live.
 */
/* In the order the sections actually appear. Measured, not assumed: Identity
   points at #network, which is the fourth section down, while Services points
   at #solutions, which is the eighth — so reading the bar left to right used
   to walk the page out of sequence. */
/* The sub-menu.

   One panel that slides between the items rather than five that appear and
   vanish. The bar already has one dot that walks to the chapter you are in;
   a second thing that blinked in and out beside it would read as a different
   system bolted on. One width for all five, so the move is a pure translate
   and the panel never resizes under the pointer — the columns are five and
   six short labels, so the widest costs the narrowest nothing.

   Hover has intent: a short wait before opening, so a pointer crossing the
   bar on its way somewhere else does not drag a panel open behind it, and a
   longer one before closing, so the diagonal down to the panel is forgiving.
   Once a panel is open the next item switches to it immediately — the wait
   is for the first one only, which is the one that might not be meant. */
const PANEL_W = 280;
const OPEN_MS = 110;
const CLOSE_MS = 240;

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

/**
 * The wordmark is the mark: PIXELY with the brand's full stop, the square
 * pixel on the baseline. Its short form — P. — is the same mark contracted,
 * and the contraction is literal: as the bar gathers, the letters between
 * the P and the dot fold away and the dot docks against the initial. One
 * gesture, two lengths, and the travel between them is the word itself
 * closing up rather than one logo swapped for another.
 *
 * The tail rides `--nav-p`, which the header already scrubs, so outside the
 * header (the footer) the variable is unset and the mark stays long. The
 * clip is `overflow: clip`, not `hidden` — hidden makes the span a scroll
 * container and a scroll container's flex baseline is its border edge, which
 * floats the letters off the line the P sits on.
 *
 * The dot is sized in em so any font-size override scales the whole mark,
 * and it takes the accent token rather than raw blue so it lifts with the
 * chapter the bar is riding over, the same way the nav's marker dot does.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  /* The logo is a line being typed, once. P and the dot are always there —
     the server renders exactly that, so the first paint is P. — and after a
     beat the dot types the rest of the name and rests. The dot blinks like
     the caret it is; hovering the logo stills it (CSS, not state), and
     that is all hover does.

     The typed layer sits on a ghost of the full word, so the bar never
     moves while the name is typed: the footprint is always PIXELY-and-dot.
     Both tails fold with --nav-p, so the gathered pill still closes to P.
     — the ghost gives back the space exactly as the letters go. Below lg
     the travelling marker has no menu items to visit, so the dot never
     leaves the word there — that part lives in the stylesheet, scoped to
     the widths where the links exist. */
  const TAIL = "ixely";
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const targetRef = useRef(TAIL.length);
  const timer = useRef(0);
  const hostRef = useRef<HTMLSpanElement>(null);

  /* The stepper lives in a ref so the timeout chain can call itself
     without the closure-ordering knot a self-referencing callback ties. */
  const stepRef = useRef<() => void>(() => {});
  useEffect(() => {
    stepRef.current = () => {
      const d = targetRef.current - shownRef.current;
      if (d === 0) return;
      shownRef.current += Math.sign(d);
      setShown(shownRef.current);
      // Typing is deliberate, erasing is quicker — the same asymmetry the
      // hero's rotating word keeps.
      timer.current = window.setTimeout(() => stepRef.current(), d > 0 ? 92 : 48);
    };
  }, []);
  const run = useCallback((target: number) => {
    targetRef.current = target;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => stepRef.current(), 40);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Reduced motion gets the full name straight away; otherwise a blink's
    // worth of caret, then the typing.
    const t = window.setTimeout(
      () => {
        if (reduced) {
          shownRef.current = TAIL.length;
          setShown(TAIL.length);
        } else {
          run(TAIL.length);
        }
      },
      reduced ? 0 : 700,
    );
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(timer.current);
    };
  }, [run, TAIL.length]);

  const dotStyle = {
    width: "0.17em",
    height: "0.17em",
    marginLeft: "0.12em",
  } as const;

  return (
    <span
      ref={hostRef}
      className={`wordmark type-headline relative inline-flex items-baseline text-[1.1rem] tracking-[0.06em] ${className}`}
    >
      <span className="sr-only">Pixely</span>
      {/* The ghost: the full word's footprint, invisible, so nothing beside
          the logo ever moves while letters come and go. Its tail folds with
          the bar like the live one. */}
      <span aria-hidden className="invisible inline-flex items-baseline">
        P<span className="wordmark-tail">{TAIL}</span>
        <span className="inline-block" style={dotStyle} />
      </span>
      {/* The live line, typed over the ghost. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 inline-flex items-baseline"
      >
        P<span className="wordmark-tail">{TAIL.slice(0, shown)}</span>
        <span
          data-wm-dot
          className={`wordmark-home wm-caret inline-block bg-accent ${
            shown < TAIL.length ? "wm-typing" : ""
          }`}
          style={dotStyle}
        />
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
  /* Whether the bar is standing on the menu rather than on the page.
     Not the same as menuOpen at the closing end: the panel collapses to a
     lip the height of this bar and only disappears when that is done, so
     until then the ground under the bar is still the menu's. Dropping the
     treatment the moment the click lands is a light bar over a light panel
     for half a second — the bar appearing to vanish and come back. */
  const [overMenu, setOverMenu] = useState(false);
  /* The bar's ground crosses over 560ms as chapters pass under it. These two
     changes are not that: they happen while something is covering the bar,
     and easing through the mid-tones is exactly the moment it is unreadable.
     Both ends are switched, not crossed. */
  const [instant, setInstant] = useState(false);

  const menuTimers = useRef<number[]>([]);
  /* Set while the menu is open, read by the condense scrub. */
  const menuFrozen = useRef(false);
  useEffect(
    () => () => {
      menuTimers.current.forEach(window.clearTimeout);
      menuTimers.current = [];
    },
    [],
  );

  /* One place the menu is opened or shut from, because the bar's treatment
     has to be sequenced against it and three call sites doing that
     separately is three chances to get the order wrong. */
  /* Which ground the bar is standing on. Called by the panel on the frame
     its edge crosses the bar, in whichever direction — and by a backstop
     timer if that frame never comes. */
  const setBarGround = useCallback((next: boolean) => {
    setInstant(true);
    menuTimers.current.push(window.setTimeout(() => setInstant(false), 140));
    setOverMenu(next);
  }, []);

  const setMenu = useCallback((next: boolean) => {
    /* Anything still pending from the last toggle is about to be wrong.
       Closing schedules the bar's return for 560ms out; reopen inside that
       window and the timer still fires, dropping the bar back to the page's
       treatment while the menu is up — a light bar on a light panel, which
       is the very fault this sequencing exists to prevent. */
    menuTimers.current.forEach(window.clearTimeout);
    menuTimers.current = [];
    const later = (fn: () => void, ms: number) =>
      menuTimers.current.push(window.setTimeout(fn, ms));
    setMenuOpen(next);
    menuFrozen.current = next;
    /* Which ground the bar stands on is the panel's call, not a timer's: the
       wipe is eased, so the frame its edge crosses the bar is not a fixed
       distance from the click. This is only the backstop. */
    later(() => setBarGround(next), 900);
  }, [setBarGround]);

  /* The panel is lg:hidden, so widening past lg takes it away without
     telling React. The bar would be left riding at menu z-index in the
     forced ink treatment with nothing underneath it, so the state is closed
     at the same breakpoint the panel stops existing at. */
  useEffect(() => {
    if (!menuOpen) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    const shut = () => wide.matches && setMenu(false);
    shut();
    wide.addEventListener("change", shut);
    return () => wide.removeEventListener("change", shut);
  }, [menuOpen, setMenu]);
  /* The open sub-menu, and where its panel sits. `morph` is the difference
     between arriving and travelling: opening from nothing places the panel
     without animating, so it does not fly in from wherever it was left,
     while moving between items slides it. */
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [panel, setPanel] = useState({ x: 0, morph: false });
  const openMenuRef = useRef<string | null>(null);
  const openTimer = useRef(0);
  const closeTimer = useRef(0);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const panelRef = useRef<HTMLDivElement>(null);
  /* Which device opened it. A touch has no hover, so the first tap has to
     open the panel instead of following the link. */
  const lastPointer = useRef("mouse");

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
  /** Where a click has sent the page, held until it arrives. The spy below
   *  asks which section is under the reading line on every scrolled frame,
   *  and a click starts 1.6 seconds of scrolling that passes through every
   *  section in between — so a run from the cover to Contact had the marker
   *  stopping at Platform, then Identity, then Services, then Company, when
   *  the reader had asked for one move. The destination is known at the
   *  click; nothing the page passes over on the way there is a choice. */
  const glideTo = useRef<string | null>(null);
  const glideTimer = useRef(0);
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
      /* Held still while the menu is up. Opening the menu stops Lenis, which
         can nudge the scroll position, which runs this — and the bar is on
         top of the menu now, so the reader watches it re-gather itself to a
         width it had no reason to change to. */
      if (menuFrozen.current) return;
      navP.current = p;
      header.style.setProperty("--nav-p", p.toFixed(4));
      /* The tail's letters have faded by 0.75 (their opacity is
         1.5 - 2p), so from here the logo reads as P. alone — and the
         caret only blinks under the full name, so the stylesheet needs to
         know. Toggled, not set every frame. */
      const pOnly = p >= 0.75;
      if (pOnly !== header.hasAttribute("data-wm-compact")) {
        header.toggleAttribute("data-wm-compact", pOnly);
      }
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
      /* A glide owns the marker until it lands. `last` is deliberately left
         where it was: on release the spy compares the section it actually
         finds against the one it last chose for itself, which is what makes
         an interrupted glide correct itself instead of holding a stale
         answer. */
      if (glideTo.current) return;
      /* A section takes the marker when it has actually arrived: its top
         under the bar, the previous chapter gone. This line has been walked
         down twice — 0.4 lit items while a section filled barely half the
         screen, 0.22 still lit them while only the section's own ~15vh of
         opening padding had crossed — and both were rationalised as reading
         lines. The honest rule is the simple one: you are in a section when
         it is at the top of your screen. */
      const line = 96;
      let current: string | null = null;
      for (const t of targets) {
        if (t.el.getBoundingClientRect().top <= line) current = t.href;
      }
      /* The last chapter may be shorter than the screen, so its top can
         never reach the line — at the foot of the page it wins anyway. */
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        current = targets[targets.length - 1].href;
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

  /* A glide is over when the page arrives — or the moment the reader takes
     the scroll back, because a wheel or a finger mid-flight is Lenis
     abandoning the run, and a run that was abandoned never reports that it
     finished. Without this the marker would sit on the destination while the
     page went somewhere else entirely. */
  useEffect(() => {
    const drop = () => {
      glideTo.current = null;
    };
    const taken = ["wheel", "touchstart", "keydown"] as const;
    for (const e of taken) window.addEventListener(e, drop, { passive: true });
    return () => {
      for (const e of taken) window.removeEventListener(e, drop);
      window.clearTimeout(glideTimer.current);
    };
  }, []);

  /* Held for the length of the run, so the spy cannot walk the marker
     through every section the page crosses on the way. Its own callback
     rather than the handler's body: scrollTo is curried and called from the
     markup, so everything written inside it counts as render. */
  const glide = useCallback(
    (href: string, el: Element) => {
      glideTo.current = href;
      window.clearTimeout(glideTimer.current);
      const land = () => {
        if (glideTo.current === href) glideTo.current = null;
      };
      if (lenis) {
        // The menu stops Lenis while it is open so the page behind cannot
        // scroll, and a stopped instance drops scrollTo silently. Resume
        // first: closing the menu is precisely when scrolling should resume.
        lenis.start();
        lenis.scrollTo(el as HTMLElement, { duration: 1.6, onComplete: land });
        // A backstop, because a run that cannot reach its target — the last
        // section, against the end of the document — settles without ever
        // calling back.
        glideTimer.current = window.setTimeout(land, 2000);
      } else {
        el.scrollIntoView({ behavior: "smooth" });
        glideTimer.current = window.setTimeout(land, 1400);
      }
    },
    [lenis],
  );

  const stopMenuTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);

  const openSub = useCallback(
    (href: string, now: boolean) => {
      stopMenuTimers();
      if (!columnFor(href)) {
        /* An item with nothing under it still closes whatever was open —
           moving onto Contact should put the panel away, not leave the last
           one hanging over a link it has nothing to do with. */
        openMenuRef.current = null;
        setOpenMenu(null);
        return;
      }
      const show = () => {
        const item = itemRefs.current.get(href);
        const nav = navRef.current;
        if (item && nav) {
          const x =
            item.offsetLeft + item.offsetWidth / 2 - PANEL_W / 2;
          setPanel({ x, morph: openMenuRef.current !== null });
        }
        openMenuRef.current = href;
        setOpenMenu(href);
      };
      if (now || openMenuRef.current !== null) show();
      else openTimer.current = window.setTimeout(show, OPEN_MS);
    },
    [stopMenuTimers],
  );

  const closeSub = useCallback(
    (now: boolean) => {
      stopMenuTimers();
      const shut = () => {
        openMenuRef.current = null;
        setOpenMenu(null);
      };
      if (now) shut();
      else closeTimer.current = window.setTimeout(shut, CLOSE_MS);
    },
    [stopMenuTimers],
  );

  /* Scrolling puts it away. The panel hangs off a bar that is itself
     condensing as the page moves, and a menu left open through that reads as
     something that has come loose. */
  useEffect(() => {
    if (!openMenu) return;
    const shut = () => closeSub(true);
    window.addEventListener("scroll", shut, { passive: true });
    return () => window.removeEventListener("scroll", shut);
  }, [openMenu, closeSub]);

  useEffect(() => stopMenuTimers, [stopMenuTimers]);

  const scrollTo = (href: string) => (e: React.MouseEvent) => {
    const el = document.querySelector(href);
    // Let the browser handle anything we cannot resolve, rather than
    // swallowing the click and going nowhere.
    if (!el) return;
    e.preventDefault();
    setMenu(false);
    setActiveHref(href);
    glide(href, el);
  };

  /* One dot with two states: at rest it IS the wordmark's full stop, and
     when a section is active it leaves the logo and stands beside that menu
     item. The in-flow dot in the wordmark is the "home" — real layout, so it
     rides every wordmark animation — and this marker is the traveller. The
     handoff is a crossfade at the same coordinates, so there is never a
     frame with two dots or none. */
  const placeDot = useCallback((href: string | null, glide: boolean) => {
    const dot = dotRef.current;
    const nav = navRef.current;
    const header = headerRef.current;
    if (!dot || !nav || !header) return;
    const home = header.querySelector<HTMLElement>("[data-wm-dot]");
    if (!home) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const navBox = nav.getBoundingClientRect();
    const homeBox = home.getBoundingClientRect();
    const size = Math.max(2, homeBox.width);
    gsap.set(dot, { width: size, height: size });

    const index = NAV_LINKS.findIndex((l) => l.href === href);

    if (index < 0) {
      // Going home. Glide back to the wordmark, then hand over to the
      // in-flow dot and step aside. The click that sends the page to the
      // top also gathers or opens the bar mid-flight, so the coordinates
      // measured at launch can be stale by landing — re-measure there,
      // snap the last pixel, and only then swap.
      const land = () => {
        const nb = nav.getBoundingClientRect();
        const hb = home.getBoundingClientRect();
        gsap.set(dot, { x: hb.left - nb.left, y: hb.top - nb.top });
        header.removeAttribute("data-dot-away");
        gsap.to(dot, { opacity: 0, duration: 0.15, overwrite: true });
      };
      if (glide && dotPlaced.current && !reduced) {
        gsap.to(dot, {
          x: homeBox.left - navBox.left,
          y: homeBox.top - navBox.top,
          duration: 0.55,
          ease: "expo.out",
          overwrite: true,
          onComplete: land,
        });
      } else {
        land();
      }
      return;
    }

    const link = nav.querySelectorAll("a")[index];
    if (!link) return;
    const target = () => {
      const nb = nav.getBoundingClientRect();
      const box = link.getBoundingClientRect();
      return {
        x: box.left - nb.left - 12,
        y: box.top - nb.top + box.height / 2 - size / 2,
      };
    };
    const { x, y } = target();

    // Leaving home: appear exactly over the wordmark's dot as it hides,
    // then travel. From a link, just travel.
    const away = header.hasAttribute("data-dot-away");
    if (!away) {
      header.setAttribute("data-dot-away", "");
      gsap.set(dot, {
        x: homeBox.left - navBox.left,
        y: homeBox.top - navBox.top,
        opacity: 1,
      });
    }
    /* Glide whenever motion is wanted and allowed. This used to also ask
       dotPlaced — "the first selection should appear in place rather than
       fly in from the corner" — which predates the home: a departure now
       always has a known origin, because the block above just parked the
       marker on the wordmark's own dot. Keeping the guard meant the very
       first journey after load teleported, and only the second travelled. */
    if (glide && !reduced) {
      gsap.to(dot, {
        x,
        y,
        opacity: 1,
        duration: 0.55,
        ease: "expo.out",
        overwrite: true,
        // The bar gathers while the page glides, and the launch-time
        // numbers go stale with it. Nav-internal drift is small; the snap
        // clears the residue.
        onComplete: () => gsap.set(dot, target()),
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
    setMenu(!menuOpen);
  }, [menuOpen, setMenu]);

  /* The menu arrives as the opposite ground to the chapter it opened over:
     dark section, light menu. It is the loudest thing the site does, and it
     only works if it is always a change. The bar stands on that panel, so it
     takes the same treatment while the menu is open. */
  const menuScheme = scheme === "bone" ? "ink" : "bone";
  const barScheme = overMenu ? menuScheme : scheme;
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
        data-instant={instant || undefined}
        data-wm-short={menuOpen || undefined}
        className={`nav-ground fixed inset-x-0 top-0 ${
          menuOpen || overMenu ? "z-(--z-nav-over-menu)" : "z-(--z-nav)"
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
              /* Both handlers sit here rather than on the list, because the
                 panel is a child of this element: the pointer moving from an
                 item down into the panel never leaves the nav, so nothing has
                 to guess at a safe corridor between the two. */
              onPointerLeave={() => closeSub(false)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  closeSub(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key !== "Escape" || !openMenuRef.current) return;
                const back = itemRefs.current
                  .get(openMenuRef.current)
                  ?.querySelector("a");
                closeSub(true);
                back?.focus();
              }}
            >
              {/* The travelling dot: the wordmark's own full stop, off on an
                  errand. It lives INSIDE the nav list on purpose — the
                  list's internal layout is constant while the bar gathers,
                  so a dot parked beside a link cannot drift as the chrome
                  condenses around it. The wordmark sits outside, but the
                  nav is unclipped, so the trip home is just a negative x.
                  Square, because the brand's dot is the lit pixel, and
                  sized at placement from the wordmark's real dot so the
                  handoff between the two is seamless. */}
              <span
                ref={dotRef}
                aria-hidden
                style={{ opacity: 0 }}
                className="pointer-events-none absolute top-0 left-0 z-10 bg-accent"
              />
              {/* gap-11, up from 9: the logo's ghost holds the bar still
                  while it types, and the erased state leaves the row lighter
                  on the left — the items take the room as air. */}
              <ul className="flex items-center gap-11">
                {NAV_LINKS.map((link) => {
                  const active = activeHref === link.href;
                  const column = columnFor(link.href);
                  const isOpen = openMenu === link.href;
                  return (
                    <li
                      key={link.href}
                      ref={(el) => {
                        if (el) itemRefs.current.set(link.href, el);
                        else itemRefs.current.delete(link.href);
                      }}
                      onPointerEnter={(e) => {
                        if (e.pointerType === "touch") return;
                        openSub(link.href, false);
                      }}
                    >
                      {/* This transition is for the pointer only; the bar
                          switches it off while it is crossing grounds. */}
                      <a
                        href={link.href}
                        id={`nav-item-${link.href.slice(1)}`}
                        onPointerDown={(e) => {
                          lastPointer.current = e.pointerType;
                        }}
                        onClick={(e) => {
                          /* No hover on a touch screen, so the first tap has
                             to be the one that opens the panel. The second
                             follows the link, which is what a tap on an item
                             already showing its menu can only mean. */
                          if (
                            lastPointer.current === "touch" &&
                            column &&
                            !isOpen
                          ) {
                            e.preventDefault();
                            openSub(link.href, true);
                            return;
                          }
                          closeSub(true);
                          scrollTo(link.href)(e);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "ArrowDown" || !column) return;
                          /* Down opens it and steps in, which is where a
                             keyboard expects to go once an item says it has a
                             menu. Focus alone deliberately does not open it:
                             tabbing along the bar to reach Login would drag
                             four panels open on the way, and Escape — which
                             has to hand focus back to the item it came from —
                             would be met by the item opening it again. */
                          e.preventDefault();
                          openSub(link.href, true);
                          requestAnimationFrame(() =>
                            panelRef.current?.querySelector("a")?.focus(),
                          );
                        }}
                        data-cursor="link"
                        data-nav-link
                        aria-current={active ? "true" : undefined}
                        aria-haspopup={column ? "true" : undefined}
                        aria-expanded={column ? isOpen : undefined}
                        aria-controls={column ? "nav-submenu" : undefined}
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

              {/* One panel, moved. The padding is on the outside so the gap
                  between the bar and the panel is still part of this element
                  — a pointer crossing it has not left the menu. */}
              <div
                ref={panelRef}
                id="nav-submenu"
                data-nav-panel
                data-open={openMenu ? "" : undefined}
                data-morph={panel.morph ? "" : undefined}
                aria-labelledby={
                  openMenu ? `nav-item-${openMenu.slice(1)}` : undefined
                }
                aria-hidden={openMenu ? undefined : true}
                onPointerEnter={stopMenuTimers}
                className="absolute top-full left-0 pt-4"
                style={{ width: PANEL_W, transform: `translateX(${panel.x}px)` }}
              >
                {(() => {
                  const column = openMenu ? columnFor(openMenu) : null;
                  if (!column) return null;
                  return (
                    <div
                      key={column.href}
                      className="rounded-(--radius-panel) border border-(--line) bg-(--nav-panel-fill) p-5 backdrop-blur-xl"
                    >
                      <p className="type-label mb-4 leading-relaxed text-(--faint)">
                        {column.note}
                      </p>
                      <ul className="flex flex-col gap-1">
                        {column.links.map((link, i) => {
                          const href = linkHref(column, link);
                          return (
                            <li
                              key={link.label}
                              className="nav-panel-item"
                              style={
                                { "--i": i } as React.CSSProperties
                              }
                            >
                              <a
                                href={href}
                                tabIndex={openMenu ? undefined : -1}
                                onClick={(e) => {
                                  closeSub(true);
                                  scrollTo(href)(e);
                                }}
                                data-cursor="link"
                                className="-mx-2 block rounded-(--radius-mock) px-2 py-1.5 text-[0.88rem] text-(--muted) transition-colors duration-200 hover:bg-(--surface) hover:text-accent focus-visible:bg-(--surface) focus-visible:text-accent"
                              >
                                {link.label}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })()}
              </div>
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
        onClose={() => setMenu(false)}
        onNavigate={scrollTo}
        navP={menuNavP}
        scheme={menuScheme}
        activeHref={activeHref}
        onBarGround={setBarGround}
      />
    </>
  );
}
