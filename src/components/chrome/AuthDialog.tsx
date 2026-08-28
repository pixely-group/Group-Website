"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useLenis } from "@/components/chrome/SmoothScroll";
import MagneticButton from "@/components/ui/MagneticButton";
import { inspect, looksFinished, type Check } from "@/lib/email";

/**
 * Sign in and create an account, in one dialog.
 *
 * A dialog rather than a page, because every way in — the bar, the compact
 * menu — is on this one page, and a route would drop the reader out of the
 * scroll to authenticate against a different document. When there is a
 * backend this can be backed by /login without being redesigned: the panel
 * is the presentation, and the URL is a separate decision.
 *
 * One panel with two modes rather than two dialogs. Presenting them as
 * separate destinations makes a reader who guessed wrong start over, and the
 * swap here costs them nothing.
 *
 * Signing in takes no password: an address, and a link lands in the inbox.
 * The two modes therefore differ by more than a field, and each is rendered
 * at its own height rather than padded to a shared one. The panel is pinned
 * to the top of the viewport, so a taller mode grows downward from a fixed
 * top edge instead of leaving the shorter one with dead space above the
 * fold.
 *
 * NOTHING IS SENT. There is no backend to send it to, so the form holds its
 * values in local state, submits to a notice rather than a server, and
 * stores nothing anywhere. That notice is deliberate and it is the honest
 * state of this: a field that quietly accepts a real password and does
 * nothing with it is worse than one that says so.
 */

type Mode = "in" | "up";

/* The marks are the providers' own. Drawn rather than fetched — the CSP here
   admits no image host, and a sign-in button whose logo silently fails to
   load is a button nobody trusts. */
function GoogleMark() {
  /* The gradient G Google moved to in 2025 — the four canonical colours
     bleeding through the seams instead of butting against them. Google does
     not publish the vector, so this is the same four-segment geometry with
     each segment's gradient handing off to its neighbour's colour: red into
     yellow across the top, yellow into green down the left, green into blue
     along the bottom (teal falls out of that blend on its own), and the blue
     bar deepening as it rises. The stops hold their own colour past the
     midpoint so each region still reads as itself at 17px. */
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="px-g-red" gradientUnits="userSpaceOnUse" x1="19" y1="3" x2="3" y2="7">
          <stop offset="0" stopColor="#EA4335" />
          <stop offset="0.55" stopColor="#EA4335" />
          <stop offset="1" stopColor="#FBBC04" />
        </linearGradient>
        <linearGradient id="px-g-yellow" gradientUnits="userSpaceOnUse" x1="3" y1="7" x2="3.5" y2="17">
          <stop offset="0" stopColor="#FBBC04" />
          <stop offset="0.5" stopColor="#FBBC04" />
          <stop offset="1" stopColor="#34A853" />
        </linearGradient>
        <linearGradient id="px-g-green" gradientUnits="userSpaceOnUse" x1="4" y1="22" x2="19.5" y2="19">
          <stop offset="0" stopColor="#34A853" />
          <stop offset="0.55" stopColor="#34A853" />
          <stop offset="1" stopColor="#4285F4" />
        </linearGradient>
        <linearGradient id="px-g-blue" gradientUnits="userSpaceOnUse" x1="17" y1="21" x2="22" y2="10">
          <stop offset="0" stopColor="#4285F4" />
          <stop offset="1" stopColor="#2A6DE9" />
        </linearGradient>
      </defs>
      <path
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55z"
        fill="url(#px-g-blue)"
      />
      <path
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.7v2.98A11.5 11.5 0 0 0 12 23.5z"
        fill="url(#px-g-green)"
      />
      <path
        d="M5.55 14.18a6.9 6.9 0 0 1 0-4.36V6.84H1.7a11.5 11.5 0 0 0 0 10.32l3.85-2.98z"
        fill="url(#px-g-yellow)"
      />
      <path
        d="M12 4.98c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.55 15.11.5 12 .5A11.5 11.5 0 0 0 1.7 6.84l3.85 2.98C6.46 7.1 9 4.98 12 4.98z"
        fill="url(#px-g-red)"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 12.54c-.02-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.02 2.28-1.27 3.13-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.75-4.13z" />
      <path d="M14.6 4.6c.71-.87 1.19-2.07 1.06-3.27-1.02.04-2.26.68-3 1.54-.66.77-1.24 2-1.08 3.18 1.14.09 2.3-.58 3.02-1.45z" />
    </svg>
  );
}

