import type { Metadata } from "next";

import ApiConsole from "@/components/product/ApiConsole";
import { ProductCTA, ProductHero } from "@/components/product/ProductChrome";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import HairlineFigure from "@/components/ui/HairlineFigure";

export const metadata: Metadata = {
  title: "Pixely — APIs and SDKs",
  description:
    "Developer-first APIs and SDKs for straightforward integration — accounts, payments, identity and webhooks behind one platform, with a sandbox to build against.",
};

/**
 * APIs and SDKs, in the Identity page's rhythm: the statement, what an
 * integration looks like, how it is built for the people building on it,
 * the road from sandbox to launch, the invitation — to the developers'
 * conversation rather than the platform one.
 *
 * The samples are sketches of shape, and the console says so twice. There
 * is no published reference yet, so nothing on this page pretends to be
 * one: no version numbers, no rate limits, no SDK languages listed as
 * shipped, no uptime.
 */
export default function APIsPage() {
  return (
    <ServiceShell>
      <ProductHero
        eyebrow="Platform — APIs and SDKs"
        title="Build on"
        serif="Pixely"
        lede="Developer-first APIs and SDKs for straightforward integration:
          accounts, payments, identity checks and fraud screening behind one
          platform, so a team builds its product rather than a stack of
          providers."
        figure={<HairlineFigure file="apis.js" name="modules" />}
        topic="developers"
        talk="Ask for the sandbox"
      />

      <ServiceBand
        index="01 — One integration"
        title="The whole platform, one API."
        lede="Every service on Pixely is reachable the same way: a resource,
          a request and an answer, with an event when anything changes. Four
          of them, sketched."
        ground="ink"
      >
        <ApiConsole />
      </ServiceBand>

      <ServiceBand
        index="02 — Built for builders"
        title="The details that save a quarter."
        lede="An API is judged in the week after the first call. These are
          the parts the platform is designed around, so that week is short."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "Predictable by design",
              body: "Resources named for what they are, JSON in and out, and errors that say what went wrong and what to do about it.",
            },
            {
              label: "Safe to retry",
              body: "Idempotency keys on every call that moves money, so a dropped connection never becomes a payment made twice.",
            },
            {
              label: "Signed events",
              body: "Webhooks for every state change, each one signed and replay-protected, so your system can trust what it hears.",
            },
            {
              label: "Scoped keys",
              body: "Keys that can do only what they were issued for, mutual TLS for the calls that matter, and every request signed.",
            },
            {
              label: "SDKs and capture kits",
              body: "Client libraries for the server, and drop-in kits for web and mobile that handle the camera, the chip and the card.",
            },
            {
              label: "A sandbox with rails",
              body: "Simulated ARTS, ATCI and SWIFT to build against, with test identities and failures you can trigger on purpose.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="03 — How it runs"
        title="From a key to launch."
        lede="Four movements, and the third one is ours as much as yours:
          nothing goes live on the platform without a review."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Sandbox",
              body: "Ask for access and get keys to an environment with simulated rails, test identities and the full set of resources.",
            },
            {
              title: "Build",
              body: "Open accounts, move money and prove people against the sandbox, with webhooks arriving exactly as they will in production.",
            },
            {
              title: "Review",
              body: "Before go-live, your integration, your flows and your policies are reviewed with an engineer.",
            },
            {
              title: "Launch",
              body: "The same calls, pointed at production. Nothing in your code changes but the key.",
            },
          ]}
        />
      </ServiceBand>

      <ProductCTA
        index="04 — Get started"
        titleLines={["Ask for the", "sandbox"]}
        lede="Tell us what you are building, and ask for sandbox access and
          the API reference."
        topic="developers"
        talk="Ask for the sandbox"
      />
    </ServiceShell>
  );
}
