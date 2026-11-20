"use client";

import { useEffect, useRef, useState } from "react";

import { OFFICES } from "@/lib/company";

const [algiers] = OFFICES;

/**
 * The paragraph a journalist can lift whole. Every clause is the site's own:
 * the About page's statement, the Core services lines, and the company as
 * lib/company records it. It says what Pixely is building, never what
 * it has launched, because nothing has.
 */
export const SHORT =
  "Pixely is building payments, digital identity and AI into one platform for Algeria, and connecting it outward.";

export const FULL =
  `${SHORT} The platform is designed to bring together real-time payments, transfers and merchant collections; ` +
  "digital wallets for individuals, businesses and institutions; identity verification, eKYC and KYB; " +
  "AI-assisted fraud detection and decisioning; and regulatory compliance with audit-ready reporting — " +
  `with APIs and SDKs for others to build on. The company behind it is ${algiers.entity}, ` +
  `in ${algiers.city}, where the platform is built.`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* No clipboard (an insecure context, a denied permission): the text
         is on the page to be selected by hand, so there is nothing to undo. */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      data-cursor="link"
      className="type-label inline-flex items-center gap-2 text-(--muted) transition-colors duration-200 hover:text-accent"
    >
      <span aria-hidden className={`size-[7px] ${copied ? "bg-accent" : "border border-current"}`} />
      <span aria-live="polite">{copied ? "Copied" : "Copy text"}</span>
    </button>
  );
}

function Version({
  label,
  text,
  large,
}: {
  label: string;
  text: string;
  large?: boolean;
}) {
  return (
    <div>
      <span aria-hidden data-draw className="block h-px w-full bg-(--line-strong)" />
      <div data-fade>
        <div className="mt-5 flex items-baseline justify-between gap-6">
          <h3 className="type-label text-(--faint)">{label}</h3>
          <CopyButton text={text} />
        </div>
        <blockquote
          className={
            large
              ? "mt-7 text-[clamp(1.3rem,2.3vw,2rem)] leading-[1.3] font-medium tracking-[-0.01em]"
              : "mt-7 max-w-[68ch] text-[1.1rem] leading-relaxed text-(--muted) lg:columns-2 lg:max-w-none lg:gap-14"
          }
        >
          {text}
        </blockquote>
      </div>
    </div>
  );
}

export default function Boilerplate() {
  return (
    <div className="grid gap-16">
      <Version label="In one sentence" text={SHORT} large />
      <Version label="In full" text={FULL} />
    </div>
  );
}
