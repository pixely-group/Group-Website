import type { Metadata } from "next";

import IdentityGlyph from "@/components/service/IdentityGlyph";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceCTA,
  ServiceHero,
  ServiceShell,
} from "@/components/service/ServicePage";

export const metadata: Metadata = {
  title: "Pixely — Identity",
  description:
    "Document eKYC, liveness, business verification and screening for Algeria — one API, one verdict, attested on the Pixely ledger.",
};

/**
 * The first service with a page of its own. The shape of this file — hero
 * with the service's fragment of the Pixely drawing, what-it-is, how-it-runs,
 * the invitation — is the template the other five services will repeat with
 * their own words and their own piece of the puzzle.
 *
 * The copy holds the site's standing rule: nothing invented. No certification
 * claims, no latency figures, no coverage numbers — the page says what the
 * service does and how it runs, and stops there.
 */
export default function IdentityPage() {
  return (
    <ServiceShell>
      <ServiceHero
        eyebrow="Platform — Identity"
        title="Every user,"
        serif="proved"
        lede="Pixely Identity reads the document, checks that the person
          holding it is present and alive, and screens both against the lists
          that matter — one call, one verdict, built for Algerian documents
          and Algerian rules."
        glyph={<IdentityGlyph />}
      />

      <ServiceBand
        index="01 — What it does"
        title="Six checks. One answer."
        lede="Each check stands on its own behind the same API, and your
          policy decides which of them a verification runs. What comes back
          is not six scores to interpret — it is a verdict."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "Document eKYC",
              body: "National identity cards, passports and driving licences read and authenticated — fields extracted, machine-readable zones parsed, security features checked against the document's own rules.",
            },
            {
              label: "Liveness",
              body: "The person in front of the camera is present, alive and the same person the document shows — not a photograph of a photograph, not a replay.",
            },
            {
              label: "Business verification",
              body: "Registry records, beneficial owners and signatories for the companies you onboard, resolved to the actual people behind them.",
            },
            {
              label: "Screening",
              body: "Sanctions, politically exposed persons and adverse media — at onboarding, and again on every re-check your policy schedules.",
            },
            {
              label: "Attribute proofs",
              body: "Answer questions without copying data. Over eighteen, resident, account holder — attested by the platform, carried by the user.",
            },
            {
              label: "APIs and SDKs",
              body: "A REST API and drop-in capture kits for web and mobile, so the first verification is an afternoon's work rather than a quarter's.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — How it runs"
        title="From a camera to a verdict."
        lede="Four movements, and the last one is the point: identity on
          Pixely is proved once, then proved again — without asking twice."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Capture",
              body: "The kit guides the shot — document, face, glare and focus handled on the device before anything is sent.",
            },
            {
              title: "Verify",
              body: "Document authenticity, liveness and face match run together; screening joins wherever your policy asks for it.",
            },
            {
              title: "Attest",
              body: "The result is written to the ledger as a signed attestation — who was proved, when, and by which checks.",
            },
            {
              title: "Reuse",
              body: "The next product asks the attestation, not the person. Onboarding stops repeating itself.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceCTA
        index="03 — Get started"
        title="Prove your first user."
        lede="Create an account and run a verification against the sandbox,
          or talk to an engineer about your documents and your rules."
      />
    </ServiceShell>
  );
}
