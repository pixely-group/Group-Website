import type { Metadata } from "next";
import LegalPage from "../legal-page";

export const metadata: Metadata = { title: "Pixely — Privacy" };

export default function Privacy() {
  return (
    <LegalPage index="Legal — Privacy" title="Privacy notice">
      <p>
        When you join the Pixely waitlist, we collect your email address to
        record your interest, send a confirmation, and contact you when your
        spot is ready.
      </p>
      <p>
        Waitlist email addresses are stored and emails are delivered through
        Brevo. The website uses temporary request counters to limit automated
        submissions. The waitlist does not require an account or ask for
        identity documents.
      </p>
      <p>To ask about your information or request removal from the waitlist,
        contact <a href="mailto:admin@pixely.com">admin@pixely.com</a>.</p>
    </LegalPage>
  );
}
