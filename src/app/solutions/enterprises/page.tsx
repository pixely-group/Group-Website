import type { Metadata } from "next";

import SolutionCTA from "@/components/solutions/SolutionCTA";
import SolutionHero from "@/components/solutions/SolutionHero";
import { EnterprisesGlyph } from "@/components/solutions/SolutionGlyphs";
import { Markers } from "@/components/solutions/parts";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import { topicHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Pixely — Enterprises",
  description:
    "One control plane over every entity and account: entities, currencies and rails brought into a single ledger with role-based control, while the banks you already work with stay connected underneath.",
};

/**
 * Solutions — Enterprises. UseCases' second audience, expanded with the
 * security architecture's own vocabulary and Algeria's rails from lib/data.
 * Pixely sits above a group's banks; it does not claim to be one.
 */
export default function EnterprisesPage() {
  return (
    <ServiceShell>
      <SolutionHero
        eyebrow="Solutions — Enterprises"
        title="Every entity,"
        serif="governed"
        lede="One control plane over every entity and account. Entities,
          currencies and rails are brought into a single ledger with
          role-based control, while the banks you already work with stay
          connected underneath."
        glyph={<EnterprisesGlyph />}
        talk={{ label: "Talk to us", href: `/${topicHref("platform")}` }}
      />

      <ServiceBand
        index="01 — What changes"
        title="One ledger, every entity."
        lede="A group's money is usually spread across subsidiaries, banks
          and spreadsheets, and seen whole once a month. The platform is
          built to show it whole all the time."
        ground="bone"
      >
        <Markers
          items={[
            {
              value: "One ledger",
              label: "Across entities and currencies",
              body: "Every subsidiary and every account written to the same ledger, so the group position is a reading rather than a consolidation.",
            },
            {
              value: "Real time",
              label: "Cash visibility, not end of day",
              body: "Balances move when the money moves. Treasury looks at the position as it stands, not as it stood at yesterday's close.",
            },
            {
              value: "Roles",
              label: "Approvals that match your organisation",
              body: "Who may see, prepare and release a payment follows the way your group is actually run — by entity, by amount, by role.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — How it is set up"
        title="Your organisation, modelled."
        lede="Four pieces, each describing something the group already has.
          The platform takes its shape from them rather than asking the
          group to take the platform's."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Entity graph",
              body: "Parent, subsidiaries and branches, and the accounts each one holds, drawn once as the group really is.",
            },
            {
              title: "Approval matrix",
              body: "Who prepares, who approves and who releases, set per entity and per kind of payment.",
            },
            {
              title: "ERP sync",
              body: "Movements flow into the accounting system you already run, categorised, instead of being keyed in after the fact.",
            },
            {
              title: "Audit export",
              body: "Every action, approval and movement exportable as one record, ready for the people who have to check it.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — Underneath"
        title="The banks stay. The view changes."
        lede="Pixely is designed to sit above the banking relationships a
          group already has rather than replace them — one place to see and
          govern accounts that stay exactly where they are."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "Your banks, connected",
              body: "Accounts at the banks you already work with report into the one ledger. Nothing has to move for the group to see it whole.",
            },
            {
              label: "Algeria's own rails",
              body: "Built around the rails the country actually clears on — ARTS for real-time gross settlement, ATCI for interbank clearing and SWIFT for cross-border.",
            },
            {
              label: "Signed, scoped, recorded",
              body: "Every call signed, scoped and replay-protected, and what happened kept in an append-only, hash-linked record under dual control.",
            },
          ]}
        />
      </ServiceBand>

      <SolutionCTA
        index="04 — Get started"
        titleLines={["See the group", "whole"]}
        lede="Tell us how your group is structured — its entities, its banks
          and who approves what — and we will walk you through how the
          platform is built to model it."
        primary={{ label: "Talk to us", href: `/${topicHref("platform")}` }}
      />
    </ServiceShell>
  );
}