/** The verdict, drawn. A tick that draws itself on and a cross that draws
 *  itself in are the same gesture at two outcomes — and the stroke is dashed
 *  to its own length, so each one arrives rather than appearing. */
function Verdict({ state }: { state: "checking" | "good" | "bad" }) {
  return (
    <span
      key={state}
      aria-hidden
      className="verdict pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
      data-state={state}
    >
      {state === "checking" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
          <path
            className="verdict-spin"
            d="M8 2a6 6 0 0 1 6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : state === "good" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            className="verdict-draw"
            d="M3 8.4 6.4 11.8 13 5.2"
            pathLength={100}
            stroke="var(--color-positive)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            className="verdict-draw"
            d="M4 4l8 8M12 4l-8 8"
            pathLength={100}
            stroke="var(--color-negative)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}

/* A password being built, not a form being failed.

   Three boxes waiting to be ticked is a list of everything you have not done
   yet, presented all at once, and it is the same list on every site anyone
   has ever signed up to. This says one thing at a time — the next thing —
   and the bar underneath keeps the score. A fourth segment past the
   requirement, unnamed, because length is worth more than any rule and
   there should be somewhere further to go than "acceptable". */
const RULES = [
  {
    id: "len",
    met: (v: string) => v.length >= 8,
    next: (v: string) =>
      `${8 - v.length} more character${8 - v.length === 1 ? "" : "s"}`,
  },
  { id: "num", met: (v: string) => /\d/.test(v), next: () => "a number" },
  { id: "cap", met: (v: string) => /[A-Z]/.test(v), next: () => "a capital" },
  /* No `next`: nothing asks for this, it is just further. */
  { id: "long", met: (v: string) => v.length >= 12, next: null },
];

function Strength({ value }: { value: string }) {
  const met = RULES.map((rule) => rule.met(value));
  const core = met.slice(0, 3).filter(Boolean).length;
  const enough = core === 3;
  /* One segment lights the moment anything is typed — a meter that stays
     dark through the first seven characters looks broken, and "very weak"
     is an honest score for them. */
  const lit = value ? Math.max(met.filter(Boolean).length, 1) : 0;
  /* The traffic light: red while one requirement or none is met, amber at
     two, green at all three — and the fourth segment is extra credit for
     length, past which there is nothing left to ask. */
  const tier = !value
    ? undefined
    : enough
      ? met[3]
        ? "strong"
        : "good"
      : core >= 2
        ? "mid"
        : "weak";
  const wanting = RULES.find((rule, i) => !met[i] && rule.next);

  const label = !value
    ? "Make it hard to guess."
    : wanting
      ? `Needs ${wanting.next!(value)}.`
      : met[3]
        ? "Strong."
        : "Good. Longer is stronger.";

  return (
    <div className="mt-3">
      <div className="strength-row flex gap-1.5" aria-hidden data-tier={tier}>
        {RULES.map((rule, i) => (
          <span
            key={rule.id}
            className="strength-seg h-[3px] flex-1 rounded-full"
            data-on={i < lit || undefined}
            style={{ animationDelay: `${i * 30}ms` }}
          />
        ))}
      </div>
      <p
        /* The bar is the judge; this stays the helper, naming the next step
           in neutral until there is something to celebrate. Red guidance
           under a field reads as an error, and an unfinished password is
           not one yet. */
        aria-live="polite"
        className="mt-2 text-[0.8rem] leading-relaxed transition-colors duration-300"
        style={{ color: enough ? "var(--color-positive)" : "var(--faint)" }}
      >
        {label}
      </p>
    </div>
  );
}

/** A legal document, linked from inside the form it governs. It opens in a
 *  new tab on purpose: the reader is mid-sign-up with a half-typed form, and
 *  a same-tab navigation throws that away to show them boilerplate. The
 *  arrow says so before they click. */
function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      data-cursor="link"
      className="inline-flex items-baseline gap-[0.35em] text-(--muted) underline decoration-1 underline-offset-4 transition-colors duration-200 hover:text-accent"
    >
      {children}
      <svg
        width="7"
        height="7"
        viewBox="0 0 8 8"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M1.5 6.5 6.5 1.5M2.5 1.5h4v4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function Provider({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      data-cursor="link"
      className="type-label flex w-full items-center justify-center gap-3 rounded-(--radius-control) border border-(--line-strong) py-3 text-(--fg) transition-colors duration-200 hover:bg-(--surface) focus-visible:bg-(--surface)"
    >
      {children}
      {label}
    </button>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  onBlur,
  tone,
  note,
  mark,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  /** Colours the rule under the field. Absent means nothing is known yet,
   *  which is not the same as nothing being wrong. */
  tone?: "good" | "warn" | "bad";
  note?: React.ReactNode;
  /** Drawn inside the field's right edge, where the answer belongs — beside
   *  what was typed rather than underneath it. */
  mark?: React.ReactNode;
}) {
  const edge =
    tone === "bad"
      ? "border-(--color-negative)"
      : tone === "warn"
        ? "border-(--color-signal-lift)"
        : tone === "good"
          ? "border-(--color-positive)"
          : "border-(--line)";
  return (
    <div>
      <label htmlFor={id} className="block">
        <span className="type-label block text-(--faint)">{label}</span>
        <span className="relative mt-2 block">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-describedby={note ? `${id}-note` : undefined}
          aria-invalid={tone === "bad" || undefined}
          className={`block w-full rounded-(--radius-control) border bg-(--surface) py-3 pr-11 pl-4 text-[0.95rem] text-(--fg) outline-none transition-colors duration-200 placeholder:text-(--faint) focus:bg-transparent ${edge}`}
        />
        {mark}
        </span>
      </label>
      {note && (
        <p
          id={`${id}-note`}
          /* Polite: it speaks when the typing stops, rather than interrupting
             every keystroke with a half-finished address. */
          aria-live="polite"
          className="mt-2 text-[0.8rem] leading-relaxed text-(--muted)"
        >
          {note}
        </p>
      )}
    </div>
  );
}

export default function AuthDialog({
  open,
  onClose,
  initialMode = "in",
}: {
  open: boolean;
  onClose: () => void;
  /** Which pane the trigger promised. Login opens Sign in; Get started opens
   *  Create account — a panel that disagrees with its button has lost. */
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  /* Adjusted during render, React's own pattern for a changed prop: when a
     different trigger opens the panel, its promise wins over whatever the
     pair was left on. */
  const [prevInitial, setPrevInitial] = useState(initialMode);
  if (initialMode !== prevInitial) {
    setPrevInitial(initialMode);
    setMode(initialMode);
  }
  const [email, setEmail] = useState("");
  const [check, setCheck] = useState<Check | null>(null);
  const [checking, setChecking] = useState(false);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  /* Which connectors are live, asked once per open. The buttons check before
     they navigate, so an unactivated one says so instead of bouncing off a
     503 into nothing. */
  const [live, setLive] = useState<{ google: boolean; apple: boolean } | null>(
    null,
  );

  /* Closing clears what was typed. Done here rather than from an effect
     watching `open`, because it is a consequence of the close itself — there
     is no external state to synchronise with, and a password should not sit
     in memory behind a dismissed panel. */
  const close = useCallback(() => {
    setNotice(null);
    setPassword("");
    setCheck(null);
    setChecking(false);
    /* The pending check is deliberately left alone. Touching it from here
       would put `job` inside a memoised callback, and the compiler will not
       let a ref be captured by a hook and written outside one — and there is
       nothing to gain: the email stays in the field across a close, so a
       reply landing a moment later is about the address still sitting there
       rather than a stale one. */
    /* Back to whatever the trigger promised. Reopening on the pane someone
       wandered to last is the panel arguing with the button that summoned
       it. */
    setMode(initialMode);
    onClose();
  }, [onClose, initialMode]);

  /* The check in flight: which address it is about, and the timer waiting to
     send it. One object rather than two refs — a reply that arrives after
     the field has moved on is dropped by comparing against `address`, and
     holding the pair together says they belong to the same question. */
  const job = useRef({ address: "", timer: 0 });

  /* A plain function, not a useCallback: it is only ever called from an
     event handler, never from an effect's dependency list, so memoising it
     buys nothing — and writing the debounce ref from inside a memoised
     callback is what the compiler objects to. */
  const verify = (value: string, now = false) => {
    window.clearTimeout(job.current.timer);
    const address = value.trim();
    job.current.address = address;

    if (!address) {
      setCheck(null);
      setChecking(false);
      return;
    }

    const run = () => {
      /* Everything decidable here is decided here — a malformed address
         should never cost a round trip. */
      const local = inspect(address);
      setCheck(local.verdict === "ok" ? null : local);
      if (local.final) {
        setChecking(false);
        return;
      }

      setChecking(true);
      window.setTimeout(async () => {
        try {
          const res = await fetch("/api/verify-email", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: address }),
          });
          const result = (await res.json()) as Check;
          if (job.current.address !== address) return;
          setCheck(result);
        } catch {
          if (job.current.address !== address) return;
          setCheck(null);
        } finally {
          if (job.current.address === address) setChecking(false);
        }
      }, 0);
    };

    if (now) {
      run();
      return;
    }

    /* Real time means answering when there is something to answer, not on a
       fixed wait. An address that has been finished — a name, an @, a domain
       with a dot and a real ending — gets checked almost at once, so the tick
       lands as the last character does. One that has not is left alone: the
       syntax check is instant and would put a red cross beside "amine@gmail"
       on the way to "amine@gmail.com", which is a verdict on something nobody
       has finished saying. That one waits, and blur asks immediately. */
    setCheck(null);
    setChecking(false);
    job.current.timer = window.setTimeout(run, looksFinished(address) ? 150 : 900);
  };

  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const lenis = useLenis();
  const titleId = useId();

  useEffect(() => {
    if (!open || live) return;
    let gone = false;
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((d) => {
        if (!gone) setLive({ google: !!d.google, apple: !!d.apple });
      })
      .catch(() => {
        if (!gone) setLive({ google: false, apple: false });
      });
    return () => {
      gone = true;
    };
  }, [open, live]);

  /* The page underneath holds still, and the element that opened this gets
     the focus back when it closes — otherwise a keyboard lands at the top of
     the document having lost its place entirely. */
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    lenis?.stop();
    /* The panel itself, not its first control. First in the DOM is the close
       button, so focusing a control would open this by announcing "Close" —
       and focusing the email field instead throws a keyboard up over the
       panel on a touch screen. Landing on the panel reads its title, and Tab
       goes on from there in the order the thing is actually laid out. */
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      lenis?.start();
      returnTo.current?.focus({ preventScroll: true });
    };
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      /* Everything focusable is inside the panel here, so the ring can be
         queried rather than assembled the way the compact menu has to. */
      /* Anything deliberately out of the tab order stays out of the ring —
         the unselected tab and the scrim carry tabindex -1, and everything
         inside an inert region (the resting pane, the emptied legal foot) is
         unfocusable however focusable it looks to a query. Wrapping onto a
         control the browser skips would drop the trap on the floor. */
      const ring = [
        ...(panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]):not([tabindex="-1"]), input:not([disabled])',
        ) ?? []),
      ].filter((el) => !el.closest("[inert]"));
      if (!ring.length) return;
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const signingUp = mode === "up";
  const pending = () =>
    setNotice(
      "Accounts are not connected yet — this is the interface, and nothing has been sent.",
    );

  return (
    <div
      data-theme="ink"
      aria-hidden={!open}
      inert={!open || undefined}
      className={`fixed inset-0 z-(--z-dialog) flex items-start justify-center overflow-y-auto px-6 py-[max(2.5rem,10vh)] transition-opacity duration-300 ease-(--ease-out-expo) ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* The ground the page is read against, dimmed rather than hidden — the
          reader has not left the page, they have something in front of it. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 cursor-default bg-ink/72 backdrop-blur-md"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`auth-panel relative w-full max-w-[27rem] rounded-(--radius-panel) border border-(--line) bg-ink-2 p-8 text-(--fg) shadow-[0_40px_90px_-30px_rgb(0_0_0/0.7)] ${
          open ? "is-open" : ""
        }`}
      >
        <button
          type="button"
          onClick={close}
          data-cursor="link"
          className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full text-(--muted) transition-colors duration-200 hover:bg-(--surface) hover:text-(--fg)"
        >
          <span className="sr-only">Close</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>

        {/* The wordmark at the size the rest of the site sets it: the
            headline face, tracked 0.06em, with the full stop at 0.17em and
            0.12 after the word. It was type-label with a 0.5em dot — three
            times the brand's ratio, on the wrong face. */}
        <span className="type-headline inline-flex items-baseline text-[1.05rem] tracking-[0.06em] text-(--fg)">
          Pixely
          <span
            aria-hidden
            className="inline-block bg-accent"
            style={{ width: "0.17em", height: "0.17em", marginLeft: "0.12em" }}
          />
        </span>

        {/* The tabs say which way in; the heading says where you have
            arrived. They are not the same job — the pair is a control, and
            this is the top of the thing it controls. */}
        <h2 id={titleId} className="type-headline mt-6 text-[1.7rem]">
          {signingUp ? "Create account" : "Sign in"}
        </h2>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-(--muted)">
          {signingUp
            ? "Payments, identity and AI on one platform."
            : "Welcome back."}
        </p>

        {/* Both ways in, side by side and both legible from the first frame.
            A link at the foot saying "New to Pixely?" asks the reader to
            finish reading the wrong form before it tells them there is
            another one. */}
        <div
          role="tablist"
          aria-label="Sign in or create an account"
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            const next: Mode = signingUp ? "in" : "up";
            setMode(next);
            setNotice(null);
            requestAnimationFrame(() =>
              panelRef.current
                ?.querySelector<HTMLElement>(`#auth-tab-${next}`)
                ?.focus(),
            );
          }}
          className="relative mt-7 grid grid-cols-2 rounded-(--radius-control) border border-(--line) bg-(--surface) p-1"
        >
          {/* Inset by the track's own padding, so its corner is the track's
              less that padding — the same 4px relationship the panel and its
              controls keep everywhere else. */}
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-[calc(var(--radius-control)-4px)] bg-accent transition-transform duration-500 ease-(--ease-out-expo) motion-reduce:transition-none"
            style={{ transform: signingUp ? "translateX(100%)" : undefined }}
          />
          {([
            { id: "in", label: "Sign in" },
            { id: "up", label: "Create account" },
          ] as const).map((tab) => {
            const on = mode === tab.id;
            return (
              <button
                key={tab.id}
                id={`auth-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls="auth-panel-form"
                tabIndex={on ? 0 : -1}
                onClick={() => {
                  setMode(tab.id);
                  setNotice(null);
                }}
                data-cursor="link"
                className={`type-label relative z-10 rounded-[calc(var(--radius-control)-4px)] py-2.5 transition-colors duration-300 ${
                  on ? "text-bone" : "text-(--muted) hover:text-(--fg)"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex flex-col gap-3">
          {/* A configured connector is a real navigation — the whole page
              goes to the provider and comes back signed in. An unconfigured
              one explains itself in the panel's own voice. */}
          <Provider
            label="Continue with Google"
            onPress={() =>
              live?.google
                ? /* A document navigation on purpose — this is a route
                     handler that hands the whole page to Google's consent
                     screen, not a Next page router.push could reach. The URL
                     is made absolute, which is what the lint rule is
                     actually guarding. */
                  window.location.assign(
                    new URL("/api/auth/google/start", window.location.origin),
                  )
                : setNotice(
                    "Google sign-in isn't activated yet — it goes live the moment the Google keys are set. Nothing was sent.",
                  )
            }
          >
            <GoogleMark />
          </Provider>
          <Provider
            label="Continue with Apple"
            onPress={() =>
              live?.apple
                ? window.location.assign(
                    new URL("/api/auth/apple/start", window.location.origin),
                  )
                : setNotice(
                    "Apple sign-in isn't activated yet — it goes live the moment the Apple keys are set. Nothing was sent.",
                  )
            }
          >
            <AppleMark />
          </Provider>
        </div>

        {/* A rule with the word set into it, rather than a word floating
            between two rules that do not reach it. */}
        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-(--line)" />
          <span className="type-label text-(--faint)">or</span>
          <span className="h-px flex-1 bg-(--line)" />
        </div>

        <form
          id="auth-panel-form"
          role="tabpanel"
          aria-labelledby={`auth-tab-${mode}`}
          onSubmit={(e) => {
            e.preventDefault();
            /* A known-bad address does not get as far as the notice — there
               is no point telling someone accounts are not connected when
               the thing they typed could not receive one either way. */
            if (
              signingUp &&
              (check?.verdict === "invalid" ||
                check?.verdict === "disposable" ||
                check?.verdict === "typo")
            ) {
              document.getElementById("auth-email")?.focus();
              return;
            }
            pending();
          }}
          className="flex flex-col gap-4"
        >
          {/* One field for both ways in. It is the whole of signing in and
              the start of signing up, so duplicating it per pane would mean
              two inputs wearing one id and two verifiers racing each other
              over the same address. */}
          <Field
            id="auth-email"
            label="Work email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              verify(v);
            }}
            onBlur={() => verify(email, true)}
            mark={
              checking ? (
                <Verdict state="checking" />
              ) : check?.verdict === "invalid" ||
                check?.verdict === "disposable" ? (
                <Verdict state="bad" />
              ) : check?.verdict === "ok" && email.trim() ? (
                <Verdict state="good" />
              ) : undefined
            }
            tone={
              !check
                ? undefined
                : check.verdict === "invalid" || check.verdict === "disposable"
                  ? "bad"
                  : check.verdict === "typo" || check.verdict === "role"
                    ? "warn"
                    : check.verdict === "ok"
                      ? "good"
                      : undefined
            }
            note={
              checking ? (
                <span className="text-(--faint)">Checking the domain…</span>
              ) : check?.message ? (
                <>
                  {check.message}
                  {check.suggestion && (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={() => {
                          setEmail(check.suggestion!);
                          verify(check.suggestion!, true);
                        }}
                        data-cursor="link"
                        className="text-accent underline-offset-4 hover:underline"
                      >
                        Use it
                      </button>
                    </>
                  )}
                </>
              ) : undefined
            }
          />

          {/* Only the active pane is rendered, so the form is exactly its own
              height. The panel is anchored at the top of the viewport, so
              that height resolves downward — the top edge holds and the
              bottom is where sign-up's extra rows appear. The two are far
              enough apart now that cross-fading them in place looked like one
              thing melting into another; a mode is a small step, so it takes
              a small one. */}
          {signingUp ? (
            <div key="up" className="auth-pane flex flex-col gap-4">
              <div>
                <Field
                  id="auth-password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
                />
                <Strength value={password} />
              </div>
              <MagneticButton size="md" className="w-full">
                Create account
              </MagneticButton>
            </div>
          ) : (
            <div key="in" className="auth-pane flex flex-col gap-4">
              <MagneticButton size="md" className="w-full">
                Send me a sign-in link
              </MagneticButton>
              {/* The button now names the thing, so the line under it keeps
                  only the two facts the button does not say: where it goes,
                  and that it spends itself. */}
              <p className="text-[0.82rem] leading-relaxed text-(--muted)">
                It goes to your registered address and works once.
              </p>
            </div>
          )}
        </form>

        {notice && (
          <p
            role="status"
            className="mt-5 rounded-(--radius-control) border border-(--line) bg-(--surface) px-4 py-3 text-[0.82rem] leading-relaxed text-(--muted)"
          >
            {notice}
          </p>
        )}

        {/* One sentence, not a link row over an orphaned clause — the last
            pass split "what you accept" from "that you accept it", and the
            two read as furniture. The documents are unmistakably links now:
            underlined, arrowed, a step brighter than the sentence — and they
            open in a new tab, because leaving a modal with a half-typed form
            to read boilerplate is how the form dies. Sign-up's alone: terms
            are accepted where the account is made. */}
        {signingUp && (
          <p className="type-label mt-6 border-t border-(--line) pt-5 leading-relaxed text-(--faint)">
            Creating an account means accepting the{" "}
            <DocLink href="/terms">terms</DocLink> and the{" "}
            <DocLink href="/privacy">privacy notice</DocLink>.
          </p>
        )}

      </div>
    </div>
  );
}
