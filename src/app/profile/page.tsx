import type { Metadata } from "next";

import { AccountShell, requireSession } from "@/components/account/shell";

export const metadata: Metadata = { title: "Pixely — Profile" };

/** The one account page with real data on day one: the identity the session
 *  actually carries, shown as it is known. */
export default async function Profile() {
  const user = await requireSession();
  const rows = [
    { label: "Name", value: user.name ?? "—" },
    { label: "Email", value: user.email ?? "—" },
    { label: "Signed in via", value: user.provider ?? "—" },
  ];
  return (
    <AccountShell active="/profile" title="Profile" user={user}>
      <section className="rounded-(--radius-panel) border border-(--line) bg-(--surface) p-6">
        <dl className="flex flex-col gap-5">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-8">
              <dt className="type-label w-32 shrink-0 text-(--faint)">{row.label}</dt>
              <dd className="truncate text-[0.95rem] text-(--fg) capitalize">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="mt-5 max-w-[56ch] text-[0.85rem] leading-relaxed text-(--muted)">
        This is the identity your sign-in provider vouches for, exactly as it
        arrived. Editing it here comes with accounts — a name changed on this
        page has to have somewhere to be saved.
      </p>
    </AccountShell>
  );
}
