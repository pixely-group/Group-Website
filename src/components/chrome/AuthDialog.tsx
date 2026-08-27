"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useLenis } from "@/components/chrome/SmoothScroll";
import MagneticButton from "@/components/ui/MagneticButton";
import { inspect, type Check } from "@/lib/email";

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
 * The two modes therefore differ by more than a field now, which is why the
 * parts that differ share one grid cell — the panel is the height of the
 * taller of them at all times and nothing moves when the pair is switched.
 * A dialog that changes size under the pointer is a dialog that has just
 * moved the button someone was reaching for.
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
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55z"
        fill="#4285F4"
      />
      <path
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.7v2.98A11.5 11.5 0 0 0 12 23.5z"
        fill="#34A853"
      />
      <path
        d="M5.55 14.18a6.9 6.9 0 0 1 0-4.36V6.84H1.7a11.5 11.5 0 0 0 0 10.32l3.85-2.98z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.98c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.55 15.11.5 12 .5A11.5 11.5 0 0 0 1.7 6.84l3.85 2.98C6.46 7.1 9 4.98 12 4.98z"
        fill="#EA4335"
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

/* Shown while a password is being made, never as a wall of red after the
   fact. Each one ticks as it is satisfied, so the field is a thing being
   completed rather than a thing being failed. */
const RULES = [
  { id: "len", label: "8 characters or more", met: (v: string) => v.length >= 8 },
  { id: "num", label: "A number", met: (v: string) => /\d/.test(v) },
  { id: "cap", label: "A capital", met: (v: string) => /[A-Z]/.test(v) },
];

function Rules({ value }: { value: string }) {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {RULES.map((rule, i) => {
        const met = rule.met(value);
        return (
          <li
            key={rule.id}
            className="flex items-center gap-2.5 text-[0.8rem] transition-colors duration-300"
            style={{ color: met ? "var(--color-positive)" : "var(--faint)" }}
          >
            <span
              className="rule-box relative grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors duration-300"
              data-met={met || undefined}
              style={{
                borderColor: met ? "var(--color-positive)" : "var(--line-strong)",
                transitionDelay: `${i * 40}ms`,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  className="rule-tick"
                  d="M3 8.4 6.4 11.8 13 5.2"
                  pathLength={100}
                  stroke="var(--color-positive)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
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
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [check, setCheck] = useState<Check | null>(null);
  const [checking, setChecking] = useState(false);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

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
    /* Back to signing in. The control that opens this says Login, and it
       reopening on Create account because that is where someone left it last
       is the panel arguing with the button that summoned it. */
    setMode("in");
    onClose();
  }, [onClose]);

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

    /* Nothing on screen while the address is still being typed. The syntax
       check is instant and would happily put a red cross beside "amine@gmail"
       on the way to "amine@gmail.com" — a verdict on a half-typed address is
       a verdict on something nobody has finished saying. It waits for the
       typing to stop, and blur asks immediately. */
    setCheck(null);
    setChecking(false);
    job.current.timer = window.setTimeout(run, 520);
  };

  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const lenis = useLenis();
  const titleId = useId();

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
         the unselected tab and the scrim both carry tabindex -1, and a ring
         that counted them would wrap to a control the browser skips. */
      const ring = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]):not([tabindex="-1"]), input:not([disabled])',
      );
      if (!ring?.length) return;
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
      className={`fixed inset-0 z-(--z-dialog) flex items-center justify-center px-6 py-10 transition-opacity duration-300 ease-(--ease-out-expo) ${
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
          <Provider label="Continue with Google" onPress={pending}>
            <GoogleMark />
          </Provider>
          <Provider label="Continue with Apple" onPress={pending}>
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

          {/* The two panes share one grid cell, so the form is always as tall
              as the taller of them and switching moves nothing. Measuring one
              and pinning a height would drift the moment the copy or the
              fonts changed; this cannot. */}
          <div className="grid">
            <div
              className={`col-start-1 row-start-1 flex flex-col gap-4 transition-opacity duration-300 ${
                signingUp ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
              inert={signingUp || undefined}
            >
              <MagneticButton size="md" className="w-full">
                Email me a link
              </MagneticButton>
              <p className="text-[0.82rem] leading-relaxed text-(--muted)">
                No password. We send a link that signs you in, and it works
                once.
              </p>
            </div>

            <div
              className={`col-start-1 row-start-1 flex flex-col gap-4 transition-opacity duration-300 ${
                signingUp ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              inert={!signingUp || undefined}
            >
              <div>
                <Field
                  id="auth-password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
                />
                <Rules value={password} />
              </div>
              <MagneticButton size="md" className="w-full">
                Create account
              </MagneticButton>
            </div>
          </div>
        </form>

        {notice && (
          <p
            role="status"
            className="mt-5 rounded-(--radius-control) border border-(--line) bg-(--surface) px-4 py-3 text-[0.82rem] leading-relaxed text-(--muted)"
          >
            {notice}
          </p>
        )}

        {/* The links lead and the sentence follows, which is the way round
            people use this: nobody reads the line, and the ones who care are
            looking for the documents. Buried mid-sentence they were the
            least reachable thing in the panel. Kept for both modes, so the
            foot is not another thing that changes height. */}
        <div className="mt-6 border-t border-(--line) pt-5">
          <p className="type-label flex flex-wrap items-center gap-x-3 gap-y-2">
            <a
              href="/terms"
              data-cursor="link"
              className="text-(--muted) transition-colors duration-200 hover:text-accent"
            >
              Terms of service
            </a>
            <span aria-hidden className="size-[3px] bg-(--faint)" />
            <a
              href="/privacy"
              data-cursor="link"
              className="text-(--muted) transition-colors duration-200 hover:text-accent"
            >
              Privacy notice
            </a>
          </p>
          <p className="mt-2 text-[0.78rem] leading-relaxed text-(--faint)">
            {signingUp
              ? "Creating an account accepts both."
              : "Signing in accepts both."}
          </p>
        </div>

      </div>
    </div>
  );
}
