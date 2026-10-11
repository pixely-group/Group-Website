"use client";

import { useRef, useState } from "react";

import { inspect, looksFinished, type Check } from "@/lib/email";

/**
 * The site's form field, as the sign-up dialog drew it first: a mono label
 * over a soft-cornered input whose one edge carries everything (blue for
 * focus while nothing is known, then the verdict's colour once something
 * is), a mark drawn inside its right edge where the answer belongs, and a
 * polite note underneath. The dialog and the contact form both build from
 * these, so a field reads the same wherever it is met.
 */

export type Tone = "good" | "warn" | "bad";

/** The edge a field wears. Absent tone means nothing is known yet, which is
 *  not the same as nothing being wrong. */
export function fieldEdge(tone?: Tone) {
  return tone === "bad"
    ? "border-(--color-negative)"
    : tone === "warn"
      ? "border-(--color-signal-lift)"
      : tone === "good"
        ? "border-(--color-positive)"
        : "border-(--line)";
}

/** The box itself, shared by input, textarea and select. */
export const boxClass = (tone?: Tone) =>
  `block w-full rounded-(--radius-control) border bg-(--surface) text-[0.95rem] text-(--fg) outline-none transition-colors duration-200 placeholder:text-(--faint) focus:bg-transparent ${fieldEdge(tone)} ${tone ? "" : "focus:border-(--color-signal)"}`;

export function Verdict({ state }: { state: "checking" | "good" | "bad" }) {
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

export function Field({
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
  shaking,
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
  /** One beat of sideways shake — the field saying "here" when a submit
   *  arrives with nothing in it. */
  shaking?: boolean;
}) {
  const edge = fieldEdge(tone);
  return (
    <div>
      <label htmlFor={id} className="block">
        <span className="type-label block text-(--faint)">{label}</span>
        <span className={`relative mt-2 block ${shaking ? "field-shake" : ""}`}>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-describedby={note ? `${id}-note` : undefined}
          aria-invalid={tone === "bad" || undefined}
          /* Focus is the blue it always was — carried by the field's own
             edge, one border, no ring. But the verdict outranks it: a poked
             empty field is focused by the poke itself, and blue-beats-red
             meant the red never showed. Blue is for a field nothing is known
             about; the moment there is a verdict, the edge wears it, focused
             or not. */
          className={`block w-full rounded-(--radius-control) border bg-(--surface) py-3 pr-11 pl-4 text-[0.95rem] text-(--fg) outline-none transition-colors duration-200 placeholder:text-(--faint) focus:bg-transparent ${edge} ${
            tone ? "" : "focus:border-(--color-signal)"
          }`}
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

/**
 * The dialog's email check, as a hook: everything decidable on the device
 * is decided there, the domain is asked of the server only once the address
 * looks finished, and an answer for an address that has since changed is
 * dropped. `verify(v)` on every keystroke, `verify(v, true)` on blur.
 */
export function useEmailCheck() {
  const [check, setCheck] = useState<Check | null>(null);
  const [checking, setChecking] = useState(false);
  const job = useRef<{ address: string; timer?: number }>({ address: "" });

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
      const local = inspect(address);
      setCheck(local.verdict === "ok" ? null : local);
      if (local.final) {
        setChecking(false);
        return;
      }
      setChecking(true);
      fetch("/api/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: address }),
      })
        .then((res) => res.json() as Promise<Check>)
        .then((result) => {
          if (job.current.address === address) setCheck(result);
        })
        .catch(() => {
          if (job.current.address === address) setCheck(null);
        })
        .finally(() => {
          if (job.current.address === address) setChecking(false);
        });
    };
    if (now) return run();
    setCheck(null);
    setChecking(false);
    job.current.timer = window.setTimeout(run, looksFinished(address) ? 150 : 900);
  };

  const tone: Tone | undefined = !check
    ? undefined
    : check.verdict === "invalid" || check.verdict === "disposable"
      ? "bad"
      : check.verdict === "typo" || check.verdict === "role"
        ? "warn"
        : check.verdict === "ok"
          ? "good"
          : undefined;

  /** True when the address should not be sent as it is. */
  const blocked = check?.verdict === "invalid" || check?.verdict === "disposable" || check?.verdict === "typo";

  return { check, checking, verify, tone, blocked, setCheck };
}
