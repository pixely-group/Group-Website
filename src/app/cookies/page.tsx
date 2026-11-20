import type { Metadata } from "next";

import LegalPage, {
  Bullets,
  Code,
  DocRef,
  Facts,
  Mail,
  type LegalSection,
} from "../legal-page";

export const metadata: Metadata = {
  title: "Pixely — Cookies",
  description:
    "Every cookie the Pixely website sets, what each is for and how long it lasts. All of them are strictly necessary; there are no analytics or advertising cookies.",
};

/** The exhaustive list. If a cookie is added to the code, it is added here
 *  first, and if it is not strictly necessary, the site asks before setting
 *  it (see "Why there is no banner"). */
const COOKIES: {
  names: string[];
  purpose: string;
  lifetime: string;
  set: string;
}[] = [
  {
    names: ["pixely_session"],
    purpose:
      "Keeps you signed in. It holds the details your sign-in provider shared, signed so they cannot be altered, and is HttpOnly, so scripts on the page cannot read it.",
    lifetime: "7 days, or until you sign out.",
    set: "Only after you sign in.",
  },
  {
    names: ["oauth_state_google", "oauth_state_apple"],
    purpose:
      "Protects sign-in against cross-site request forgery: it proves that the answer coming back from Google or Apple belongs to the sign-in you started.",
    lifetime: "10 minutes, and deleted as soon as it has been used.",
    set: "When you start signing in.",
  },
  {
    names: ["oauth_nonce_google", "oauth_nonce_apple"],
    purpose:
      "Protects sign-in against replay: a single-use value that stops a captured sign-in from being used twice.",
    lifetime: "10 minutes, and deleted as soon as it has been used.",
    set: "When you start signing in.",
  },
  {
    names: ["oauth_pkce_google"],
    purpose:
      "Holds the PKCE verifier, a one-time secret that ties the sign-in code Google returns to this browser, so an intercepted code is useless.",
    lifetime: "10 minutes, and deleted as soon as it has been used.",
    set: "When you start signing in with Google.",
  },
];

const sections: LegalSection[] = [
  {
    id: "what-cookies-are",
    title: "What cookies are",
    body: (
      <p>
        A cookie is a small file a website asks your browser to keep, and to
        send back on later visits. Some are needed for a website to work at
        all; others are used to measure or follow what people do. This website
        uses only the first kind.
      </p>
    ),
  },
  {
    id: "our-cookies",
    title: "The cookies we use",
    body: (
      <>
        <p>
          This is the complete list. Every one is set by this website itself
          (first-party), every one is strictly necessary, and none is set
          unless you start to sign in.
        </p>
        {COOKIES.map((c) => (
          <Facts
            key={c.names[0]}
            caption={
              <span className="flex flex-wrap gap-x-3">
                {c.names.map((n, i) => (
                  <span key={n}>
                    <Code>{n}</Code>
                    {i < c.names.length - 1 ? (
                      <span className="text-(--faint)"> /</span>
                    ) : null}
                  </span>
                ))}
              </span>
            }
            items={[
              ["Purpose", c.purpose],
              ["Lifetime", c.lifetime],
              ["Set", c.set],
              ["Category", "Strictly necessary · first-party"],
            ]}
          />
        ))}
      </>
    ),
  },
  {
    id: "what-we-do-not-use",
    title: "What we do not use",
    body: (
      <>
        <Bullets
          items={[
            "No analytics, advertising or tracking cookies.",
            "No third-party cookies.",
            "No localStorage or sessionStorage.",
            "No embedded third-party scripts, and no requests to Google Fonts: our fonts are served from our own website.",
          ]}
        />
        <p>
          When you choose to sign in, you briefly visit Google’s or Apple’s own
          sign-in page. Those sites set their own cookies, under their own
          policies, which are described in our{" "}
          <DocRef href="/privacy#sharing">privacy notice</DocRef>.
        </p>
      </>
    ),
  },
  {
    id: "no-banner",
    title: "Why there is no cookie banner",
    body: (
      <>
        <p>
          The law asks for your consent before a website stores anything on
          your device, except what is strictly necessary to provide a service
          you have asked for. In Algeria, Law 18-07 does not require consent
          for processing that is necessary to provide the service you request.
          The EU rules work the same way.
        </p>
        <p>
          Every cookie above falls within that exemption, so there is nothing
          to ask, and we do not show a banner asking anyway.
        </p>
        <p>
          <strong>
            If we ever want to add a cookie that is not strictly necessary,
            we will ask for your consent before setting it
          </strong>
          , and update this policy first.
        </p>
      </>
    ),
  },
  {
    id: "control",
    title: "Controlling cookies",
    body: (
      <>
        <p>
          Your browser lets you see, delete and block cookies, for all websites
          or for this one. The settings are usually under Privacy or Security
          in its preferences, and its help pages explain them.
        </p>
        <Bullets
          items={[
            "Everything on the website except signing in works without cookies.",
            "If you block cookies for this website, you will not be able to sign in.",
            <>
              Deleting <Code>pixely_session</Code> signs you out.
            </>,
          ]}
        />
      </>
    ),
  },
  {
    id: "changes-contact",
    title: "Changes and contact",
    body: (
      <>
        <p>
          When this policy changes, the new version is published here with a
          new date at the top, and material changes are flagged on the website.
        </p>
        <p>
          Questions about cookies: <Mail />. The{" "}
          <DocRef href="/privacy">privacy notice</DocRef> explains everything
          else we do with personal data, and the{" "}
          <DocRef href="/terms">terms of use</DocRef> govern the website.
        </p>
      </>
    ),
  },
];

export default function Cookies() {
  return (
    <LegalPage
      doc="cookies"
      title="Cookie policy"
      lede={
        <p>
          Six cookies, all strictly necessary, all set by this website, and
          only when you sign in. No analytics, no advertising, nothing that
          follows you.
        </p>
      }
      sections={sections}
    />
  );
}
