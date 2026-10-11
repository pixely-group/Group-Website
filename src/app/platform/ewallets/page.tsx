import type { Metadata } from "next";

import { ProductCTA, ProductHero } from "@/components/product/ProductChrome";
import WalletStage from "@/components/product/WalletStage";
import {
  FeatureGrid,
  FlowSteps,
  ServiceBand,
  ServiceShell,
} from "@/components/service/ServicePage";
import HairlineFigure from "@/components/ui/HairlineFigure";

export const metadata: Metadata = {
  title: "Pixely — eWallets",
  description:
    "Secure digital wallets for individuals, businesses and institutions — opened on a proved identity, held on one ledger, and controlled from the hand that holds them.",
};

/**
 * eWallets, in the Identity page's rhythm: the statement, who holds one,
 * the wallet itself in the hand, how one is opened and used, what keeps it
 * safe, the invitation.
 *
 * The wallet on the stage is the front page's own — the same app, live —
 * so the page shows the thing rather than describing a picture of it. The
 * standing rule holds: no limits, fees, counts or e-money status; the copy
 * says what the wallets are built to do.
 */
export default function EWalletsPage() {
  return (
    <ServiceShell>
      <ProductHero
        eyebrow="Platform — eWallets"
        title="A wallet for"
        serif="everyone"
        lede="Secure digital wallets for individuals, businesses and
          institutions: opened on an identity proved once, held on the same
          ledger that moves the payment, and controlled from the hand that
          holds it."
        figure={<HairlineFigure file="ewallets.js" name="wallet" />}
        topic="platform"
      />

      <ServiceBand
        index="01 — Three kinds of holder"
        title="One wallet, built three ways."
        lede="A person paying for groceries, a business paying its staff and
          an institution paying out to thousands need different things from a
          wallet. They get them from the same platform, on the same rails."
        ground="ink"
      >
        <FeatureGrid
          items={[
            {
              label: "Individuals",
              body: "Receive a salary, pay in a shop, send to family — a balance in the pocket and a record of every movement, without a branch visit to open it.",
            },
            {
              label: "Businesses",
              body: "Separate wallets for operating, payroll and savings, with the roles and approvals the business already works by, and collections landing as they settle.",
            },
            {
              label: "Institutions",
              body: "Wallets issued at scale under your own name — for members, beneficiaries or customers — with disbursement by rule and a record you can audit.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="02 — In the hand"
        title="Everything the money does, on one screen."
        lede="This is the wallet the platform is built to put in people's
          hands, and it is live — open a transaction, switch between wallets,
          freeze the card."
        ground="bone"
      >
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div data-fade>
            <WalletStage />
          </div>
          <FeatureGrid
            cols={2}
            items={[
              {
                label: "Several wallets, one holder",
                body: "Primary, business and savings side by side, each with its own balance and its own history, moved between in a tap.",
              },
              {
                label: "Send and receive",
                body: "To a contact or an account, settled as it happens. Requests and incoming payments arrive with the same confirmation the sender sees.",
              },
              {
                label: "A card in the wallet",
                body: "Pay contactless or online from the wallet's balance, with the card's controls — freeze, spending limits, contactless — in the holder's own hands.",
              },
              {
                label: "Every movement, legible",
                body: "Sent, received, pending or refused, each with who it was, what for and when — and a refusal says why rather than simply failing.",
              },
            ]}
          />
        </div>
      </ServiceBand>

      <ServiceBand
        index="03 — How it runs"
        title="From a phone to a balance."
        lede="Four movements, and the first is the one most wallets skip:
          the holder is proved before the wallet exists, so everything after
          can trust it."
        ground="ink"
      >
        <FlowSteps
          steps={[
            {
              title: "Prove",
              body: "The holder is verified by the platform's identity layer — document, chip and face for a person, registry and owners for a business.",
            },
            {
              title: "Open",
              body: "The wallet is opened on the ledger against that proof, with the limits and permissions the holder's profile allows.",
            },
            {
              title: "Fund",
              body: "Money arrives by transfer, salary, collection or another wallet, and is available the moment it settles.",
            },
            {
              title: "Spend",
              body: "Pay, send or withdraw, every movement screened in its path and written to the same record the holder reads.",
            },
          ]}
        />
      </ServiceBand>

      <ServiceBand
        index="04 — Secure by construction"
        title="Safe is not a setting."
        lede="The protections are not features a holder turns on. They are
          how the wallet is built, underneath every balance on the platform."
        ground="bone"
      >
        <FeatureGrid
          items={[
            {
              label: "Bound to the device",
              body: "A wallet answers to the handset it was opened on. A new device has to prove the holder again before it can move anything.",
            },
            {
              label: "Limits and velocity",
              body: "Per-payment and per-period limits, and the pattern of payments itself, checked before anything moves rather than after.",
            },
            {
              label: "Fraud in the path",
              body: "Every payment is scored by the platform's fraud detection on its way out, while there is still time to hold it.",
            },
            {
              label: "Tokenised credentials",
              body: "Card numbers and secrets are kept in a vault and replaced by tokens everywhere else, so the app never holds what it does not need.",
            },
            {
              label: "An append-only ledger",
              body: "Every balance is the sum of entries nobody can edit — hash-linked and kept under dual control, so the history is the history.",
            },
            {
              label: "Data kept in Algeria",
              body: "A holder's personal data stays under Algerian law, and leaves the country only with the national authority's authorisation.",
            },
          ]}
        />
      </ServiceBand>

      <ProductCTA
        index="05 — Get started"
        titleLines={["Open the", "first wallet"]}
        lede="Create an account and open wallets in the sandbox, or talk to
          an engineer about issuing them to your own customers."
        topic="platform"
      />
    </ServiceShell>
  );
}
