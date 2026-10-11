"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import DocLink from "@/components/ui/DocLink";
import { Field, Verdict, boxClass, useEmailCheck, type Tone } from "@/components/ui/Field";
import MagneticButton from "@/components/ui/MagneticButton";
import { OFFICES } from "@/lib/company";
import { TOPICS, onContactTopic, type TopicId } from "@/lib/contact";
import { gsap } from "@/lib/gsap";

/**
 * Contact: the chapter every "Contact" on the site lands on.
 *
 * The form is built from the sign-up dialog's own field (the edge that wears
 * the verdict, the mark inside it, the polite note under it) and its email
 * check, so it is the same instrument, not a lookalike. What it adds is what
 * a message needs: what it's about, chosen as a topic, which the menu can
 * preselect by pointing at `#contact-<topic>`; a message box that says how
 * much room is left; and a receipt with a reference once it has gone.
 *
 * Validation answers as the visitor goes and never before they have had a
 * chance: a field is judged once it has been left or once a send is
 * attempted, and a send with something missing shakes the first field that
 * needs attention and puts focus there.
 */

const COUNTRIES = [
  "Algeria", "United Kingdom", "France", "Tunisia", "Morocco", "United Arab Emirates", "Saudi Arabia",
  "Qatar", "Germany", "Spain", "Italy", "Belgium", "Switzerland", "Canada", "United States", "Other",
];
const MIN = 20;
const MAX = 4000;

type Fields = { name: string; email: string; company: string; country: string; message: string };
type FieldKey = keyof Fields;

