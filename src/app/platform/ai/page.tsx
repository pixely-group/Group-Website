import type { Metadata } from "next";

import { StagePanel, Stream } from "@/components/product/Parts";
import { ProductCTA, ProductHero } from "@/components/product/ProductChrome";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import HairlineFigure from "@/components/ui/HairlineFigure";

export const metadata: Metadata = {
  title: "Pixely — AI services",
  description:
    "Fraud detection, intelligent automation and AI-assisted decisioning, run in the path of the transaction — so fraud is caught before the money leaves.",
};

/**
 * AI services, in the Identity page's rhythm: the statement, fraud caught
 * in the path, the work automation takes off people's desks, how a
 * decision is made, the invitation.
 *
 * The standing rule holds, and it matters most on an AI page: no accuracy,
 * no detection rates, no model names, no "learns in milliseconds". The
 * page says where the intelligence runs and what it is for, and that a
 * person keeps the last word.
 */
export default function AIPage() {
  return (
    <ServiceShell>
      <ProductHero
        eyebrow="Platform — AI services"
        title="Fraud stops"
        serif="in flight"
        lede="Fraud detection, intelligent automation and AI-assisted
          decisioning, running on the same platform that moves the payment —
          so a decision is made in the path of the transaction rather than
          after it."
        figure={<HairlineFigure file="ai.js" name="chat" />}
        topic="platform"
      />

      <ServiceBand
        index="01 — Fraud detection"
        title="Fraud caught before the money leaves."
        lede="A fraud report that arrives the next morning describes money
          that has already gone. On Pixely the scoring sits between the
          request and the rail, so the answer comes while there is still
          something to stop."
        ground="ink"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <FeatureGrid
            cols={2}
            items={[
              {
                label: "Transaction scoring",
                body: "Every payment is judged against the payer's own history — the amount, the payee, the hour, the place — before it is routed.",
              },
              {
                label: "Behaviour and device",
                body: "How a session moves, which device it comes from and whether that device has been tampered with all count toward the same score.",
              },
              {
                label: "Networks, not just payments",
                body: "Money mules and rings show up in the shape of who pays whom. The platform reads that shape across accounts, not one payment at a time.",
              },
              {
                label: "One view of the person",
                body: "The signals from onboarding travel with the account, so the fraud model knows what identity verification already saw.",
              },
              {
                label: "Reasons, not just scores",
                body: "Every hold and every refusal carries the signals that drove it, in words a reviewer and a regulator can both read.",
              },
              {
                label: "Your rules, in the loop",
                body: "Scores feed your policy rather than replacing it: allow, hold for review or refuse, decided by thresholds you set and can change.",
              },
            ]}
          />
          <div data-fade className="h-full">
            <StagePanel label="Decision stream" note="Sample">
              <Stream
                rows={[
                  { key: "payment.score", what: "usual payee, usual device", verdict: "ALLOW", tone: "positive" },
                  { key: "velocity", what: "new payees in quick succession", verdict: "HOLD", tone: "accent" },
                  { key: "device.intel", what: "emulator detected", verdict: "REFUSE", tone: "negative" },
                  { key: "payment.score", what: "salary credit, expected", verdict: "ALLOW", tone: "positive" },
                  { key: "network", what: "funds fanned to new accounts", verdict: "HOLD", tone: "accent" },
                  { key: "session", what: "pasted credentials, new device", verdict: "REVIEW", tone: "accent" },
                  { key: "payment.score", what: "merchant, regular basket", verdict: "ALLOW", tone: "positive" },
                  { key: "account.takeover", what: "password reset, then payout", verdict: "REFUSE", tone: "negative" },
                  { key: "payment.score", what: "first payment to a supplier", verdict: "ALLOW", tone: "positive" },
                  { key: "review.closed", what: "hold released by analyst", verdict: "ALLOW", tone: "positive" },
                ]}
              />
            </StagePanel>
          </div>
        </div>
      </ServiceBand>

      <ServiceBand
        index="02 — Intelligent automation"
        title="The work nobody should do by hand."
        lede="Much of what a finance operation does all day is reading,
          matching and sorting. The platform is built to do that part, so
          people spend their time on the cases that need judgement."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "Reconciliation",
              body: "Incoming money matched to the invoice it pays as it lands, so the books close while the month is still running.",
            },
            {
              label: "Categorisation",
              body: "Every movement labelled with what it was for, consistently, and exportable the moment it settles.",
            },
            {
              label: "Documents read",
              body: "Invoices, statements and registry extracts read into structured fields, with the source kept beside what was taken from it.",
            },
            {
              label: "Cases routed",
              body: "Alerts arrive at the right reviewer with the evidence already gathered — the account, the history, the signals and what they mean.",
            },
            {
              label: "Questions answered",
              body: "Ask about a customer, a payment or a balance in plain language and get the answer with the records it came from.",
            },
            {
              label: "Reports drafted",
              body: "The routine reports a finance or compliance team owes assembled from the ledger, ready for a person to check and send.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — How a decision is made"
        title="AI-assisted, never unaccountable."
        lede="Four movements, and the last one keeps the rest honest: every
          decision the platform helps make can be explained, reviewed and
          corrected."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Signal",
              body: "The payment, the session, the device and the history around them gathered at the moment of the request.",
            },
            {
              title: "Score",
              body: "Models and rules judge the signals together, and each score keeps the reasons that produced it.",
            },
            {
              title: "Decide",
              body: "Your policy turns the score into an outcome — allow, hold or refuse — in the same call, before the rail.",
            },
            {
              title: "Review",
              body: "People take the cases that need judgement, and their outcomes are fed back into the models and the rules.",
            },
          ]}
        />
      </ServiceBand>

      <ProductCTA
        index="04 — Get started"
        titleLines={["Put it in", "the path"]}
        lede="Create an account and run payments through the sandbox's
          decisioning, or talk to an engineer about your fraud and your rules."
        topic="platform"
      />
    </ServiceShell>
  );
}
