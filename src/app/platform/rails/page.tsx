import type { Metadata } from "next";

import LawList, { LAWS } from "@/components/platform/LawList";
import PlatformCTA from "@/components/platform/PlatformCTA";
import PlatformHero from "@/components/platform/PlatformHero";
import Register from "@/components/platform/Register";
import { RailsGlyph } from "@/components/platform/glyphs";
import {
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";

export const metadata: Metadata = {
  title: "Pixely — Rails",
  description:
    "The rails the Pixely platform is designed to work with — ARTS for real-time gross settlement, ATCI for interbank clearing, SWIFT for cross-border, card schemes and book transfers — and one instruction that finds the right one.",
};

/**
 * The rails, as the front page's data names them: ARTS for real-time gross
 * settlement, ATCI for interbank clearing, SWIFT for cross-border, with the
 * card scheme and book transfers from the security layers' own list.
 *
 * Written as the rails the platform is designed to work with — never as
 * memberships or connections held. The note under the register says so, and
 * the laws cited are the ones that govern who may use them.
 */
export default function RailsPage() {
  return (
    <ServiceShell>
      <PlatformHero
        eyebrow="Platform — Rails"
        title="Every rail,"
        serif="routed"
        lede="Value settles on Algeria's own rails and the roads that leave
          the country. The platform is designed to work with each of them,
          and to choose between them — one instruction in, the right rail
          out."
        glyph={<RailsGlyph />}
        primary={{ label: "Partner with us", href: "/#contact-partnerships" }}
        secondary={{ label: "See the ledger", href: "/platform/ledger" }}
      />

      <ServiceBand
        index="01 — The rails"
        title="Where value finally settles."
        lede="The roads money travels in and out of Algeria, and the one that
          never leaves the platform."
        ground="bone"
      >
        <Register
          rows={[
            {
              index: "ARTS",
              name: "Real-time gross settlement",
              spec: "Domestic · DZD · one by one",
              note: "Large-value and urgent payments settled individually, in real time, between banks — the rail for the transfer that cannot wait for a batch.",
            },
            {
              index: "ATCI",
              name: "Interbank clearing",
              spec: "Domestic · DZD · cleared between banks",
              note: "The everyday rail: transfers, payroll and collections cleared between Algerian banks.",
            },
            {
              index: "SWIFT",
              name: "Cross-border",
              spec: "International · foreign currency",
              note: "The road for money that leaves or enters the country — the supplier abroad, the payment from a corridor.",
            },
            {
              index: "Card",
              name: "Card schemes",
              spec: "Authorisation · clearing",
              note: "The card tap and the online checkout, authorised through the scheme the card belongs to.",
            },
            {
              index: "Book",
              name: "Book transfers",
              spec: "On the platform · ledger only",
              note: "Between two accounts on the platform itself: the money moves in the ledger and never needs an external rail.",
            },
          ]}
        />
        <p
          data-fade
          className="type-label mt-10 max-w-3xl text-[0.625rem] leading-relaxed text-(--faint)"
        >
          These are the rails the platform is designed to work with. They are
          not memberships held by Pixely: access to each runs through the
          institutions and the authorisations it requires.
        </p>
      </ServiceBand>

      <ServiceBand
        index="02 — Routing"
        title="One instruction, the right rail."
        lede="You say what should happen. The platform is built to decide how
          — which rail, at what moment — and to tell you when it has."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Instruct",
              body: "One payment instruction, the same shape whatever the destination. The rail can be named, or left to the platform.",
            },
            {
              title: "Route",
              body: "Amount, urgency, currency and destination decide the rail — real-time settlement, clearing, card, cross-border or book.",
            },
            {
              title: "Settle",
              body: "The payment travels on its rail, under the policy that cleared it, with its status streamed back as it changes.",
            },
            {
              title: "Reconcile",
              body: "The rail's confirmation comes back to the ledger and is matched to the instruction that sent it. Nothing is reconciled by hand.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — The rules of the road"
        title="Built around Algerian law."
        lede="Who may move money, and how, is set by statute and by the Banque
          d'Algérie. These are the texts the platform's payments are designed
          around."
        ground="bone"
      >
        <LawList
          items={[
            {
              law: LAWS.banking,
              note: "The monetary and banking law: the frame every payment in Algeria sits inside.",
            },
            {
              law: LAWS.psp,
              note: "The Banque d'Algérie's rules for the authorisation, licensing and operation of payment service providers.",
            },
            {
              law: LAWS.ecommerce,
              note: "The law on electronic commerce, for the merchant collections and checkouts the rails carry.",
            },
          ]}
        />
      </ServiceBand>

      <PlatformCTA
        index="04 — Partnerships"
        titleLines={["Build the", "rails with us"]}
        lede="Banks, institutions and technology partners: talk to us about
          the rails, the routing and how the platform is designed to connect
          to them."
        primary={{ label: "Partner with us", href: "/#contact-partnerships" }}
        secondary={{ label: "The network", href: "/platform/network" }}
      />
    </ServiceShell>
  );
}
