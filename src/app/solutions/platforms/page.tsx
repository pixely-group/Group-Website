import type { Metadata } from "next";

import SolutionCTA from "@/components/solutions/SolutionCTA";
import SolutionHero from "@/components/solutions/SolutionHero";
import { PlatformsGlyph } from "@/components/solutions/SolutionGlyphs";
import { LAWS, LawList, Markers } from "@/components/solutions/parts";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import { topicHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Pixely — Platforms",
  description:
    "Collect, split and pay out programmatically: funds split, held and disbursed by rule, with obligations tracked for each seller and every payout on a record you can audit.",
};

/**
 * Solutions — Platforms. UseCases' third audience: marketplaces and the
 * platforms that pay other businesses. Expanded from its markers and rail,
 * with KYB from Identity and collections from the network narrative.
 */
export default function PlatformsPage() {
  return (
    <ServiceShell>
      <SolutionHero
        eyebrow="Solutions — Platforms"
        title="Every seller,"
        serif="paid"
        lede="Collect, split and pay out programmatically. Funds are split,
          held and disbursed by rule, with obligations tracked for each
          seller and every payout on a record you can audit."
        glyph={<PlatformsGlyph />}
        talk={{ label: "Partner with us", href: `/${topicHref("partnerships")}` }}
      />

      <ServiceBand
        index="01 — What it is built to do"
        title="Money in, divided by rule."
        lede="A platform takes one payment and owes it to several people.
          The platform is built so that division is written once, in code,
          and carried out the same way every time."
        ground="bone"
      >
        <Markers
          items={[
            {
              value: "Per seller",
              label: "Ledgers, holds and reserves",
              body: "Each seller has their own account of what they are owed, what is held back and what has already gone out.",
            },
            {
              value: "By rule",
              label: "Splits and payouts in code",
              body: "Commission, fees and shares written as rules, not worked out in a spreadsheet at the end of the week.",
            },
            {
              value: "Traceable",
              label: "Every movement on the record",
              body: "From the buyer's payment to the seller's payout, each step is an entry you can follow and an auditor can check.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — How the money moves"
        title="From one payment to many payouts."
        lede="Four movements between a buyer paying and every seller being
          paid — each one a rule you set, not a task someone runs."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Split rules",
              body: "Write the split once — commission, fees, the seller's share — and every collection is divided by it as it lands.",
            },
            {
              title: "Holds",
              body: "Funds held against delivery, a dispute or a reserve you set, and released by rule or by your call.",
            },
            {
              title: "Payout router",
              body: "Each seller paid to their wallet or their bank account, on the schedule and the route the rule names.",
            },
            {
              title: "Seller ledgers",
              body: "What every seller is owed, holding and paid, kept as it happens and visible to them as well as to you.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — Around it"
        title="Built for the marketplace."
        lede="Splitting money is the middle of it. Around the split, the
          platform carries the sellers you onboard and the collections that
          fund them."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "Sellers, verified",
              body: "Registry records, beneficial owners and signatories for every business you onboard, through the same identity checks as the rest of the platform.",
            },
            {
              label: "Merchant collections",
              body: "Payments from buyers built to settle as they happen rather than in a nightly batch, so the split has money to work with straight away.",
            },
            {
              label: "Wallets for sellers",
              body: "Digital wallets for individuals and businesses alike, so a payout can land somewhere that is already on the platform.",
            },
          ]}
        />
        <div className="mt-16">
          <LawList laws={[LAWS.ecommerce, LAWS.psp]} />
        </div>
      </ServiceBand>

      <SolutionCTA
        index="04 — Get started"
        titleLines={["Split your", "first payment"]}
        lede="Tell us about your marketplace or platform — who pays, who is
          paid and on what terms — and we will talk through how its rules
          would be written."
        primary={{ label: "Partner with us", href: `/${topicHref("partnerships")}` }}
      />
    </ServiceShell>
  );
}
