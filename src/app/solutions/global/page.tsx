import type { Metadata } from "next";

import Globe from "@/components/ui/Globe";
import SolutionCTA from "@/components/solutions/SolutionCTA";
import SolutionHero from "@/components/solutions/SolutionHero";
import { LAWS, LawList, Markers } from "@/components/solutions/parts";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import { topicHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Pixely — Global",
  description:
    "Algeria, connected to the markets it trades with: built for Algeria and connected outward, so value can move between Algerian businesses and their partners abroad on one platform.",
};

/**
 * Solutions — Global. UseCases' fifth audience, with the front page's
 * globe as its drawing and the globe's pillars as its framework: the laws
 * are the same texts, linked the same way. No count of corridors or
 * markets — the drawing shows them, the words do not number them.
 */
export default function GlobalPage() {
  return (
    <ServiceShell>
      <SolutionHero
        eyebrow="Solutions — Global"
        title="Algeria,"
        serif="connected"
        lede="Algeria, connected to the markets it trades with. Pixely is
          built for Algeria and connects it outward, so value can move
          between Algerian businesses and their partners abroad on one
          platform."
        glyph={
          <>
            {/* Sized by its height, as GlobalCorridors sizes it: the
                camera fits the sphere to the shorter axis. */}
            <div className="-mx-6 h-[clamp(320px,82vw,560px)] sm:mx-0 lg:h-[clamp(380px,40vw,560px)]">
              <Globe className="h-full w-full" />
            </div>
            <p
              aria-hidden
              className="type-label mt-3 text-center text-[9px] text-(--faint)"
            >
              Drag to turn
            </p>
            <p className="sr-only">
              A globe showing corridors running between Algiers and financial
              centres worldwide, with value moving along each. Drag to rotate
              it.
            </p>
          </>
        }
        talk={{ label: "Partner with us", href: `/${topicHref("partnerships")}` }}
      />

      <ServiceBand
        index="01 — What it is built to do"
        title="Built here, connected outward."
        lede="Pixely does not reach Algeria from somewhere
          else. It starts in Algeria and reaches out from it, to the markets its
          businesses already trade with."
        ground="bone"
      >
        <Markers
          items={[
            {
              value: "Algeria",
              label: "Built here, for here",
              body: "Designed around the dinar, the country's own rails and its own law, by a company in Algiers — not adapted to them afterwards.",
            },
            {
              value: "Outward",
              label: "Corridors to trading partners",
              body: "Every corridor runs to Algiers, so value can move between it and the markets Algerian businesses actually trade with.",
            },
            {
              value: "One view",
              label: "Domestic and cross-border together",
              body: "A payment at home and a payment abroad sit on the same platform and the same record, rather than in two systems that never meet.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — How value moves"
        title="From a dinar account to a partner abroad."
        lede="Four parts of one movement, each carried on the same platform
          and written to the same record."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Local accounts",
              body: "Dinar accounts in Algeria, on the rails the country clears on — ARTS for real-time gross settlement, ATCI for interbank clearing.",
            },
            {
              title: "FX",
              body: "Conversion between the dinar and a partner's currency, carried on the same record as the payment it belongs to and within the rules that govern it.",
            },
            {
              title: "Corridors",
              body: "Cross-border movement over SWIFT, between Algiers and the markets at the other end of the trade.",
            },
            {
              title: "Records",
              body: "Every leg of the journey on one record, so the domestic side and the foreign side tell the same story.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — The framework"
        title="Built around Algerian law."
        lede="The platform is designed around the texts that govern banking,
          payments, commerce and data in Algeria — and the corridors run
          inside them, not around them."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "Data stays home",
              body: "Personal data stays under Algerian law, and leaves the country only with the national authority's authorisation.",
            },
            {
              label: "Checked on the way out",
              body: "Anti-money-laundering checks, risk scoring and the audit trail run inside each cross-border transaction, as they do at home.",
            },
            {
              label: "Proved once",
              body: "A business proves who it is once — registry, owners and signatories — and every corridor can rely on it after.",
            },
          ]}
        />
        <div className="mt-16">
          <LawList
            laws={[LAWS.banking, LAWS.psp, LAWS.ecommerce, LAWS.aml, LAWS.data]}
          />
        </div>
      </ServiceBand>

      <SolutionCTA
        index="04 — Get started"
        titleLines={["Open the", "corridor"]}
        lede="Banks, institutions and technology partners: tell us which
          markets you trade with, and we will talk through how the platform
          is built to connect them."
        primary={{ label: "Partner with us", href: `/${topicHref("partnerships")}` }}
      />
    </ServiceShell>
  );
}
