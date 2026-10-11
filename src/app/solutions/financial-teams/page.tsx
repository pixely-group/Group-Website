import type { Metadata } from "next";

import SolutionCTA from "@/components/solutions/SolutionCTA";
import SolutionHero from "@/components/solutions/SolutionHero";
import { FinanceGlyph } from "@/components/solutions/SolutionGlyphs";
import { LAWS, LawList, Markers } from "@/components/solutions/parts";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import { topicHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Pixely — Financial teams",
  description:
    "Close the month while the month is still running: every movement categorised, matched and exportable as it happens, so reconciliation becomes a property of the ledger rather than a monthly event.",
};

/**
 * Solutions — Financial teams. UseCases' fourth audience (its id is
 * "treasury"), expanded with the security architecture's record — append
 * only, hash-linked, dual control — and the compliance pillar's AML law.
 */
export default function FinancialTeamsPage() {
  return (
    <ServiceShell>
      <SolutionHero
        eyebrow="Solutions — Financial teams"
        title="The close,"
        serif="continuous"
        lede="Close the month while the month is still running. Every
          movement is categorised, matched and exportable as it happens, so
          reconciliation becomes a property of the ledger rather than a
          monthly event."
        glyph={<FinanceGlyph />}
        talk={{ label: "Talk to us", href: `/${topicHref("platform")}` }}
      />

      <ServiceBand
        index="01 — What changes"
        title="Matched as it moves."
        lede="Month-end exists because the books and the bank are compared
          once, late, by hand. The platform is built to compare them every
          time something moves."
        ground="bone"
      >
        <Markers
          items={[
            {
              value: "Continuous",
              label: "Reconciliation, not month-end",
              body: "The work that used to wait for the last week of the month is done a movement at a time, as the month goes.",
            },
            {
              value: "Matched",
              label: "As transactions settle",
              body: "Each payment is paired with the entry it belongs to when it settles, and what does not match is raised while it is still fresh.",
            },
            {
              value: "Immutable",
              label: "An evidence trail for auditors",
              body: "The record is added to, never rewritten — so what an auditor reads is what happened, not a version of it.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — How it runs"
        title="From a movement to a close pack."
        lede="Four steps the ledger takes on its own, so the team's time goes
          on the exceptions rather than on the ticking."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Auto-match",
              body: "Every movement paired with its invoice, payout or transfer as it settles, against rules your team sets.",
            },
            {
              title: "Categories",
              body: "Each entry coded to your chart of accounts on arrival, not in a batch at the end.",
            },
            {
              title: "Close pack",
              body: "Balances, matches and the open exceptions gathered into one pack, ready whenever the period ends.",
            },
            {
              title: "Auditor access",
              body: "Read-only access to the record itself, so the evidence is looked at where it lives rather than sent in copies.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — The record"
        title="The record is the evidence."
        lede="An audit trail assembled after the fact is a story about what
          happened. The platform keeps the thing itself."
        ground="bone"
      >
        <FeatureGrid
          cols={2}
          items={[
            {
              label: "Append-only",
              body: "Entries are added, never edited. A correction is a new entry that points at the one it corrects, and both stay on the record.",
            },
            {
              label: "Hash-linked",
              body: "Each entry carries the fingerprint of the one before it, so a record that has been altered shows that it has.",
            },
            {
              label: "Dual control",
              body: "The changes that matter take two people, and the record says which two.",
            },
            {
              label: "Compliance in the transaction",
              body: "Anti-money-laundering checks, risk scoring and the audit trail run inside each transaction, rather than being reconciled after it.",
            },
          ]}
        />
        <div className="mt-16">
          <LawList laws={[LAWS.aml]} />
        </div>
      </ServiceBand>

      <SolutionCTA
        index="04 — Get started"
        titleLines={["Close while", "it runs"]}
        lede="Tell us how your team closes today — the banks, the ledger and
          the spreadsheets in between — and we will show you how the platform
          is built to carry it."
        primary={{ label: "Talk to us", href: `/${topicHref("platform")}` }}
      />
    </ServiceShell>
  );
}
