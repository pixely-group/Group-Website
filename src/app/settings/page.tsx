import type { Metadata } from "next";

import { AccountShell, EmptyPanel, requireSession } from "@/components/account/shell";
import SignOutButton from "@/components/account/SignOutButton";

export const metadata: Metadata = { title: "Pixely — Settings" };

export default async function Settings() {
  const user = await requireSession();
  return (
    <AccountShell active="/settings" title="Settings" user={user}>
      <div className="flex flex-col gap-4">
        <section className="rounded-(--radius-panel) border border-(--line) bg-(--surface) p-6">
          <h2 className="type-label text-(--faint)">Session</h2>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[0.9rem] leading-relaxed text-(--muted)">
              Signed in via{" "}
              <span className="text-(--fg) capitalize">{user.provider}</span>{" "}
              on this browser. Signing out clears it here and nowhere else.
            </p>
            <SignOutButton />
          </div>
        </section>
        <EmptyPanel label="Notifications">
          What Pixely may email you about, and what it may not. Arrives with
          the first thing worth notifying you of.
        </EmptyPanel>
        <EmptyPanel label="Security">
          Passkeys, sessions on other devices, and the audit trail of this
          account. Built alongside real accounts, where they mean something.
        </EmptyPanel>
      </div>
    </AccountShell>
  );
}
