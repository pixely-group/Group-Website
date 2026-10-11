import type { Metadata } from "next";

import { LAWS, LawList, StagePanel, Stream } from "@/components/product/Parts";
import { ProductCTA, ProductHero } from "@/components/product/ProductChrome";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import HairlineFigure from "@/components/ui/HairlineFigure";

export const metadata: Metadata = {
  title: "Pixely — Compliance",
  description:
    "Regulatory compliance, risk management and audit-ready reporting built into the platform — anti-money-laundering checks, risk scoring and an audit trail inside every transaction.",
};

/**
 * Compliance, in the Identity page's rhythm: the statement, the checks
 * inside the transaction, risk as it happens, how the record is kept, the
 * texts it is built around, the invitation.
 *
 * On this page more than any other the standing rule is the point: no
 * certifications, no "compliant", no regulator's endorsement. The platform
 * is built to make compliance a property of every transaction; whether a
 * business is compliant is for its regulator to say, and the page says so.
 */
export default function CompliancePage() {
  return (
    <ServiceShell>
      <ProductHero
        eyebrow="Platform — Compliance"
        title="Audit-ready,"
        serif="by construction"
        lede="Regulatory compliance, risk management and audit-ready
          reporting, built into the platform rather than assembled afterwards
          — so every new service inherits them instead of re-implementing
          them."
        figure={<HairlineFigure file="compliance.js" name="vault" />}
        topic="platform"
      />

      <ServiceBand
        index="01 — Inside the transaction"
        title="Checked as it happens, not reconciled after."
        lede="Anti-money-laundering checks, risk scoring and the audit trail
          run inside each transaction. By the time a payment settles, the
          evidence that it was allowed to is already on the record."
        ground="ink"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <FeatureGrid
            cols={2}
            items={[
              {
                label: "Customer due diligence",
                body: "Every holder is proved before an account exists — people by document, chip and face, businesses by registry and beneficial owners.",
              },
              {
                label: "Screening",
                body: "Sanctions and politically exposed persons checked at onboarding and on every relevant payment, then re-screened when the lists change.",
              },
              {
                label: "Transaction monitoring",
                body: "Patterns that suggest laundering or the financing of terrorism are watched for across accounts and over time, not one payment at a time.",
              },
              {
                label: "Case management",
                body: "An alert becomes a case with its evidence attached — the accounts, the movements, the signals — and a decision someone signs.",
              },
              {
                label: "Reporting",
                body: "Suspicious activity reports and the routine returns the law requires, assembled from the ledger and ready for a person to file.",
              },
              {
                label: "Policy as configuration",
                body: "Thresholds, rules and approvals written once, versioned, and applied the same way to every transaction they govern.",
              },
            ]}
          />
          <div data-fade className="h-full">
            <StagePanel label="Audit trail" note="Sample">
              <Stream
                rows={[
                  { key: "holder.proved", what: "document · chip · face", verdict: "9c4e·a1", tone: "muted" },
                  { key: "screening", what: "sanctions · no match", verdict: "CLEARED", tone: "positive" },
                  { key: "screening", what: "pep · no match", verdict: "CLEARED", tone: "positive" },
                  { key: "risk.scored", what: "profile · standard", verdict: "3f02·7d", tone: "muted" },
                  { key: "monitoring", what: "structuring pattern", verdict: "ALERT", tone: "accent" },
                  { key: "case.opened", what: "evidence attached", verdict: "b81a·40", tone: "muted" },
                  { key: "approval", what: "2 of 3 · signed", verdict: "CLEARED", tone: "positive" },
                  { key: "payment.refused", what: "policy · limit", verdict: "REFUSED", tone: "negative" },
                  { key: "report.drafted", what: "awaiting review", verdict: "e7d5·19", tone: "muted" },
                  { key: "export", what: "auditor · read only", verdict: "52c8·0b", tone: "muted" },
                ]}
              />
            </StagePanel>
          </div>
        </div>
      </ServiceBand>

      <ServiceBand
        index="02 — Risk management"
        title="Risk, managed while it is still risk."
        lede="A risk found at month-end is a loss. The platform is built to
          see it at the account, the payment and the portfolio as each one
          changes."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "Risk per customer",
              body: "Each holder carries a risk profile that moves with what they do, and decides which checks and limits apply to them.",
            },
            {
              label: "Limits and controls",
              body: "Per-payment, per-period and per-counterparty limits, enforced before anything moves rather than discovered after.",
            },
            {
              label: "Dual control",
              body: "The movements that matter need more than one person: approvals that match your organisation, with every signature recorded.",
            },
            {
              label: "Exposure, live",
              body: "Balances, obligations and concentrations across entities and currencies, read off the ledger as it stands now.",
            },
            {
              label: "Data kept in Algeria",
              body: "Personal data stays under Algerian law, and leaves the country only with the national authority's authorisation.",
            },
            {
              label: "Every change recorded",
              body: "Who changed a rule, a limit or a role, when, and with whose approval — governance on the same record as the money.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — How the record is kept"
        title="An answer for every question an auditor asks."
        lede="Four movements, and each leaves something behind: the evidence
          is produced by the work itself, not collected afterwards."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Know",
              body: "The holder proved and screened before the first transaction, with the attestation kept on the ledger.",
            },
            {
              title: "Check",
              body: "Each transaction screened, scored and held against policy inside its own path, before it reaches a rail.",
            },
            {
              title: "Record",
              body: "Every decision written to an append-only, hash-linked ledger under dual control — a record nobody can edit.",
            },
            {
              title: "Report",
              body: "Reports, exports and read-only auditor access drawn from that record, so the evidence is the history itself.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="04 — Built around"
        title="The texts it answers to."
        lede="Regulatory-ready means built for a specific body of law. These
          are the texts the compliance service is designed to work within."
        ground="bone"
      >
        <LawList
          laws={[
            {
              law: LAWS["05-01"],
              bears: "The prevention of money laundering and terrorist financing — the duties to know the customer, watch the transactions and report what is suspicious.",
            },
            {
              law: LAWS["18-07"],
              bears: "The protection of personal data: how it may be processed, and the national authority's authorisation before any of it leaves the country.",
            },
          ]}
        />
      </ServiceBand>

      <ProductCTA
        index="05 — Get started"
        titleLines={["Ready for", "the auditor"]}
        lede="Create an account and see the record the sandbox keeps, or talk
          to an engineer about your obligations and your policy."
        topic="platform"
      />
    </ServiceShell>
  );
}
