import type { Metadata } from "next";

import CompanyCTA from "@/components/company/CompanyCTA";
import CompanyHero from "@/components/company/CompanyHero";
import LawLedger from "@/components/company/LawLedger";
import LegalGlyph from "@/components/company/LegalGlyph";
import { PILLARS } from "@/components/company/laws";
import {
  FeatureGrid,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";

export const metadata: Metadata = {
  title: "Pixely — Legal framework",
  description:
    "The Algerian laws and regulation the Pixely platform is built for — payments, identity, compliance and personal data — each linked to its text in the Journal Officiel.",
};

/**
 * The strip under the globe, given the room to be read: every text in
 * PILLARS, under the pillar it bears on most, with what it governs, when it
 * was made, and a link to the gazette page it starts on.
 *
 * The standing rule matters most on this page. A law named on a fintech's
 * site reads as a claim, so the page says exactly what kind of claim it is —
 * the framework the platform is designed for, not a licence or a
 * certification — and adds no text that is not in the verified list.
 */
const GROUNDS = ["bone", "ink", "bone", "ink"] as const;

export default function LegalFrameworkPage() {
  return (
    <ServiceShell>
      <CompanyHero
        eyebrow="Company — Legal framework"
        title="Built for"
        serif="Algerian law"
        titleClassName="text-[clamp(2.3rem,8.5vw,9rem)]"
        lede="Money, identity, commerce and personal data each have their law in
          Algeria. The platform is designed around them — and every text is
          named here, with what it governs and a link to the page of the
          official gazette where it begins."
        actions={[
          { label: "Talk to us", href: "/#contact-platform" },
          { label: "About Pixely", href: "/about", variant: "outline" },
        ]}
        aside={<LegalGlyph />}
      />

      {PILLARS.map((pillar, i) => (
        <ServiceBand
          key={pillar.value}
          index={`${String(i + 1).padStart(2, "0")} — ${pillar.value}`}
          title={`${pillar.label}.`}
          lede={pillar.body}
          ground={GROUNDS[i]}
        >
          <LawLedger laws={pillar.laws} />
        </ServiceBand>
      ))}

      <ServiceBand
        index="05 — Reading the texts"
        title="What this page is, and isn't."
        lede="Six texts, two of them with the amendments that changed them. A
          note on how they are set out here, and on what naming them means."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "The official text",
              body: "Every link opens the Journal Officiel of the République Algérienne — the official gazette — in its French edition, at the page where the text begins.",
            },
            {
              label: "Amendments",
              body: "An amendment is set under the law it amends rather than on its own, because the number a reader will look up is the original's.",
            },
            {
              label: "Not a licence",
              body: "These name the framework Pixely is built for; they are not a licence or a certification. Pixely is not a bank, and is not an authorised electronic money institution.",
            },
          ]}
        />
      </ServiceBand>

      <CompanyCTA
        index="06 — Get in touch"
        titleLines={["Talk", "to us"]}
        lede="Ask how the platform is designed around these texts, or about
          building your own service on it."
        actions={[{ label: "Talk to us", href: "/#contact-platform" }]}
      />
    </ServiceShell>
  );
}