const shape = (sent: Fields): Partial<Record<FieldKey, string>> => {
  const out: Partial<Record<FieldKey, string>> = {};
  if (!sent.name.trim()) out.name = "Tell us your name.";
  if (!sent.email.trim()) out.email = "Enter an email address we can reply to.";
  if (!sent.country) out.country = "Choose your country.";
  const len = sent.message.trim().length;
  if (len < MIN) out.message = len ? `A little more, please — ${MIN - len} more character${MIN - len === 1 ? "" : "s"}.` : "Tell us what you need.";
  return out;
};

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const [topic, setTopic] = useState<TopicId>("platform");
  const [fields, setFields] = useState<Fields>({ name: "", email: "", company: "", country: "", message: "" });
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [server, setServer] = useState<{ error: string; field?: FieldKey } | null>(null);
  const [shake, setShake] = useState<FieldKey | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<{ reference: string; email: string } | null>(null);
  const email = useEmailCheck();

  const set = (k: FieldKey) => (v: string) => {
    setFields((f) => ({ ...f, [k]: v }));
    if (server?.field === k) setServer(null);
  };
  const problems = shape(fields);
  const show = (k: FieldKey) => (touched[k] ? problems[k] : undefined) ?? (server?.field === k ? server.error : undefined);

  // The menu opens the form on a topic: by event when already on this page,
  // by hash when arriving from another one.
  useEffect(() => {
    const pick = (id: string) => TOPICS.some((t) => t.id === id) && setTopic(id as TopicId);
    // A hash read on arrival, and again if it changes in place (a typed URL,
    // or a plain link to "#contact-press" on this same page).
    const fromHash = () => {
      const m = window.location.hash.match(/^#contact-(\w+)$/);
      if (m) pick(m[1]);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    const off = onContactTopic(pick);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      off();
    };
  }, []);

  // The chapter's arrival, in the front page's grammar.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(section.querySelectorAll("[data-contact-line]"), { yPercent: 112 });
        gsap
          .timeline({ scrollTrigger: { trigger: section, start: "top 70%" } })
          .to(section.querySelectorAll("[data-contact-line]"), { yPercent: 0, duration: 1.15, stagger: 0.09, ease: "expo.out" })
          .from(section.querySelectorAll("[data-contact-fade]"), { opacity: 0, y: 26, duration: 0.9, stagger: 0.07, ease: "power3.out" }, "-=0.75");
      });
      return () => mm.revert();
    }, section);
    return () => ctx.revert();
  }, []);

  const poke = (k: FieldKey) => {
    setShake(k);
    window.setTimeout(() => setShake(null), 380);
    document.getElementById(`${uid}-${k}`)?.focus();
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setTouched({ name: true, email: true, country: true, message: true });
    const order: FieldKey[] = ["name", "email", "country", "message"];
    const first = order.find((k) => problems[k]);
    if (first) return poke(first);
    if (email.blocked) return poke("email");

    setPending(true);
    setServer(null);
    try {
      const data = new FormData(e.currentTarget);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...fields, topic, website: data.get("website") }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServer({ error: result.error || "Something went wrong. Please try again.", field: result.field });
        if (result.field) poke(result.field);
        return;
      }
      setSent({ reference: result.reference, email: fields.email.trim() });
    } catch {
      setServer({ error: "We couldn't reach the server. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  const reset = () => {
    setSent(null);
    setFields({ name: "", email: "", company: "", country: "", message: "" });
    setTouched({});
    email.setCheck(null);
  };

  const remaining = MAX - fields.message.length;
  const algiers = OFFICES.find((o) => o.email)!;
  const tone = (k: FieldKey): Tone | undefined => (show(k) ? "bad" : undefined);

  return (
    <section
      ref={sectionRef}
      id="contact"
      data-theme="ink"
      className="relative bg-theme px-6 pt-[15vh] pb-[16vh] text-theme sm:px-10 lg:px-14"
    >
      {/* One invisible anchor per topic, so "#contact-press" is a place the
          chrome can scroll to like any section, and the form hears which. */}
      {TOPICS.map((t) => (
        <span key={t.id} id={`contact-${t.id}`} data-contact-topic={t.id} aria-hidden className="absolute top-[12vh]" />
      ))}

      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div>
          <p data-contact-fade className="type-label section-index mb-8 text-(--muted)">
            10 — Contact
          </p>
          <h2 className="type-display text-big max-w-[10ch]">
            <span className="block overflow-hidden pb-[0.04em]">
              <span data-contact-line className="block">Talk to</span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-contact-line className="block">
                the team
                <span aria-hidden className="ml-[0.07em] inline-block size-[0.17em] bg-accent" />
              </span>
            </span>
          </h2>
          <p data-contact-fade className="mt-8 max-w-sm text-[0.98rem] leading-relaxed text-(--muted)">
            Tell us what you need to move, verify or screen, and where you are
            building it. Every message reaches the team, and we reply by email.
          </p>

          <dl data-contact-fade className="mt-12 grid gap-y-6 border-t border-(--line) pt-8 text-[0.95rem]">
            <div>
              <dt className="type-label text-(--faint)">Write</dt>
              <dd className="mt-2">
                <a href={`mailto:${algiers.email}`} data-cursor="link" className="transition-colors duration-300 hover:text-accent">
                  {algiers.email}
                </a>
              </dd>
            </div>
            {algiers.phone && (
              <div>
                <dt className="type-label text-(--faint)">Call · Algiers</dt>
                <dd className="mt-2">
                  <a href={`tel:${algiers.phone.tel}`} data-cursor="link" className="type-mono transition-colors duration-300 hover:text-accent">
                    {algiers.phone.display}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="type-label text-(--faint)">Offices</dt>
              <dd className="mt-2 text-(--muted)">
                {OFFICES.map((o) => `${o.city} · ${o.entity}`).join("  ·  ")}{" "}
                <a href="#offices" data-cursor="link" className="text-(--fg) underline decoration-1 underline-offset-4 transition-colors hover:text-accent">
                  Addresses
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div data-contact-fade className="rounded-(--radius-panel) border border-(--line) bg-(--surface) p-6 sm:p-9">
          {sent ? (
            <div role="status" className="flex min-h-[28rem] flex-col justify-center">
              <span className="relative inline-flex size-12 items-center justify-center rounded-full border border-(--line)">
                <Verdict state="good" />
              </span>
              <p className="type-label mt-8 text-(--faint)">Message sent · {sent.reference}</p>
              <p className="type-headline mt-4 text-[clamp(1.6rem,3vw,2.2rem)]">Thank you. It&rsquo;s with us.</p>
              <p className="mt-5 max-w-md leading-relaxed text-(--muted)">
                A confirmation is on its way to <span className="text-(--fg)">{sent.email}</span>, and our reply
                will come to the same address. Quote <span className="type-mono text-(--fg)">{sent.reference}</span> if
                you write to us about it.
              </p>
              <div className="mt-10">
                <MagneticButton onClick={reset} variant="outline" size="md">
                  Send another message
                </MagneticButton>
              </div>
            </div>
          ) : (
            <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending} className="flex flex-col gap-7">
              {/* What it's about: one choice, set as chips, read out as a
                  radio group. The hint under them says what the choice means. */}
              <fieldset>
                <legend className="type-label text-(--faint)">What is it about?</legend>
                <div role="radiogroup" aria-label="What is it about?" className="mt-3 flex flex-wrap gap-2">
                  {TOPICS.map((t) => {
                    const on = topic === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setTopic(t.id)}
                        data-cursor="link"
                        className={`rounded-full border px-4 py-2 text-[0.85rem] transition-colors duration-200 ${
                          on ? "border-(--color-signal) bg-(--color-signal) text-white" : "border-(--line) text-(--muted) hover:border-(--line-strong) hover:text-(--fg)"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <p aria-live="polite" className="mt-3 text-[0.8rem] text-(--faint)">
                  {TOPICS.find((t) => t.id === topic)!.hint}
                </p>
              </fieldset>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  id={`${uid}-name`}
                  label="Name"
                  type="text"
                  autoComplete="name"
                  value={fields.name}
                  onChange={set("name")}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  tone={tone("name")}
                  note={show("name")}
                  shaking={shake === "name"}
                />
                <Field
                  id={`${uid}-email`}
                  label="Work email"
                  type="email"
                  autoComplete="email"
                  value={fields.email}
                  onChange={(v) => {
                    set("email")(v);
                    email.verify(v);
                  }}
                  onBlur={() => {
                    setTouched((t) => ({ ...t, email: true }));
                    email.verify(fields.email, true);
                  }}
                  shaking={shake === "email"}
                  tone={show("email") ? "bad" : email.tone}
                  mark={
                    email.checking ? (
                      <Verdict state="checking" />
                    ) : email.tone === "bad" ? (
                      <Verdict state="bad" />
                    ) : email.tone === "good" && fields.email.trim() ? (
                      <Verdict state="good" />
                    ) : undefined
                  }
                  note={
                    show("email") ??
                    (email.checking ? (
                      <span className="text-(--faint)">Checking the domain…</span>
                    ) : email.check?.message ? (
                      <>
                        {email.check.message}
                        {email.check.suggestion && (
                          <>
                            {" "}
                            <button
                              type="button"
                              onClick={() => {
                                set("email")(email.check!.suggestion!);
                                email.verify(email.check!.suggestion!, true);
                              }}
                              data-cursor="link"
                              className="text-accent underline-offset-4 hover:underline"
                            >
                              Use it
                            </button>
                          </>
                        )}
                      </>
                    ) : undefined)
                  }
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  id={`${uid}-company`}
                  label="Company · optional"
                  type="text"
                  autoComplete="organization"
                  value={fields.company}
                  onChange={set("company")}
                />
                <div>
                  <label htmlFor={`${uid}-country`} className="block">
                    <span className="type-label block text-(--faint)">Country</span>
                    <span className={`relative mt-2 block ${shake === "country" ? "field-shake" : ""}`}>
                      <select
                        id={`${uid}-country`}
                        name="country"
                        autoComplete="country-name"
                        value={fields.country}
                        onChange={(e) => {
                          set("country")(e.target.value);
                          setTouched((t) => ({ ...t, country: true }));
                        }}
                        onBlur={() => setTouched((t) => ({ ...t, country: true }))}
                        aria-invalid={!!show("country") || undefined}
                        aria-describedby={show("country") ? `${uid}-country-note` : undefined}
                        className={`${boxClass(tone("country"))} cursor-pointer appearance-none py-3 pr-11 pl-4 ${fields.country ? "" : "text-(--faint)"}`}
                      >
                        <option value="" disabled>
                          Choose…
                        </option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c} className="bg-ink text-bone">
                            {c}
                          </option>
                        ))}
                      </select>
                      <svg aria-hidden width="10" height="6" viewBox="0 0 10 6" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-(--muted)">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </label>
                  {show("country") && (
                    <p id={`${uid}-country-note`} aria-live="polite" className="mt-2 text-[0.8rem] leading-relaxed text-(--muted)">
                      {show("country")}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor={`${uid}-message`} className="block">
                  <span className="flex items-baseline justify-between">
                    <span className="type-label text-(--faint)">Message</span>
                    <span
                      aria-hidden
                      className={`type-mono text-[0.7rem] transition-colors ${remaining < 200 ? "text-(--color-signal-lift)" : "text-(--faint)"}`}
                    >
                      {fields.message.length.toLocaleString("en-GB")} / {MAX.toLocaleString("en-GB")}
                    </span>
                  </span>
                  <span className={`relative mt-2 block ${shake === "message" ? "field-shake" : ""}`}>
                    <textarea
                      id={`${uid}-message`}
                      name="message"
                      rows={6}
                      maxLength={MAX}
                      value={fields.message}
                      onChange={(e) => set("message")(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, message: true }))}
                      placeholder="What are you building, and where can we help?"
                      aria-invalid={!!show("message") || undefined}
                      aria-describedby={`${uid}-message-note`}
                      className={`${boxClass(tone("message"))} min-h-40 resize-y px-4 py-3 leading-relaxed`}
                    />
                  </span>
                </label>
                <p id={`${uid}-message-note`} aria-live="polite" className="mt-2 text-[0.8rem] leading-relaxed text-(--muted)">
                  {show("message") ?? <span className="text-(--faint)">A sentence or two is plenty to start.</span>}
                </p>
              </div>

              {/* The honeypot: off-screen, out of the tab order, unlabelled
                  to everyone but a bot. */}
              <div className="absolute -left-[10000px]" aria-hidden>
                <label htmlFor={`${uid}-website`}>Website</label>
                <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" />
              </div>

              {server && !server.field && (
                <p role="alert" className="rounded-(--radius-control) border border-(--color-negative) px-4 py-3 text-[0.88rem] text-(--fg)">
                  {server.error}
                </p>
              )}

              <div className="flex flex-col gap-5 border-t border-(--line) pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xs text-[0.8rem] leading-relaxed text-(--faint)">
                  By sending, you agree to Pixely using these details to reply to you, as the{" "}
                  <DocLink href="/privacy">privacy notice</DocLink> explains.
                </p>
                <MagneticButton type="submit" size="md" className="shrink-0 disabled:opacity-60">
                  {pending ? "Sending…" : "Send message"}
                </MagneticButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
