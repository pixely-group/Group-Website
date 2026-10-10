import type { Metadata } from "next";
import LegalPage from "../legal-page";

export const metadata: Metadata = { title: "Pixely — Privacy" };

export default function Privacy() {
  return (
    <LegalPage index="Legal — Privacy" title="Privacy notice">
      <p>
        The privacy notice is not published here yet. It is being prepared
        with counsel, and it has to say what is collected, on what basis, how
        long it is kept and who it is shared with — none of which is worth
        stating approximately.
      </p>
      <p>
        What this site does today: it holds no accounts and sets no analytics
        or advertising cookies. The sign-up form keeps what you type in your
        own browser and sends none of it. The one thing that does leave your
        browser is the domain of an address you type while creating an
        account, which is looked up to check that it receives mail; the
        address itself is not stored.
      </p>
    </LegalPage>
  );
}
