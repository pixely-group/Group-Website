import type { Metadata } from "next";

import AboutCTA from "@/components/about/AboutCTA";
import AboutHero from "@/components/about/AboutHero";
import Offices from "@/components/about/Offices";
import {
  FeatureGrid,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";

export const metadata: Metadata = {
  title: "Pixely — About",
  description:
    "Pixely builds payments, digital identity and AI into one platform for Algeria, and connects it outward — PIXELY LTD in London and SARL PIXELY in Algiers.",
};

/**
 * Who Pixely is, in the service template's grammar so it performs like the
 * rest of the site: the statement, what is being built, how, by whom and
 * where, and the way to start a conversation.
 *
 * The standing rule holds: nothing invented. Every service line is the Core
 * services section's own, every principle is the globe's pillars and the
 * network narrative's, and every company fact comes from lib/company. No
 * history, team, figures, customers, partners or licences — and the
 * principles say how the platform is built, not what it is authorised to do.
 */
export default function AboutPage() {
  return (
    <ServiceShell>
      <AboutHero />

      <ServiceBand
        index="01 — What we're building"
        title="Six services, one platform."
        lede="Payments, wallets and identity, with the intelligence and the
          compliance running inside them, and the APIs that let others build
          on them."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "Payments",
              body: "Real-time payments, transfers and merchant collections.",
            },
            {
              label: "eWallets",
              body: "Secure digital wallets for individuals, businesses and institutions.",
            },
            {
              label: "Identity",
              body: "Digital identity verification, eKYC and KYB, and authentication built for trust.",
            },
            {
              label: "AI services",
              body: "Fraud detection, intelligent automation and AI-assisted decisioning.",
            },
            {
              label: "Compliance",
              body: "Regulatory compliance, risk management and audit-ready reporting.",
            },
            {
              label: "APIs and SDKs",
              body: "Developer-first APIs and SDKs for straightforward integration.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — How we work"
        title="Built for what comes next."
        lede="In Algeria a payment and an identity still move through paper,
          branches and waiting. Four principles decide how the platform is
          built instead."
        ground="ink"
      >
        <FeatureGrid
          cols={2}
          items={[
            {
              label: "Real time, not overnight",
              body: "Person to person, business and merchant payments settle as they happen — not gathered into a nightly batch and cleared the next working day.",
            },
            {
              label: "Proved once, trusted after",
              body: "A person or a business proves who they are once, and every service on the platform can rely on it after — onboarding stops repeating itself.",
            },
            {
              label: "Regulatory-ready by construction",
              body: "Compliance, risk management and audit-ready reporting are properties of the platform rather than a layer assembled afterwards. New services inherit them instead of re-implementing them.",
            },
            {
              label: "Built in Algeria",
              body: "Built in Algeria, for Algeria. Personal data stays under Algerian law, and leaves the country only with the national authority's authorisation.",
            },
          ]}
        />
        <p
          data-fade
          className="type-label mt-14 max-w-3xl text-[0.625rem] leading-relaxed text-(--faint)"
        >
          These describe how the platform is designed and built; they are not
          a licence or a certification.
        </p>
      </ServiceBand>

      <ServiceBand
        index="03 — Two companies, two offices"
        title="London and Algiers."
        lede="PIXELY LTD, incorporated in England and Wales on 28 September
          2018, operates this website. SARL PIXELY is the company in Algeria,
          where the platform is built."
        ground="bone"
      >
        <Offices />
      </ServiceBand>

      <AboutCTA index="04 — Get in touch" />
    </ServiceShell>
  );
}
