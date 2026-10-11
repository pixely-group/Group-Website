import type { Metadata } from "next";

import DocLink from "@/components/ui/DocLink";
import { OFFICES, OPERATOR } from "@/lib/company";
import LegalPage, {
  Bullets,
  Code,
  DocRef,
  EXTERNAL,
  Facts,
  Mail,
  Sub,
  type LegalSection,
} from "../legal-page";

export const metadata: Metadata = {
  title: "Pixely — Privacy",
  description:
    "What the Pixely website collects, why, who it is shared with, how long it is kept, and the rights you have over it.",
};

const ALGIERS = OFFICES.find((o) => o.entity !== OPERATOR.entity)!;

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          This website is operated by <strong>{OPERATOR.entity}</strong>, a
          private limited company registered in England and Wales (
          {OPERATOR.registration.label.toLowerCase()}{" "}
          {OPERATOR.registration.value}), whose registered office is at{" "}
          {OPERATOR.address.join(", ")}. It is the controller of the personal
          data processed through the website.
        </p>
        <p>
          Its group company in Algeria, <strong>{ALGIERS.entity}</strong> (
          {ALGIERS.registration.label} {ALGIERS.registration.value}),{" "}
          {ALGIERS.address.join(", ")}, handles enquiries that come from
          Algeria or concern our work there. For those enquiries the two
          companies decide together how your data is used, and act as joint
          controllers. You can raise any question or request with either of
          them; it will reach the right one.
        </p>
        <p>
          In this notice, “Pixely”, “we” and “us” mean those two companies.
          It covers the website only. The platform we are building is not
          live, and when a Pixely product is, it will come with its own
          notice.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect, and why",
    body: (
      <>
        <p>
          The website collects very little, and keeps less. There are four
          moments when it handles personal data. Each is set out below with
          what is collected, what it is for and the lawful basis we rely on.
        </p>

        <Sub>Signing in with Google or Apple</Sub>
        <p>
          You can sign in with a Google or Apple account. The provider asks
          your permission, then tells us who you are; we never see your
          password.
        </p>
        <Facts
          items={[
            [
              "What we receive",
              "The provider’s name, the identifier it gives your account (its “sub”), your email address, and your name if the provider shares it.",
            ],
            [
              "Where it is kept",
              <>
                In a signed session cookie, <Code>pixely_session</Code>, on
                your own device. We keep no account database.
              </>,
            ],
            ["Purpose", "To sign you in and keep you signed in."],
            [
              "Lawful basis",
              "UK and EU GDPR: necessary to provide the sign-in you ask for (contract). Law 18-07: your consent, given when you choose to sign in, and the performance of the service you request.",
            ],
          ]}
        />
        <p>
          Today the account area shows empty panels: no product is live, so
          nothing else is attached to your account.
        </p>

        <Sub>Checking an email address</Sub>
        <p>
          While you type an email address to sign up, our server looks up the
          public DNS records (MX, A and AAAA) of its domain to check that it
          can receive mail, so a mistyped address is caught before it is used.
        </p>
        <Facts
          items={[
            ["What we use", "The address you type, for the moment of the check."],
            [
              "What is kept",
              "Nothing about you. The address is not stored. The answer for the domain itself may be remembered for up to an hour, so it is not looked up twice.",
            ],
            [
              "Lawful basis",
              "UK and EU GDPR: our legitimate interest in catching mistyped addresses. Law 18-07: necessary for the sign-up you have started.",
            ],
          ]}
        />

        <Sub>Writing to us through the contact form</Sub>
        <Facts
          items={[
            [
              "What we receive",
              "Your name, work email, company (if you give it), country, the topic you choose and your message.",
            ],
            [
              "How it reaches us",
              "The message is emailed to our inbox through Brevo, our transactional email provider, with your address set as the reply-to. You receive a confirmation email.",
            ],
            [
              "Where it is kept",
              "In our inbox. The website itself does not store messages in a database.",
            ],
            ["Purpose", "To read and answer your enquiry, and follow it up."],
            [
              "Lawful basis",
              "UK and EU GDPR: our legitimate interest in answering the people who write to us, or steps you ask us to take before entering into a contract. Law 18-07: your consent, given when you send the message.",
            ],
          ]}
        />

        <Sub>Keeping the website safe from abuse</Sub>
        <Facts
          items={[
            [
              "What we use",
              "Your IP address, and a one-way hash of the email address you enter.",
            ],
            [
              "How",
              "Short-lived counters held in the server’s memory, so no one can flood the contact form. They reset within minutes and are never written to storage.",
            ],
            [
              "Lawful basis",
              "UK and EU GDPR: our legitimate interest in keeping the website secure and available. Law 18-07: necessary for that same purpose.",
            ],
          ]}
        />

        <Sub>What we do not collect</Sub>
        <Bullets
          items={[
            "No analytics, advertising or tracking of any kind.",
            "No third-party scripts embedded in the pages. Our fonts are served from our own website, so loading a page sends nothing to Google Fonts.",
            "No payment, bank or identity-document data. No financial service is provided through this website.",
            "No decisions about you are made by automated means that have legal or similarly significant effects.",
          ]}
        />
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We do not sell personal data. We share it only as follows.</p>
        <Facts
          items={[
            [
              "Brevo",
              "Sendinblue SAS, France. Our transactional email provider: it delivers contact-form messages and confirmations on our behalf, as our processor.",
            ],
            [
              "Google and Apple",
              <>
                If you choose to sign in with one of them, you deal with that
                provider directly and under its own policy (
                <DocLink href={EXTERNAL.googlePrivacy}>Google</DocLink>,{" "}
                <DocLink href={EXTERNAL.applePrivacy}>Apple</DocLink>). It
                decides for itself what it does with your use of its sign-in.
              </>,
            ],
            [
              "Our group",
              `${OPERATOR.entity} and ${ALGIERS.entity} share an enquiry between them when it concerns both.`,
            ],
            [
              "Authorities",
              "Where the law requires us to, or to establish, exercise or defend legal claims.",
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: (
      <>
        <p>
          Pixely works across two countries, so personal data can cross
          borders. Plainly, this is how:
        </p>
        <Bullets
          items={[
            <>
              The website is operated from the United Kingdom by{" "}
              {OPERATOR.entity}. If you use it from Algeria or elsewhere, what
              you send it goes to the UK.
            </>,
            "Contact-form messages pass through Brevo in the European Union (France).",
            "If you sign in with Google or Apple, the provider, which operates from the United States, sends us the details listed above.",
            <>
              An enquiry concerning Algeria may be shared between{" "}
              {OPERATOR.entity} and {ALGIERS.entity}.
            </>,
          ]}
        />
        <p>
          For each transfer we apply the safeguards the law that governs it
          requires. Transfers from the UK rely on UK adequacy regulations or
          the contractual safeguards UK law approves. For personal data
          collected in Algeria, article 44 of Law 18-07 makes a transfer
          abroad subject to the authorisation of the national authority, the
          ANPDP, and we apply its conditions to those transfers.
        </p>
        <p>
          You can ask us for more detail on the safeguards for any transfer
          at <Mail />.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <Facts
        items={[
          [
            "Session cookie",
            "Seven days, or until you sign out, whichever comes first.",
          ],
          [
            "Sign-in cookies",
            <>
              Ten minutes at most, and deleted as soon as sign-in completes.
              See the <DocRef href="/cookies">cookie policy</DocRef>.
            </>,
          ],
          [
            "Contact messages",
            "As long as we need to deal with your enquiry and any follow-up, then deleted. We review what we hold at least every 24 months.",
          ],
          ["Email check", "Nothing is kept."],
          ["Abuse counters", "Minutes, in memory only."],
        ]}
      />
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <>
        <p>
          The surest protection is not to hold data at all, and the website is
          built that way: no account database, no stored messages, no
          analytics.
        </p>
        <p>
          What does exist is protected. The session cookie is signed, so it
          cannot be altered without detection, and HttpOnly, so scripts on the
          page cannot read it. Sign-in is guarded against forged and replayed
          requests by single-use state, nonce and PKCE checks. Rate limits
          stand in front of the contact form.
        </p>
        <p>
          No system is perfectly secure. If a breach affects your personal
          data, we will tell you and the relevant authority as the law
          requires.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on the law that applies to you (UK GDPR and the Data
          Protection Act 2018, the EU GDPR if you are in the European Union,
          or Algeria’s{" "}
          <DocLink href={EXTERNAL.law1807}>Law 18-07 of 10 June 2018</DocLink>{" "}
          on the protection of personal data, as amended by{" "}
          <DocLink href={EXTERNAL.law2511}>Law 25-11 of 24 July 2025</DocLink>
          ), you have the right to:
        </p>
        <Facts
          items={[
            ["Be informed", "Know what we do with your data. This notice is that."],
            ["Access", "Have a copy of the personal data we hold about you."],
            ["Rectification", "Have inaccurate or incomplete data corrected."],
            ["Erasure", "Have your data deleted where there is no good reason for us to keep it."],
            ["Restriction", "Ask us to pause using your data while a question about it is settled."],
            [
              "Objection",
              "Object to our use of your data where we rely on our legitimate interests, and to any use for direct marketing.",
            ],
            [
              "Portability",
              "Where processing is based on your consent or a contract and carried out by automated means, receive your data in a portable format.",
            ],
            [
              "Withdraw consent",
              "Where we rely on your consent, withdraw it at any time. This does not affect what was done before.",
            ],
            ["Complain", "To a data protection authority. See the next section."],
          ]}
        />
        <p>
          Most of what we hold sits in a cookie on your own device: signing
          out, or clearing the cookie, erases it. For anything else, write to{" "}
          <Mail />. We may ask you to confirm who you are. We answer within
          one month, free of charge, and tell you if the law allows us longer
          for a complex request.
        </p>
      </>
    ),
  },
  {
    id: "complaints",
    title: "Complaints",
    body: (
      <>
        <p>
          We would like the chance to put things right first, so please write
          to <Mail />. You can also complain directly:
        </p>
        <Facts
          items={[
            [
              "United Kingdom",
              <>
                The Information Commissioner’s Office,{" "}
                <DocLink href={EXTERNAL.ico}>ico.org.uk</DocLink>.
              </>,
            ],
            [
              "Algeria",
              <>
                The national authority for the protection of personal data
                (ANPDP), <DocLink href={EXTERNAL.anpdp}>anpdp.dz</DocLink>.
              </>,
            ],
            [
              "European Union",
              "The data protection authority of the country where you live or work, or where you think the problem arose.",
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        The website is not directed at anyone under 18, and we do not knowingly
        collect their data. If you believe a child has given us personal data,
        write to <Mail /> and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this notice",
    body: (
      <p>
        When this notice changes, we publish the new version here with a new
        date at the top. If a change is material, we will flag it on the
        website before it takes effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>
          For anything about your personal data or this notice, write to{" "}
          <Mail />, or by post to either office:
        </p>
        <Facts
          items={OFFICES.map(
            (o): [string, string] => [o.city, `${o.entity}, ${o.address.join(", ")}`],
          )}
        />
        <p>
          The <DocRef href="/terms">terms of use</DocRef> and the{" "}
          <DocRef href="/cookies">cookie policy</DocRef> complete this notice.
        </p>
      </>
    ),
  },
];

export default function Privacy() {
  return (
    <LegalPage
      doc="privacy"
      title="Privacy notice"
      lede={
        <p>
          What this website collects, why, who sees it and for how long — and
          what you can ask of us. It is short, because the website keeps
          almost nothing.
        </p>
      }
      sections={sections}
    />
  );
}
