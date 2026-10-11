import type { Metadata } from "next";

import SolutionCTA from "@/components/solutions/SolutionCTA";
import SolutionHero from "@/components/solutions/SolutionHero";
import { StartupsGlyph } from "@/components/solutions/SolutionGlyphs";
import { Markers, ServiceFigures } from "@/components/solutions/parts";
import {
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import { topicHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Pixely — Startups",
  description:
    "Launch a financial product on one integration: accounts, payments, identity checks and fraud screening behind a single API, with a sandbox to build against and KYC and AML from the first user.",
};

/**
 * Solutions — Startups. The front page's first audience, expanded: its
 * headline, body, markers and rail from UseCases, and the six services from
 * Core services. Nothing invented — no time to first payment, no counts —
 * and the platform is described as what it is built to do.
 */
export default function StartupsPage() {
  return (
    <ServiceShell>
      <SolutionHero
        eyebrow="Solutions — Startups"
        title="Your product,"
        serif="launched"
        lede="Launch a financial product on one integration. Accounts,
          payments, identity checks and fraud screening sit behind a single
          API, so a team builds its product rather than a stack of
          providers."
        glyph={<StartupsGlyph />}
        talk={{ label: "Talk to us", href: `/${topicHref("platform")}` }}
      />

      <ServiceBand
        index="01 — What you build on"
        title="One API, the whole platform."
        lede="A young product needs payments, somewhere to keep the money,
          proof of who its users are and a watch for fraud. On Pixely they
          are one integration, not four vendors and the glue between them."
        ground="bone"
      >
        <Markers
          items={[
            {
              value: "One API",
              label: "Payments, wallets, identity and AI",
              body: "One set of keys, one way of doing things across every service. The service you add next year arrives through the same door as the first.",
            },
            {
              value: "Sandbox",
              label: "Simulated rails to build against",
              body: "Every flow rehearsed end to end — the refusals and the delays included — before a real dinar moves.",
            },
            {
              value: "Built in",
              label: "KYC and AML from the first user",
              body: "Identity verification and anti-money-laundering checks run inside the flow from day one, rather than being bolted on once the product starts to grow.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — How it runs"
        title="From sandbox to first user."
        lede="Four steps, in the order a team takes them. The first is a single
          call; the last is a conversation with us."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Accounts API",
              body: "Users, wallets and accounts created from your own backend — the first call, and the one everything else hangs from.",
            },
            {
              title: "Sandbox",
              body: "The platform's own endpoints and objects to build against, with none of the consequences.",
            },
            {
              title: "Test rails",
              body: "Simulated settlement for transfers and collections, so success, delay and refusal are all met in testing first.",
            },
            {
              title: "Go-live review",
              body: "The integration and its compliance set-up reviewed with the Pixely team before anything moves for real.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — What comes with it"
        title="Six services, one integration."
        lede="Everything a financial product is usually assembled from,
          already assembled — and each one ready the day the product needs
          it."
        ground="bone"
      >
        <ServiceFigures
          items={[
            {
              file: "payments.js",
              name: "payments",
              label: "Payments",
              body: "Real-time payments, transfers and merchant collections, built to settle as they happen rather than in a nightly batch.",
            },
            {
              file: "ewallets.js",
              name: "wallet",
              label: "eWallets",
              body: "Secure digital wallets for your users, whether they are individuals or businesses.",
            },
            {
              file: "identity.js",
              name: "tablet",
              label: "Identity",
              body: "Document, face and fraud signals checked in one pass, so a user is proved once and trusted after.",
            },
            {
              file: "ai.js",
              name: "chat",
              label: "AI services",
              body: "Fraud detection and AI-assisted decisioning in the path of the transaction, not in a report after it.",
            },
            {
              file: "compliance.js",
              name: "vault",
              label: "Compliance",
              body: "Risk management and audit-ready reporting that every service inherits instead of re-implementing.",
            },
            {
              file: "apis.js",
              name: "modules",
              label: "APIs and SDKs",
              body: "A REST API and drop-in kits for web and mobile, documented for the team that has to ship on them.",
            },
          ]}
        />
      </ServiceBand>

      <SolutionCTA
        index="04 — Get started"
        titleLines={["Build your", "first product"]}
        lede="Tell us what you are building and we will talk through the
          sandbox with you — or go straight to developer access for the API
          reference and documentation."
        primary={{ label: "Talk to us", href: `/${topicHref("platform")}` }}
        secondary={{ label: "Developer access", href: "/developers" }}
      />
    </ServiceShell>
  );
}
