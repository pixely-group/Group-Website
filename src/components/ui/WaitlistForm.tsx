"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import MagneticButton from "@/components/ui/MagneticButton";

export default function WaitlistForm() {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const data = new FormData(event.currentTarget);
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), website: data.get("website") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again in a moment.");
      setJoined(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t connect. Please try again.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <div className="mt-6 w-full">
      {joined ? (
        <div role="status" className="border-l-2 border-accent py-1 pl-4">
          <p className="type-label text-bone">You’re on the list.</p>
          <p className="mt-2 text-sm leading-relaxed text-(--muted)">
            We’ll email you the moment your spot is ready.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} aria-label="Join the waitlist" aria-busy={pending}>
          <label htmlFor="waitlist-email" className="sr-only">Email address</label>
          <div className="absolute -left-[10000px]" aria-hidden="true">
            <label htmlFor="waitlist-website">Website</label>
            <input id="waitlist-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <fieldset disabled={pending} className="flex min-w-0 flex-col gap-3 min-[400px]:flex-row">
            <input
              id="waitlist-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Your email address"
              aria-describedby={error ? "waitlist-error waitlist-note" : "waitlist-note"}
              aria-invalid={Boolean(error)}
              className="h-12 min-w-0 flex-none min-[400px]:flex-1 rounded-(--radius-control) border border-(--line-strong) bg-ink/60 px-4 text-base text-bone outline-none transition-colors placeholder:text-(--muted) focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
            />
            <MagneticButton type="submit" size="md" className="shrink-0 px-5 disabled:opacity-60">
              {pending ? "Joining…" : "Join the waitlist"}
            </MagneticButton>
          </fieldset>
          <p id="waitlist-note" className="mt-3 text-xs leading-relaxed text-(--muted)">
            Be first to know when your spot is ready. By joining, you agree to receive waitlist emails. {" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-bone">Privacy</Link>
          </p>
          {error && <p id="waitlist-error" role="alert" className="mt-3 text-sm text-bone">{error}</p>}
        </form>
      )}
    </div>
  );
}
