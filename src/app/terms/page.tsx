import type { Metadata } from "next";

import DocLink from "@/components/ui/DocLink";
import { OFFICES, OPERATOR } from "@/lib/company";
import LegalPage, {
  Bullets,
  DocRef,
  Facts,
  Mail,
  type LegalSection,
} from "../legal-page";

export const metadata: Metadata = {
  title: "Pixely — Terms",
  description:
    "The terms on which you may use the Pixely website: an information site about the platform Pixely is building.",
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          This website is operated by <strong>{OPERATOR.entity}</strong>, a
          company registered in Algeria, {OPERATOR.registration.label}{" "}
          {OPERATOR.registration.value}, at {OPERATOR.address.join(", ")}.
        </p>
        <p>
          In these terms, “Pixely”, “we” and “us” mean {OPERATOR.entity}. By
          using the website you accept these terms. If you do not accept them,
          please do not use it.
        </p>
      </>
    ),
  },
  {
    id: "information-only",
    title: "The website is for information",
    body: (
      <>
        <p>
          The website describes the platform Pixely is building: payments,
          eWallets, identity verification, AI services, compliance tooling and
          the APIs that connect them. It is information about work in
          progress, and nothing more.
        </p>
        <Bullets
          items={[
            "No financial, payment, account or investment service is provided through the website.",
            "Nothing on it is financial, investment, legal or tax advice, and nothing on it is an offer, an invitation or a solicitation to enter into any financial service.",
            "Pixely is not a bank and is not an authorised electronic money institution. A description of a feature is not a statement that it is available, or that any authority has approved it.",
          ]}
        />
        <p>
          If a Pixely service is offered in the future, it will be offered on
          its own terms, and only where the law allows it to be.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and sign-in",
    body: (
      <>
        <p>
          You can sign in with a Google or Apple account. Signing in uses that
          provider’s service, under its own terms, and gives us the details
          described in the <DocRef href="/privacy">privacy notice</DocRef>.
        </p>
        <p>
          An account today is a place held for you, not a product. The account
          area shows empty panels, and signing in does not open any financial
          account or give you access to any service.
        </p>
        <p>
          You are responsible for the Google or Apple account you sign in with,
          and for the device you use. We may end a session, or suspend or
          withdraw sign-in, at any time, including to protect the website or
          its users.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You may use the website for lawful purposes only. You must not:</p>
        <Bullets
          items={[
            "use it in a way that breaks any law or regulation, or in connection with fraud;",
            "try to gain unauthorised access to the website, its servers or any account, or to get around its security or its limits on use;",
            "introduce malware, or anything else designed to damage or disrupt it;",
            "send automated traffic that places an unreasonable load on it, or scrape it in bulk;",
            "send messages through the contact form that are unsolicited, abusive or misleading, or that impersonate someone else.",
          ]}
        />
        <p>
          If you do, we may block your access, and we may report it to the
          relevant authorities.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <>
        <p>
          The website and what is on it (its text, design, illustrations,
          code, and the Pixely name and marks) belong to Pixely or to those
          who license them to us, and are protected by intellectual property
          law.
        </p>
        <p>
          You may view the website, and print or save a page for your own
          reference. Anything beyond that, including copying, adapting or
          republishing its content, or using the Pixely name or marks, needs
          our written permission.
        </p>
      </>
    ),
  },
  {
    id: "links",
    title: "Links to other websites",
    body: (
      <>
        <p>
          The website links to sites we do not control, among them the Journal
          Officiel de la République Algérienne (joradp.dz), the national
          authority for the protection of personal data (anpdp.dz), and Google
          and Apple for sign-in. Those sites have their own terms and privacy policies, and
          we are not responsible for their content or availability.
        </p>
        <p>
          Our references to laws and regulations published in the Journal
          Officiel describe the legal framework Pixely works within. They are
          not a licence, an authorisation or a certification, and they do not
          mean that any authority has approved Pixely or its services.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <>
        <p>
          We take care over what the website says, but it is provided as it
          is. It describes a platform still being built, so features, plans
          and timings may change, and some of what it describes may never be
          offered. We do not promise that the content is complete, accurate
          or current, or that the website will always be available or free of
          errors.
        </p>
        <p>
          Do not rely on anything on the website when making a financial,
          legal or business decision. Take your own advice.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <p>
          The website is free to use and is provided for information. To the
          extent the law allows, we are not liable for any loss arising from
          your use of it, or from reliance on anything on it.
        </p>
        <p>
          If you use the website for business purposes, we are not liable for
          loss of profit, revenue, business, opportunity or data, or for any
          indirect or consequential loss. If you are a consumer, we are not
          liable for loss that was not reasonably foreseeable when you used the
          website, or for any business loss.
        </p>
        <p>
          <strong>Nothing in these terms excludes or limits liability</strong>{" "}
          for death or personal injury caused by negligence, for fraud or
          fraudulent misrepresentation, or for anything else that cannot be
          excluded or limited by law, including your statutory rights as a
          consumer.
        </p>
      </>
    ),
  },
  {
    id: "privacy-cookies",
    title: "Privacy and cookies",
    body: (
      <p>
        How we handle personal data is set out in the{" "}
        <DocRef href="/privacy">privacy notice</DocRef>, and the cookies the
        website sets, all of them strictly necessary, in the{" "}
        <DocRef href="/cookies">cookie policy</DocRef>.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. When we do, we publish the new version here
        with a new date at the top, and if a change is material we flag it on
        the website. The version in force when you use the website is the one
        that applies.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: (
      <>
        <p>
          These terms are governed by Algerian law, and the courts of Algiers
          have jurisdiction over any dispute about them or the website.
        </p>
        <p>
          This is without prejudice to the mandatory protections given to
          consumers by the law of the country where they live. If you are a
          consumer, you keep those protections, and you may also bring
          proceedings in the courts of your own country where its law gives
          you that right.
        </p>
        <p>
          If any part of these terms is found unenforceable, the rest stays in
          force. If we do not enforce a term straight away, we can still
          enforce it later.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>
          Questions about these terms: <Mail />, or by post:
        </p>
        <Facts
          items={OFFICES.map(
            (o): [string, string] => [o.city, `${o.entity}, ${o.address.join(", ")}`],
          )}
        />
      </>
    ),
  },
];

export default function Terms() {
  return (
    <LegalPage
      doc="terms"
      title="Terms of use"
      lede={
        <p>
          The terms on which you may use this website. It tells you about the
          platform we are building; it does not provide a financial service,
          and nothing on it is advice or an offer.
        </p>
      }
      sections={sections}
    />
  );
}
