import type { Metadata } from "next";

import PlatformCTA from "@/components/platform/PlatformCTA";
import PlatformHero from "@/components/platform/PlatformHero";
import { NetworkGlyph } from "@/components/platform/glyphs";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";

export const metadata: Metadata = {
  title: "Pixely — Network",
  description:
    "The network the Pixely platform is being built on: payments, identity, intelligence and compliance on one fabric, sharing one identity, one ledger and one set of rules.",
};

/**
 * The network, given its own address: the front page's NetworkNarrative —
 * payments, identity, intelligence, compliance — read as one fabric rather
 * than four products. Every service line is the narrative's own; what the
 * network shares is drawn from the workspace and the security layers.
 * Nothing counted, nothing claimed live.
 */
export default function NetworkPage() {
  return (
    <ServiceShell>
      <PlatformHero
        eyebrow="Platform — Network"
        title="Every service,"
        serif="connected"
        lede="Payments, identity, intelligence and compliance are being built
          as one network rather than four products side by side — so a
          payment, the person behind it, the decision on it and the record
          of it all travel the same fabric."
        glyph={<NetworkGlyph />}
        primary={{ label: "Talk to us", href: "/#contact-platform" }}
        secondary={{ label: "See the rails", href: "/platform/rails" }}
      />

      <ServiceBand
        index="01 — Four services, one fabric"
        title="What the network carries."
        lede="Each service is a stop on the same network. None of them is
          bolted on afterwards, and none of them talks to another through a
          side door."
        ground="bone"
      >
        <FeatureGrid
          cols={2}
          items={[
            {
              label: "Payments",
              body: "Person to person, business to business, and merchant collection — settled as they happen rather than gathered into a nightly batch and cleared the following working day.",
            },
            {
              label: "Identity",
              body: "Digital identity verification, eKYC and KYB, and authentication designed so a person or a business proves who they are once, and every service on the platform can rely on it afterwards.",
            },
            {
              label: "Intelligence",
              body: "Fraud detection, intelligent automation and AI-assisted decisioning run on the same platform that moves the payment, so a decision is made in the path of the transaction rather than after it.",
            },
            {
              label: "Compliance",
              body: "Compliance, risk management and audit-ready reporting are properties of the platform rather than a reporting layer assembled afterwards. New services inherit them instead of re-implementing them.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — What it shares"
        title="Built once, relied on everywhere."
        lede="A network earns the name by what its stops hold in common. Four
          things are built once, underneath every service, and every service
          reads from them."
        ground="ink"
      >
        <FeatureGrid
          cols={2}
          items={[
            {
              label: "One identity",
              body: "A person or a business is proved once and carried as an attestation. The next service asks the attestation, not the person — onboarding stops repeating itself.",
            },
            {
              label: "One ledger",
              body: "Every movement on every service is written to the same append-only, hash-linked record. There is one account of what happened, not a reconciliation between several.",
            },
            {
              label: "One policy engine",
              body: "Limits, merchant rules, velocity and approvals are set once and enforced in the path of every transaction, on whichever service it started.",
            },
            {
              label: "One event stream",
              body: "Every posting, approval and settlement is announced as an event, so each service — and your own systems — hears what happened as it happens.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — A payment across it"
        title="One trip, every stop."
        lede="What a single transfer is designed to meet on its way through
          the network — each stop in the path, none of them after it."
        ground="bone"
      >
        <FlowSteps
          steps={[
            {
              title: "Initiated",
              body: "A signed, scoped request arrives from an app, a merchant or an API call — the same front door for every service.",
            },
            {
              title: "Proved",
              body: "The identity behind it is checked against its attestation and its bound device, without asking the person again.",
            },
            {
              title: "Decided",
              body: "Fraud signals, anti-money-laundering checks and your policy are scored in the path, before anything moves.",
            },
            {
              title: "Settled",
              body: "The payment leaves on the right rail and the ledger records it — with the evidence of every stop attached.",
            },
          ]}
        />
      </ServiceBand>

      <PlatformCTA
        index="04 — Get in touch"
        titleLines={["Build on", "the network"]}
        lede="Tell us what you want the network to carry for your business,
          and talk it through with the team building it."
        primary={{ label: "Talk to us", href: "/#contact-platform" }}
        secondary={{ label: "Security", href: "/platform/security" }}
      />
    </ServiceShell>
  );
}
