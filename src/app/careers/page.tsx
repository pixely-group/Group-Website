import type { Metadata } from "next";

import Offices from "@/components/about/Offices";
import CareersGlyph from "@/components/company/CareersGlyph";
import CompanyCTA from "@/components/company/CompanyCTA";
import CompanyHero from "@/components/company/CompanyHero";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";

export const metadata: Metadata = {
  title: "Pixely — Careers",
  description:
    "Working at Pixely, in Algiers: what the platform is being built to do, the disciplines it needs, and how to send an open application.",
};

/**
 * Careers, without the things a careers page usually leans on. There are no
 * published openings, so there is no list of roles; and the standing rule
 * holds, so there are no benefits, salaries, headcounts or culture claims.
 *
 * What the page can say truthfully is what the work is: the platform the
 * site already describes, the kinds of discipline it takes to build each
 * part of it (drawn from the six services), where it is built, and how to
 * write in.
 */
export default function CareersPage() {
  return (
    <ServiceShell>
      <CompanyHero
        eyebrow="Company — Careers"
        title="Build what"
        serif="comes next"
        lede="Pixely is building payments, digital identity and AI into one
          platform for Algeria, from Algiers. There are no
          published openings right now — but if the work below is your work,
          we would like to hear from you."
        actions={[
          { label: "Send an application", href: "/#contact-careers" },
          { label: "About Pixely", href: "/about", variant: "outline" },
        ]}
        aside={<CareersGlyph />}
      />

      <ServiceBand
        index="01 — The work"
        title="Foundations, not features."
        lede="In Algeria a payment and an identity still move through paper,
          branches and waiting. The platform is being built to change that,
          which means the work now is the part everything else will stand on."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "Payments that settle as they happen",
              body: "Person to person, business and merchant payments designed to move in real time on the rails the country clears on — ARTS for gross settlement, ATCI for interbank clearing, SWIFT across borders.",
            },
            {
              label: "Identity proved once",
              body: "A person or a business proves who they are once — document, face and signature — and every service on the platform can rely on it after.",
            },
            {
              label: "Compliance inside the transaction",
              body: "Anti-money-laundering checks, risk scoring and an audit trail that run inside each payment, rather than being reconciled after it.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — The disciplines"
        title="What it takes to build."
        lede="Not a list of vacancies — the kinds of work the six services
          need. If you do one of these well, tell us."
        ground="ink"
      >
        <FeatureGrid
          cols={2}
          items={[
            {
              label: "Payments and ledger engineering",
              body: "Real-time payments, transfers and merchant collections; secure wallets for individuals, businesses and institutions; and the ledger that has to agree with every one of them.",
            },
            {
              label: "Identity and AI",
              body: "Document authentication, liveness and face match; fraud detection, intelligent automation and AI-assisted decisioning — scored while the user is still in the flow.",
            },
            {
              label: "Compliance and risk",
              body: "Regulatory compliance, risk management and audit-ready reporting, built into the platform under Algerian law rather than assembled beside it.",
            },
            {
              label: "Developer platform",
              body: "Developer-first APIs and SDKs, and the documentation that makes the first integration an afternoon's work.",
            },
            {
              label: "Design",
              body: "Interfaces for people paying, businesses collecting and teams reviewing — where a verification or a transfer has to feel simple because the work behind it is not.",
            },
            {
              label: "Product",
              body: "Shaping the services for the people who will build on them, from a first transaction to national scale.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — Where"
        title="Algiers."
        lede="SARL PIXELY is the company in Algeria, where the platform is
          built, and it operates this website."
        ground="bone"
      >
        <Offices />
      </ServiceBand>

      <ServiceBand
        index="04 — Open applications"
        title="How to write in."
        lede="There are no published openings at the moment, so every
          application is an open one. Four things make it easier to read."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Choose Careers",
              body: "Open the contact form on the Careers topic — the button below does it for you.",
            },
            {
              title: "Name the discipline",
              body: "Say which part of the work above is yours, in your own words rather than a job title.",
            },
            {
              title: "Show the work",
              body: "A link to something you have built, designed or run says more than a description of it.",
            },
            {
              title: "Say where",
              body: "Where you are, and where you would want to work from. The platform is built in Algiers, and it helps to know what you have in mind.",
            },
          ]}
        />
      </ServiceBand>

      <CompanyCTA
        index="05 — Apply"
        titleLines={["Write", "to us"]}
        lede="Tell us what you build and where you would like to build it. The
          form opens on Careers."
        actions={[{ label: "Send an application", href: "/#contact-careers" }]}
      />
    </ServiceShell>
  );
}
