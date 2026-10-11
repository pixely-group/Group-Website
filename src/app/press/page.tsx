import type { Metadata } from "next";

import Offices from "@/components/about/Offices";
import Boilerplate from "@/components/company/Boilerplate";
import BrandMark from "@/components/company/BrandMark";
import CompanyCTA from "@/components/company/CompanyCTA";
import CompanyHero from "@/components/company/CompanyHero";
import PressAside from "@/components/company/PressAside";
import {
  FeatureGrid,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";

export const metadata: Metadata = {
  title: "Pixely — Press",
  description:
    "Press and media: a description of Pixely you can quote, the two companies behind it and their registration details, the wordmark, and the media contact.",
};

/**
 * The press page holds only what a journalist can rely on: a description
 * built from the site's own sentences, the companies as their registers
 * record them, the mark as it is set, and the address that answers. No
 * coverage, no logos of publications, no announcements — there are none to
 * show, and a press page that invents them is the first thing a journalist
 * checks.
 */
export default function PressPage() {
  return (
    <ServiceShell>
      <CompanyHero
        eyebrow="Company — Press"
        title="For the"
        serif="record"
        lede="For journalists and editors: a description of Pixely you can
          quote as it stands, the two companies behind it, the wordmark, and
          the address that answers media enquiries."
        actions={[
          { label: "Media enquiry", href: "/#contact-press" },
          { label: "About Pixely", href: "/about", variant: "outline" },
        ]}
        aside={<PressAside />}
      />

      <ServiceBand
        index="01 — About Pixely, for publication"
        title="In our own words."
        lede="Quote either version as it stands. Each is built only from what
          this site says about the company and its platform."
        ground="bone"
      >
        <Boilerplate />
      </ServiceBand>

      <ServiceBand
        index="02 — The companies"
        title="Two companies, one name."
        lede="PIXELY LTD, incorporated in England and Wales on 28 September
          2018, operates this website. SARL PIXELY is the company in Algeria,
          where the platform is built. Registration details are as each
          register records them."
        ground="ink"
      >
        <Offices />
      </ServiceBand>

      <ServiceBand
        index="03 — The name and the mark"
        title="Pixely, with a full stop."
        lede="The wordmark is the name in capitals, closed by the brand's full
          stop — a square on the baseline. For the mark in a format you can
          print, write to the press desk."
        ground="bone"
      >
        <BrandMark />
        <div className="mt-14">
          <FeatureGrid
            items={[
              {
                label: "The name",
                body: "In running text the company is Pixely — one word, a capital P, no full stop. The capitals and the square belong to the wordmark.",
              },
              {
                label: "The full stop",
                body: "The square is the mark's own punctuation, set in Signal — the brand's one accent. It closes the name the way a full stop closes a sentence.",
              },
              {
                label: "The short form",
                body: "P and the square — the same mark contracted, as the navigation bar gathers it when the page scrolls. The letters between fold away; the full stop stays.",
              },
            ]}
          />
        </div>
      </ServiceBand>

      <CompanyCTA
        index="04 — Media enquiries"
        titleLines={["Talk", "to us"]}
        lede="For interviews, briefings and anything this page does not answer,
          write to contact@pixely.dz or use the contact form — it opens on
          Press."
        actions={[
          { label: "Media enquiry", href: "/#contact-press" },
          {
            label: "contact@pixely.dz",
            href: "mailto:contact@pixely.dz",
            variant: "outline",
          },
        ]}
      />
    </ServiceShell>
  );
}
