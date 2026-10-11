import type { Metadata } from "next";

import LawList, { LAWS } from "@/components/platform/LawList";
import PlatformCTA from "@/components/platform/PlatformCTA";
import PlatformHero from "@/components/platform/PlatformHero";
import Register from "@/components/platform/Register";
import { SecurityGlyph } from "@/components/platform/glyphs";
import {
  FeatureGrid,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";

export const metadata: Metadata = {
  title: "Pixely — Security",
  description:
    "Security on the Pixely platform is structural: five layers — application, identity, policy, ledger and rails — stand between intent and settlement, and any one of them can refuse.",
};

/**
 * The five layers from SecurityArchitecture, each with its own spec and note,
 * and the principles behind them.
 *
 * The front page's certification row was removed because none is held; it
 * is not reintroduced here in any form. No timings are given — the front
 * page's are an illustrative budget and are labelled so there.
 */
export default function SecurityPage() {
  return (
    <ServiceShell>
      <PlatformHero
        eyebrow="Platform — Security"
        title="Security is"
        serif="structural"
        lede="Not a feature added at the end. Every tap, transfer and top-up
          is designed to cross five layers in order — application, identity,
          policy, ledger, rails — and any one of them can refuse."
        glyph={<SecurityGlyph />}
        primary={{ label: "Talk to us", href: "/#contact-platform" }}
        secondary={{ label: "See the ledger", href: "/platform/ledger" }}
      />

      <ServiceBand
        index="01 — Five layers"
        title="Between intent and settlement."
        lede="A request meets the layers in this order. Each one checks one
          thing, stamps it, and passes the request down — or stops it where
          it stands."
        ground="bone"
      >
        <Register
          rows={[
            {
              index: "L1",
              name: "Application",
              spec: "Scoped keys · mTLS · replay windows",
              note: "Every call is signed, scoped and replay-protected.",
            },
            {
              index: "L2",
              name: "Identity",
              spec: "Device binding · token vault · KYC",
              note: "Who is asking, proven before anything is asked.",
            },
            {
              index: "L3",
              name: "Policy",
              spec: "Limits · merchant rules · velocity",
              note: "What they may do, checked before anything moves.",
            },
            {
              index: "L4",
              name: "Ledger",
              spec: "Append-only · hash-linked · dual control",
              note: "What actually happened, in a record nobody can edit.",
            },
            {
              index: "L5",
              name: "Rails",
              spec: "ARTS · ATCI · card scheme · SWIFT · book transfer",
              note: "Where value finally settles, on the rails it travels.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — The principles"
        title="Refuse early, record everything."
        lede="The layers follow from a handful of decisions about where a
          check belongs and what it leaves behind."
        ground="ink"
      >
        <FeatureGrid
          cols={2}
          items={[
            {
              label: "Any layer can refuse",
              body: "Defence in depth, literally: a request has to satisfy every layer, and the first one that says no ends the trip. Nothing under it is ever reached.",
            },
            {
              label: "Refusing is the cheap part",
              body: "The platform's own layers sit before the rail, so a request that should not settle is stopped before it costs anyone a settlement — or a reversal.",
            },
            {
              label: "Least privilege",
              body: "Keys are scoped to what they are for, devices are bound to the people who hold them, and card credentials stay in the vault rather than in the call.",
            },
            {
              label: "The user holds a lever",
              body: "Policy includes the user's own: a card frozen in the app is refused at the policy layer, before the scheme is ever asked.",
            },
            {
              label: "Evidence attached",
              body: "Every verdict — pass or refuse — is written to the ledger with the layer that gave it, so a decision can always be explained after the fact.",
            },
            {
              label: "Dual control on the money",
              body: "Movements above your threshold need more than one approver, and no single person can both propose and approve the same one.",
            },
          ]}
        />
        <p
          data-fade
          className="type-label mt-14 max-w-3xl text-[0.625rem] leading-relaxed text-(--faint)"
        >
          These describe how the platform is designed and built; they are not
          a certification.
        </p>
      </ServiceBand>

      <ServiceBand
        index="03 — Data and the law"
        title="Kept under Algerian law."
        lede="Security is also a question of whose rules the data lives
          under. The platform is being built in Algeria, around these texts."
        ground="bone"
      >
        <LawList
          items={[
            {
              law: LAWS.data,
              note: "Personal data stays under Algerian law, and leaves the country only with the national authority's authorisation.",
            },
            {
              law: LAWS.aml,
              note: "Anti-money-laundering checks, risk scoring and an audit trail, run inside each transaction rather than reconciled after it.",
            },
            {
              law: LAWS.esignature,
              note: "Electronic signature and certification — the basis for signing what a person proves and approves.",
            },
          ]}
        />
      </ServiceBand>

      <PlatformCTA
        index="04 — Get in touch"
        titleLines={["Ask us", "the hard part"]}
        lede="Talk to the team building the platform about its layers, its
          controls and how your own policy would sit inside them."
        primary={{ label: "Talk to us", href: "/#contact-platform" }}
        secondary={{ label: "The network", href: "/platform/network" }}
      />
    </ServiceShell>
  );
}
