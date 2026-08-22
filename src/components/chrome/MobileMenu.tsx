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
  /** Fired on the frame the panel's edge crosses the bar, in whichever
   *  direction it is travelling, so the bar changes ground exactly then. A
   *  timer cannot do this: the wipe is eased, so that frame is not a fixed
   *  number of milliseconds from the click. */
  onBarGround: (overMenu: boolean) => void;
};

/** Full-screen ink overlay menu for touch / narrow viewports. */
export default function MobileMenu({
  open,
  onClose,
  onNavigate,
  navP,
  scheme,
  activeHref,
  onBarGround,
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

    /* Shut, the panel is not fully collapsed — it keeps a lip exactly the
       height of the bar. The bar takes the menu's treatment the instant the
       menu opens, so if the panel started at zero height it would be a bone
       bar over a still-dark page for the first third of a second, which is
       the bar appearing to vanish and come back. With the lip, the ground
       under the bar is the menu's from the very first frame. */
    const lip = Math.ceil(
      panel
        .querySelector("[data-menu-lip]")
        ?.getBoundingClientRect().height ?? 72,
    );
    /* Driven as a height rather than a percentage clip, because both ends
       need to know where the edge actually is: opening starts at the bar's
       height so the bar is covered from the first frame, and closing has to
       report the frame it passes back under that height. */
    const full = panel.getBoundingClientRect().height || window.innerHeight;
    const clipTo = (h: number) => {
      panel.style.clipPath = `inset(0px 0px ${Math.max(0, full - h)}px 0px)`;
    };
    /* The cursor reads its ink from whatever is under it, and the thing
       under it is about to change without the pointer moving at all. Told on
       every frame of the wipe, so the ink turns as the edge passes beneath
       it rather than whenever the reader next happens to move. */
    const sync = () =>
      window.dispatchEvent(new CustomEvent("pixely:cursor-resync"));
    /* Half the bar's height: while the edge is crossing the wordmark the
       panel is behind the letters' top and the page behind their bottom, so
       no ink is right for both. The change goes to the middle of that
       crossing, where the error is smallest — and to the same point in both
       directions, so opening and closing are each other's reverse. */
    const handover = lip * 0.5;

    if (open) {
      lenis?.stop();
      panel.style.visibility = "visible";
      panel.style.pointerEvents = "auto";
      if (reduced) {
        gsap.set(panel, { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 });
        gsap.set([links, meta], { yPercent: 0, opacity: 1 });
        onBarGround(true);
        sync();
      } else {
        /* From nothing, on the closing curve reversed. It used to start at
           the bar's height so the bar was covered from the first frame —
           which put a 72px strip on screen instantly, and then expo.inOut
           held it there for a quarter of a second before sweeping. That
           reads as two movements: a jump, then the wipe. One movement means
           starting where the close ends. */
        const grow = { h: 0 };
        let handed = false;
        clipTo(0);
        gsap
          .timeline()
          .set(panel, { opacity: 1 })
          .to(grow, {
            h: full,
            duration: 0.55,
            ease: "expo.inOut",
            onUpdate: () => {
              clipTo(grow.h);
              sync();
              if (!handed && grow.h >= handover) {
                handed = true;
                onBarGround(true);
              }
            },
          })
          .fromTo(
            links,
            { yPercent: 120 },
            {
              yPercent: 0,
              duration: 0.8,
              stagger: 0.06,
              ease: "expo.out",
            },
            "-=0.2",
          )
          .fromTo(
            meta,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 },
            "-=0.42",
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
        onBarGround(false);
        sync();
      } else {
        /* The same gesture, run backwards. It used to fade, which read as a
           different thing happening: the panel comes down over the page, so
           it should go back up off it. Same curve, a touch quicker, because
           leaving should never feel as deliberate as arriving.

           All the way to nothing, not back to the lip. Stopping at the lip
           left a strip the height of the bar still painted, which then went
           out with visibility — a snap at the end of a smooth close. */
        /* One movement, not two. It was split so the last stretch could
           clear the bar quickly, and the seam showed: down in one go and up
           in one go is the whole gesture, and a stage change reads as the
           panel thinking about it. Same curve as the opening, reversed. */
        const shrink = { h: full };
        let handedBack = false;
        gsap.to(shrink, {
          h: 0,
          duration: 0.55,
          ease: "expo.inOut",
          onUpdate: () => {
            clipTo(shrink.h);
            sync();
            if (!handedBack && shrink.h <= handover) {
              handedBack = true;
              onBarGround(false);
            }
          },
          onComplete: () => {
            panel.style.visibility = "hidden";
            panel.style.pointerEvents = "none";
            sync();
          },
        });
      }
    }
  }, [open, lenis, onBarGround]);

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
        data-menu-lip
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

        {/* The bar's corner controls, for the widths where the bar has not
            got them — as the controls they are, not as two more chapters on
            the list. They were numbered 06 and 07 in among the sections,
            which read as places on the page rather than things to press.

            Get started only below sm. From sm the bar carries it, and a
            reader who can see it in the bar behind this panel does not need
            it offered again three inches lower; two of the same button is a
            question about whether they do the same thing. Login stays at
            every width — the bar drops it as it condenses, so this is the
            only place it is certain to be.

            Same block at every width, and set against the words rather than
            the margin. The list is an index column and then a label; the
            labels are what the eye takes as the left edge of this menu, so
            that is where these start — ms-11 is the index column and its gap
            (w-7 plus gap-4), both fixed, so the two line up at any width.

            Flush with the padding it sat under the numbers instead, which at
            sm put it 44px left of every word above it. Centring hid that on
            a phone by landing 12px off the labels, near enough to pass.

            Letting them size to their words was tried twice and failed
            twice: as a pair "Get started" came out half again "Login", and
            alone Login shrank to ninety-nine pixels and read as a footnote
            under type five times its height. */}
        <div
          data-menu-meta
          className="mt-9 ms-11 flex max-w-[16.5rem] flex-col items-stretch gap-3"
          inert={!open || undefined}
        >
          {/* Wrapped rather than given `sm:hidden` directly: the button's own
              inline-flex is the same specificity and wins by CSS order. */}
          <span className="block w-full sm:hidden">
            <MagneticButton
              href="#start"
              onClick={onNavigate("#start")}
              className="w-full justify-center"
            >
              Get started
            </MagneticButton>
          </span>
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
          © 2026 Pixely, SARL.
        </div>
        <div data-menu-meta className="type-label text-(--muted)">
          hello@pixely.dz
        </div>
      </div>
    </div>
  );
}
