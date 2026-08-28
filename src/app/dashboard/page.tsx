import type { Metadata } from "next";

import { AccountShell, EmptyPanel, requireSession } from "@/components/account/shell";

export const metadata: Metadata = { title: "Pixely — Dashboard" };

export default async function Dashboard() {
  const user = await requireSession();
  const first = user.name?.split(" ")[0] ?? "there";
  return (
    <AccountShell active="/dashboard" title={`Good to see you, ${first}.`} user={user}>
      <div className="grid gap-4 sm:grid-cols-2">
        <EmptyPanel label="Ledger">
          Accounts and balances will live here once the platform connects.
          Nothing is shown because nothing exists yet — this page will never
          dress an empty ledger with invented numbers.
        </EmptyPanel>
        <EmptyPanel label="Activity">
          Payments, transfers and verifications will stream in here, most
          recent first, the moment there is a first.
        </EmptyPanel>
        <EmptyPanel label="Sandbox">
          API keys and simulated rails arrive with the developer sandbox. If
          you need credentials sooner, the contact chapter on the front page
          reaches an engineer directly.
        </EmptyPanel>
        <EmptyPanel label="Identity">
          eKYC status and verification level will report here once the
          identity rail is switched on for your account.
        </EmptyPanel>
      </div>
    </AccountShell>
  );
}
