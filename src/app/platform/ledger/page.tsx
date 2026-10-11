import type { Metadata } from "next";

import LedgerWorkspace from "@/components/platform/LedgerWorkspace";
import PlatformCTA from "@/components/platform/PlatformCTA";
import PlatformHero from "@/components/platform/PlatformHero";
import { LedgerGlyph } from "@/components/platform/glyphs";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";

export const metadata: Metadata = {
  title: "Pixely — Ledger",
  description:
    "The ledger at the centre of the Pixely platform: append-only, hash-linked and under dual control — one record of every movement, built to be audited rather than reconciled.",
};

/**
 * The ledger layer, opened out: "append-only · hash-linked · dual control",
 * as SecurityArchitecture specifies it, and "one ledger, every movement", as
 * the front page's workspace shows it. The workspace is reused as it stands
 * — illustrative demo data, captioned as such.
 */
export default function LedgerPage() {
  return (
    <ServiceShell>
      <PlatformHero
        eyebrow="Platform — Ledger"
        title="Every movement,"
        serif="recorded"
        lede="At the centre of the platform is one ledger: append-only,
          hash-linked and under dual control. It is designed to be the
          record of what actually happened — one nobody can edit, and
          anyone entitled to can verify."
        glyph={<LedgerGlyph />}
        primary={{ label: "Talk to us", href: "/#contact-platform" }}
        secondary={{ label: "Security", href: "/platform/security" }}
      />

      <ServiceBand
        index="01 — One ledger"
        title="One ledger. Every movement."
        lede="Accounts, payments, FX and controls in a single programmable
          system — visible to the cent, auditable to the event. This is the
          workspace being built on top of it."
        ground="bone"
      >
        <LedgerWorkspace />
      </ServiceBand>

      <ServiceBand
        index="02 — How it is built"
        title="A record nobody can edit."
        lede="Three properties carry the weight, and the rest follow from
          them."
        ground="ink"
      >
        <FeatureGrid
          items={[
            {
              label: "Append-only",
              body: "Entries are added, never changed. A correction is a new entry that reverses the old one, so the mistake and its repair both stay on the record.",
            },
            {
              label: "Hash-linked",
              body: "Each entry carries the fingerprint of the one before it. Alter any entry and every link after it breaks — tampering is not hidden, it is evident.",
            },
            {
              label: "Dual control",
              body: "Movements above your policy's threshold wait for more than one approver. No single person moves money alone, and the approvals are written to the ledger too.",
            },
            {
              label: "Every event announced",
              body: "Each posting is published as an event — credit posted, approval required, payment settled — for the platform's services and for your own systems.",
            },
            {
              label: "Attestations on the record",
              body: "Identity results are written as signed attestations: who was proved, when, and by which checks — evidence a later decision can rely on.",
            },
            {
              label: "Audit-ready by construction",
              body: "Reporting reads from the ledger itself, not from a copy assembled afterwards. The audit trail is the record, not a summary of it.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — The life of an entry"
        title="Proposed, approved, written, proved."
        lede="How a movement is designed to become a line in the ledger — and
          why it can be trusted once it is there."
        ground="bone"
      >
        <FlowSteps
          steps={[
            {
              title: "Propose",
              body: "A payment, a payroll run or a transfer between accounts is proposed — by a person, a rule or an API call.",
            },
            {
              title: "Approve",
              body: "Policy decides who must agree. Above the threshold, a second hand is required before anything is written.",
            },
            {
              title: "Post",
              body: "The entry is appended and linked to the one before it. From here it can be reversed by a new entry, never edited.",
            },
            {
              title: "Prove",
              body: "Anyone entitled to can walk the chain and confirm it is whole — the auditor, the regulator, or your own finance team.",
            },
          ]}
        />
      </ServiceBand>

      <PlatformCTA
        index="04 — Get in touch"
        titleLines={["Put it", "on the record"]}
        lede="Talk to us about the ledger, the controls on it and how your
          own systems would read from it."
        primary={{ label: "Talk to us", href: "/#contact-platform" }}
        secondary={{ label: "Developer access", href: "/developers" }}
      />
    </ServiceShell>
  );
}
