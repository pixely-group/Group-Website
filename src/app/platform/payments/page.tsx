import type { Metadata } from "next";

import { ProductCTA, ProductHero } from "@/components/product/ProductChrome";
import { LAWS, LawList, StagePanel, Stream } from "@/components/product/Parts";
import RailBoard from "@/components/product/RailBoard";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import HairlineFigure from "@/components/ui/HairlineFigure";

export const metadata: Metadata = {
  title: "Pixely — Payments",
  description:
    "Real-time payments, transfers and merchant collections for Algeria — routed across ARTS, ATCI and SWIFT and settled as they happen, not overnight.",
};

/**
 * Payments, in the Identity page's rhythm: the statement, what moves, the
 * rails it moves on, how one payment runs, the texts it is built around,
 * the invitation.
 *
 * The standing rule holds: nothing invented. No settlement times, no
 * volumes, no fees, no scheme memberships and no claim to be authorised —
 * the page says what the platform is built to do and which rails and laws
 * it is built for. The event rows are labelled as samples, the way the
 * front page labels its own.
 */
export default function PaymentsPage() {
  return (
    <ServiceShell>
      <ProductHero
        eyebrow="Platform — Payments"
        title="Money that"
        serif="moves now"
        lede="Real-time payments, transfers and merchant collections, built
          for Algeria: person to person, business to business and merchant
          payments settled as they happen — not gathered into a nightly batch
          and cleared the next working day."
        figure={<HairlineFigure file="payments.js" name="payments" />}
        topic="platform"
      />

      <ServiceBand
        index="01 — Real time, not overnight"
        title="Every payment, as it happens."
        lede="A payment on Pixely is not a request that waits for the end of
          the day. It is screened, routed and posted while the person who
          sent it is still looking at the screen — and both sides see the
          same state at the same moment."
        ground="ink"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <FeatureGrid
            cols={2}
            items={[
              {
                label: "Person to person",
                body: "Send to a contact or an account, and the money is there when the confirmation is — no waiting for the next clearing cycle.",
              },
              {
                label: "Business payments",
                body: "Suppliers, payroll and transfers between your own entities, with the approvals your organisation already requires sitting in the path of each one.",
              },
              {
                label: "Merchant collections",
                body: "Take payment online, in store or by request, and see each collection land on your ledger the moment it settles rather than in tomorrow's report.",
              },
              {
                label: "Payouts",
                body: "Pay many people at once — sellers, staff, refunds — by file or by API, every line tracked to its own outcome.",
              },
              {
                label: "One confirmation",
                body: "The sender, the recipient and your systems all hear the same thing at once: initiated, settled, or refused and why.",
              },
              {
                label: "Reconciled as it lands",
                body: "Every movement arrives categorised and matched to what it pays for, so reconciliation is a property of the ledger rather than a monthly event.",
              },
            ]}
          />
          <div data-fade className="h-full">
            <StagePanel label="Payment events" note="Sample">
              <Stream
                rows={[
                  { key: "payment.initiated", what: "p2p · mobile", verdict: "OK", tone: "muted" },
                  { key: "screening", what: "sanctions · no match", verdict: "CLEARED", tone: "positive" },
                  { key: "policy", what: "within limits", verdict: "CLEARED", tone: "positive" },
                  { key: "route.selected", what: "book transfer", verdict: "BOOK", tone: "accent" },
                  { key: "ledger.posted", what: "debit · credit", verdict: "POSTED", tone: "muted" },
                  { key: "payment.settled", what: "recipient notified", verdict: "SETTLED", tone: "positive" },
                  { key: "collection.received", what: "merchant · qr", verdict: "SETTLED", tone: "positive" },
                  { key: "route.selected", what: "large value", verdict: "ARTS", tone: "accent" },
                  { key: "approval", what: "payroll · 2 of 3", verdict: "HELD", tone: "accent" },
                  { key: "route.selected", what: "foreign supplier", verdict: "SWIFT", tone: "accent" },
                  { key: "policy", what: "velocity exceeded", verdict: "REFUSED", tone: "negative" },
                ]}
              />
            </StagePanel>
          </div>
        </div>
      </ServiceBand>

      <ServiceBand
        index="02 — The rails underneath"
        title="Four ways out, one platform."
        lede="Algeria's money moves on national rails, and the platform is
          built on them rather than around them. Each payment is routed to
          the rail that fits it — and whichever it takes, it lands on the
          same ledger, in the same record."
        ground="bone"
      >
        <RailBoard />
      </ServiceBand>

      <ServiceBand
        index="03 — How it runs"
        title="From a tap to settled."
        lede="Four movements, and none of them waits for the night: the
          checks run in the path of the payment, not after it."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Initiate",
              body: "From an app, a checkout or an API call — the payer proved once by the platform's identity layer, not asked again.",
            },
            {
              title: "Screen",
              body: "Limits, policy, sanctions and fraud signals judged before anything moves, with the reasons kept beside the decision.",
            },
            {
              title: "Route",
              body: "The platform chooses the rail — book transfer, ARTS, ATCI or SWIFT — from where the money is going and what it is for.",
            },
            {
              title: "Settle",
              body: "Posted to the ledger, confirmed to both sides and announced to your systems at once. The record is final, and it is the same everywhere.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="04 — Built around"
        title="The texts it answers to."
        lede="A payment platform in Algeria is built for a body of law, not
          around it. These are the texts the payments service is designed to
          work within."
        ground="bone"
      >
        <LawList
          laws={[
            {
              law: LAWS["23-09"],
              bears: "The monetary and banking law: the framework every payment service in the country sits inside.",
            },
            {
              law: LAWS["25-02"],
              bears: "The Banque d'Algérie's rules for payment service providers — how they are authorised, and how they must operate.",
            },
            {
              law: LAWS["18-05"],
              bears: "Electronic commerce: the rules that govern paying for goods and services online.",
            },
          ]}
        />
      </ServiceBand>

      <ProductCTA
        index="05 — Get started"
        titleLines={["Move your", "first dinar"]}
        lede="Create an account and move money between sandbox accounts, or
          talk to an engineer about your flows and your rails."
        topic="platform"
      />
    </ServiceShell>
  );
}
