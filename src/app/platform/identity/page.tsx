import type { Metadata } from "next";

import ChecksCinema from "@/components/service/ChecksCinema";
import IdentityHeroArt from "@/components/service/IdentityHeroArt";
import SignalStream from "@/components/service/SignalStream";
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
    "State-of-the-art identity verification and real-time fraud detection for fintechs — MRZ, OCR and NFC document authentication, liveness and face match, with every signal scored in the flow.",
};

/**
 * The first service with a page of its own, and the template the other five
 * will repeat: hero with the service's fragment of the Pixely drawing, the
 * technology on a stage, how it runs, the invitation.
 *
 * The copy holds the site's standing rule: nothing invented. No
 * certification claims, no accuracy percentages, no latency figures — the
 * page says what each check does, what it defeats, and stops there.
 */
export default function IdentityPage() {
  return (
    <ServiceShell>
      <ServiceHero
        eyebrow="Platform — Identity"
        title="Every user,"
        serif="proved"
        lede="State-of-the-art identity verification and real-time fraud
          detection, built for fintechs: the document read and authenticated
          down to its chip, the face proved live and matched, and every
          fraud signal scored while the user is still in the flow."
        glyph={<IdentityHeroArt />}
      />

      {/* The set piece: five viewports of scroll, one particle scene
          performing the whole verification. */}
      <ChecksCinema />

      <ServiceBand
        index="02 — Real-time fraud detection"
        title="Caught in the act, not in the audit."
        lede="Fraud signals are not a report that arrives after the money
          has moved. They are scored during the verification itself, and
          the verdict carries them — so the decision happens while the
          fraudster is still holding the camera."
        ground="ink"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <FeatureGrid
            cols={2}
            items={[
              {
                label: "Document forensics",
              body: "Tamper detection on every capture — replaced portraits, edited text, print artefacts and screen recaptures, judged against how the genuine document is actually built.",
            },
            {
              label: "Injection defence",
              body: "Virtual cameras, emulators and replayed streams are caught at the capture layer: the feed itself is authenticated before a single frame is trusted.",
            },
            {
              label: "Device intelligence",
              body: "The device tells its own story. Rooted handsets, emulators, tampered clocks and repeated attempts all score against the session they come from.",
            },
            {
              label: "Velocity and reuse",
              body: "The same face or the same document surfacing under different names is caught across your whole user base — not just inside one session.",
            },
            {
              label: "Watchlist screening",
              body: "Sanctions, politically exposed persons and adverse media at onboarding, then re-screened on whatever schedule your policy sets.",
            },
            {
              label: "Your rules, in the loop",
              body: "Every signal streams into your policy engine: approve, refuse or route to review in the same call, with the evidence attached to the verdict.",
            },
            ]}
          />
          <div data-fade>
            <SignalStream />
          </div>
        </div>
      </ServiceBand>

      <ServiceBand
        index="03 — How it runs"
        title="From a camera to a verdict."
        lede="Four movements, and the last one is the point: identity on
          Pixely is proved once, then proved again — without asking twice."
        ground="bone"
      >
        <FlowSteps
          steps={[
            {
              title: "Capture",
              body: "The kit guides the shot — document, face, glare and focus handled on the device before anything is sent.",
            },
            {
              title: "Verify",
              body: "All five checks and the fraud signals run in one pass — print, machine lines, chip, face and device judged together.",
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

      <ServiceBand
        index="04 — Beyond the document"
        title="Verification is the front door."
        lede="The platform keeps working after it closes — on the companies
          behind the accounts, on questions that deserve answers instead of
          copies, and inside your own stack."
        ground="ink"
      >
        <FeatureGrid
          items={[
            {
              label: "Business verification",
              body: "Registry records, beneficial owners and signatories for the companies you onboard, resolved to the actual people behind them — the same checks, aimed at a business.",
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

      <ServiceCTA
        index="05 — Get started"
        titleLines={["Prove your", "first user"]}
        lede="Create an account and run a verification against the sandbox,
          or talk to an engineer about your documents and your rules."
      />
    </ServiceShell>
  );
}
