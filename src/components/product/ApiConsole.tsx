"use client";

import { useId, useState } from "react";

/**
 * What an integration with the platform looks like, in the front page's
 * mono voice: four kinds of thing the API is built to offer, each with a
 * request and what comes back.
 *
 * These are sketches of the shape, not documentation. The paths, fields
 * and ids are written to show what each resource does, every id is elided,
 * and the panel says so in its head and again under the code — the API
 * reference is something developers ask for, not something this page
 * pretends to be.
 */

type Sample = {
  id: string;
  label: string;
  title: string;
  body: string;
  code: string;
};

const SAMPLES: Sample[] = [
  {
    id: "accounts",
    label: "Accounts",
    title: "Open an account",
    body: "Dinar accounts for a person or a business, opened against a holder who has already been proved — the ledger behind every other call.",
    code: `POST /accounts
{
  "holder": "hld_…",
  "currency": "DZD",
  "purpose": "operating"
}

201 Created
{
  "id": "acc_…",
  "currency": "DZD",
  "status": "open"
}`,
  },
  {
    id: "payments",
    label: "Payments",
    title: "Move money",
    body: "One call for any destination. The platform chooses the rail — a book transfer, ARTS, ATCI or SWIFT — and the same request can be retried safely.",
    code: `POST /payments
Idempotency-Key: 7c1e…
{
  "from": "acc_…",
  "to": "acc_…",
  "amount": { "value": "4850000.00", "currency": "DZD" },
  "rail": "auto"
}

202 Accepted
{
  "id": "pay_…",
  "status": "routing"
}`,
  },
  {
    id: "identity",
    label: "Identity",
    title: "Prove a person",
    body: "Ask for the checks your policy needs and get back a verdict and an attestation — the record every later product asks instead of the person.",
    code: `POST /verifications
{
  "subject": "usr_…",
  "checks": ["document", "nfc", "liveness", "face_match"]
}

200 OK
{
  "id": "ver_…",
  "status": "verified",
  "attestation": "att_…"
}`,
  },
  {
    id: "webhooks",
    label: "Webhooks",
    title: "Hear it happen",
    body: "Every state change arrives as a signed event at an address you choose, so your system learns a payment settled when it settles.",
    code: `POST https://your-app.example/hooks
Pixely-Signature: t=…, v1=…
{
  "type": "payment.settled",
  "data": {
    "id": "pay_…",
    "rail": "ARTS",
    "status": "settled"
  }
}`,
  },
];

/** A line of the sample, coloured the way the front page's event stream
 *  colours its own: methods in the accent, outcomes in the verdict green,
 *  keys in the foreground, values muted, punctuation faint. */
function Line({ text }: { text: string }) {
  const method = text.match(/^(POST|GET)( .*)$/);
  if (method)
    return (
      <>
        <span className="text-accent">{method[1]}</span>
        <span className="text-(--fg)">{method[2]}</span>
      </>
    );
  if (/^\d{3} /.test(text))
    return <span className="text-(--color-positive)">{text}</span>;
  if (/^[A-Z][\w-]+: /.test(text)) {
    const [name, ...rest] = text.split(": ");
    return (
      <>
        <span className="text-(--muted)">{name}:</span>{" "}
        <span className="text-(--faint)">{rest.join(": ")}</span>
      </>
    );
  }
  // JSON: keys, string values, and the rest.
  const parts = text.split(/("[^"]*")(\s*:)?/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === undefined || part === "") return null;
        if (part.startsWith('"')) {
          const isKey = parts[i + 1]?.includes(":");
          return (
            <span key={i} className={isKey ? "text-(--fg)" : "text-(--muted)"}>
              {part}
            </span>
          );
        }
        return (
          <span key={i} className="text-(--faint)">
            {part}
          </span>
        );
      })}
    </>
  );
}

export default function ApiConsole() {
  const [active, setActive] = useState(0);
  const base = useId();
  const sample = SAMPLES[active];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
      {/* The four resources, as the chapter's own hairline list. */}
      <div role="tablist" aria-label="Resources" className="border-t border-(--line-strong)" data-fade>
        {SAMPLES.map((s, i) => {
          const on = i === active;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`${base}-tab-${s.id}`}
              aria-selected={on}
              aria-controls={`${base}-panel`}
              tabIndex={on ? 0 : -1}
              data-cursor="link"
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                const step =
                  e.key === "ArrowDown" || e.key === "ArrowRight"
                    ? 1
                    : e.key === "ArrowUp" || e.key === "ArrowLeft"
                      ? -1
                      : 0;
                if (!step) return;
                e.preventDefault();
                const next = (active + step + SAMPLES.length) % SAMPLES.length;
                setActive(next);
                document
                  .getElementById(`${base}-tab-${SAMPLES[next].id}`)
                  ?.focus();
              }}
              className="group block w-full border-b border-(--line) py-5 text-left"
            >
              <span className="flex items-center gap-4">
                <span
                  aria-hidden
                  className={`size-[9px] shrink-0 transition-colors duration-300 ${
                    on ? "bg-accent" : "border border-(--line-strong)"
                  }`}
                />
                <span className="type-label text-(--faint)">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`type-label transition-colors duration-300 ${
                    on ? "text-(--fg)" : "text-(--muted) group-hover:text-(--fg)"
                  }`}
                >
                  {s.label}
                </span>
              </span>
              <span
                className={`grid transition-[grid-template-rows,opacity] duration-500 ease-(--ease-out-expo) ${
                  on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <span className="overflow-hidden">
                  <span className="type-headline mt-4 block text-[1.15rem]">
                    {s.title}
                  </span>
                  <span className="mt-2 block max-w-[40ch] text-[0.9rem] leading-relaxed text-(--muted)">
                    {s.body}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* The sample, on the signal-stream panel. */}
      <div
        data-fade
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${sample.id}`}
        className="flex min-w-0 flex-col rounded-(--radius-panel) border border-(--line) bg-(--surface) p-6"
      >
        <p className="type-label flex items-center justify-between gap-4 border-b border-(--line) pb-4 text-(--faint)">
          <span>{sample.label}</span>
          <span className="flex items-center gap-3">
            <span className="text-[0.625rem]">Illustrative</span>
            <span aria-hidden className="size-1.5 animate-pulse bg-accent" />
          </span>
        </p>
        <pre
          key={sample.id}
          className="mt-5 min-h-[340px] flex-1 overflow-x-auto font-mono text-[0.72rem] leading-[1.85] tracking-[0.02em]"
        >
          <code>
            {sample.code.split("\n").map((line, i) => (
              <span key={i} className="block min-h-[1.85em]">
                <Line text={line} />
              </span>
            ))}
          </code>
        </pre>
        <p className="type-label mt-5 border-t border-(--line) pt-4 text-[0.625rem] leading-relaxed text-(--faint)">
          The shape of the thing, not its reference. Paths and fields are
          sketched to show what each resource does; the API reference comes
          with sandbox access.
        </p>
      </div>
    </div>
  );
}
