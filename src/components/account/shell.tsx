import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, openSession, type SessionUser } from "@/lib/oauth";

/**
 * The signed-in area's shell — the quiet counterpart to the marketing page.
 * No scroll theatre in here: a thin bar, the section tabs, and the page. The
 * three pages share it the way the two legal pages share theirs.
 *
 * The session is read on the server, before anything renders: these pages
 * are about an account, and without one there is nothing to show — the
 * redirect home is the honest 'you are not signed in', and the Login button
 * is right there.
 */

export async function requireSession(): Promise<SessionUser> {
  const jar = await cookies();
  const user = openSession(jar.get(SESSION_COOKIE)?.value);
  if (!user) redirect("/");
  return user;
}

const TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
] as const;

export function AccountShell({
  active,
  title,
  user,
  children,
}: {
  active: (typeof TABS)[number]["href"];
  title: string;
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <main
      data-theme="ink"
      className="min-h-screen bg-theme px-6 pt-10 pb-24 text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex items-baseline justify-between gap-6">
          <Link
            href="/"
            data-cursor="link"
            className="type-headline inline-flex items-baseline text-[1.1rem] tracking-[0.06em] text-(--fg)"
          >
            Pixely
            <span
              aria-hidden
              className="inline-block bg-accent"
              style={{ width: "0.17em", height: "0.17em", marginLeft: "0.12em" }}
            />
          </Link>
          <p className="type-label truncate text-(--faint)">
            {user.email ?? user.name}
          </p>
        </div>

        <nav aria-label="Account" className="mt-10 border-b border-(--line)">
          <ul className="flex gap-7">
            {TABS.map((tab) => {
              const on = tab.href === active;
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={on ? "page" : undefined}
                    data-cursor="link"
                    className={`type-label relative block pb-3 transition-colors duration-200 ${
                      on
                        ? "text-(--fg)"
                        : "text-(--muted) hover:text-accent"
                    }`}
                  >
                    {tab.label}
                    {/* The travelling dot's stationary cousin: the brand's
                        square marking the section you are in. */}
                    {on && (
                      <span
                        aria-hidden
                        className="absolute -bottom-px left-0 h-[2px] w-full bg-accent"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <h1 className="type-headline mt-10 text-[clamp(1.6rem,4vw,2.2rem)]">
          {title}
        </h1>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

/** An honest empty state: a panel that says what will live in it and does
 *  not fake what will not. The rule against invented figures holds hardest
 *  here, where a number would read as an account balance. */
export function EmptyPanel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-(--radius-panel) border border-(--line) bg-(--surface) p-6">
      <h2 className="type-label text-(--faint)">{label}</h2>
      <p className="mt-3 max-w-[52ch] text-[0.9rem] leading-relaxed text-(--muted)">
        {children}
      </p>
    </section>
  );
}
