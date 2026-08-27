import type { Metadata } from "next";
import LegalPage from "../legal-page";

export const metadata: Metadata = { title: "Pixely — Terms" };

export default function Terms() {
  return (
    <LegalPage index="Legal — Terms" title="Terms of service">
      <p>
        The terms governing Pixely accounts are not published here yet. They
        are being prepared with counsel and reviewed against the requirements
        that apply to an authorised electronic money institution.
      </p>
      <p>
        Until they are published, no account can be opened on this site, and
        the sign-up form is not connected to anything. If you need the current
        draft or the terms attached to an existing arrangement, ask us and we
        will send them.
      </p>
    </LegalPage>
  );
}
