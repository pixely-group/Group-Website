import type { Metadata } from "next";

import CodeSample from "@/components/platform/CodeSample";
import PlatformCTA from "@/components/platform/PlatformCTA";
import PlatformHero from "@/components/platform/PlatformHero";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import HairlineFigure from "@/components/ui/HairlineFigure";

export const metadata: Metadata = {
  title: "Pixely — Developer access",
  description:
    "Build on the Pixely platform: APIs, SDKs, a sandbox and an event stream, being built now and open by request — what developers will get, and how to ask.",
};

/**
 * Developer access, while the platform is being built: what a developer
 * will get, the shape a call is designed to take, and how to ask. The
 * sandbox and the reference are by request — the page says so wherever it
 * names them, and the one piece of code on it is labelled illustrative.
 */
export default function DevelopersPage() {
  return (
    <ServiceShell>
      <PlatformHero
        eyebrow="Platform — Developer access"
        title="Build on"
        serif="Pixely"
        lede="Developer-first APIs and SDKs for payments, wallets, identity,
          intelligence and compliance, on one platform. They are being built
          now; the sandbox and the reference open by request."
        glyph={
          <div className="mx-auto max-w-[560px]">
            <HairlineFigure file="apis.js" name="modules" />
          </div>
        }
        primary={{ label: "Request access", href: "/#contact-platform" }}
        secondary={{ label: "The network", href: "/platform/network" }}
      />

      <ServiceBand
        index="01 — What you will get"
        title="Everything the platform does, by call."
        lede="The same platform the services run on, exposed to your own
          code — so what you build inherits the identity, the ledger and the
          controls underneath."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "A REST API",
              body: "Payments, wallets, identity, decisioning and reporting behind one consistent API — one shape of request and one shape of error across every service.",
            },
            {
              label: "SDKs and capture kits",
              body: "Client libraries for the server, and drop-in kits for web and mobile that handle document and face capture on the device.",
            },
            {
              label: "A sandbox",
              body: "A full copy of the platform with test data and no real money, to build and break against before anything goes near the rails.",
            },
            {
              label: "Events and webhooks",
              body: "Every posting, approval and settlement as an event, delivered to your endpoint — so your systems hear what happened rather than polling for it.",
            },
            {
              label: "Scoped keys",
              body: "Keys scoped to what they are for, mutual TLS and replay windows: the application layer of the platform's security, in your hands.",
            },
            {
              label: "The reference",
              body: "Documentation for every endpoint, event and error, written alongside the platform and shared with developers as access opens.",
            },
          ]}
        />
        <p
          data-fade
          className="type-label mt-14 max-w-3xl text-[0.625rem] leading-relaxed text-(--faint)"
        >
          The platform is being built. The sandbox, the API reference and the
          SDKs are shared by request, not publicly available yet.
        </p>
      </ServiceBand>

      <ServiceBand
        index="02 — The shape of a call"
        title="Say what should happen."
        lede="A request names the outcome; the platform is designed to handle
          the rest — the rail, the approvals, the record — and to tell you
          about each step as an event."
        ground="ink"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div data-fade className="min-w-0">
            <CodeSample />
          </div>
          {/* Held to the top: the grid would otherwise stretch its rows to
              the sample's height and open gaps between them. */}
          <div className="self-start">
            <FeatureGrid
              cols={2}
              items={[
                {
                  label: "Idempotent",
                  body: "Every write carries a key, so a retried request is recognised rather than repeated. A payment is sent once.",
                },
                {
                  label: "Rail-agnostic",
                  body: "Name the rail or leave it to the platform. The request is the same shape either way.",
                },
                {
                  label: "Policy-aware",
                  body: "Approvals are part of the call's life. A request above your threshold waits, and says so.",
                },
                {
                  label: "Evented",
                  body: "Each step is announced as it happens, in the order it happened.",
                },
              ]}
            />
          </div>
        </div>
      </ServiceBand>

      <ServiceBand
        index="03 — How to get access"
        title="Ask, and we will open it."
        lede="Access is by request while the platform is being built, and
          every request is read by the team building it."
        ground="bone"
      >
        <FlowSteps
          steps={[
            {
              title: "Ask",
              body: "Tell us what you are building through the developer access form — the product, the services it needs and the timeline.",
            },
            {
              title: "Talk",
              body: "An engineer follows up to understand your use case and what you need from the platform first.",
            },
            {
              title: "Sandbox",
              body: "As access opens, you get the sandbox, the reference and the keys to build against it.",
            },
            {
              title: "Build",
              body: "Integrate against test data, with the people building the platform a message away.",
            },
          ]}
        />
      </ServiceBand>

      <PlatformCTA
        index="04 — Developer access"
        titleLines={["Request", "access"]}
        lede="Tell us what you are building, and we will be in touch about the
          sandbox, the reference and the SDKs."
        primary={{ label: "Request access", href: "/#contact-platform" }}
        secondary={{ label: "Security", href: "/platform/security" }}
      />
    </ServiceShell>
  );
}
