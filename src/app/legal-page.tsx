import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The shell the two legal routes share.
 *
 * Deliberately not a draft of the document. Terms and a privacy notice for a
 * licensed electronic money institution are drafted by counsel and reviewed
 * by a regulator; a plausible-looking approximation of one would be worse
 * than an empty page, because a reader cannot tell the difference and would
 * be right to assume it binds someone. So the page says exactly where the
 * document is and how to ask for it.
 */
export default function LegalPage({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main
      data-theme="ink"
      className="min-h-screen bg-theme px-6 pt-32 pb-24 text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          data-cursor="link"
          className="type-label text-(--muted) transition-colors duration-300 hover:text-accent"
        >
          ← Pixely
        </Link>
        <p className="type-label section-index mt-10 text-(--muted)">{index}</p>
        <h1 className="type-headline mt-5 text-[clamp(2rem,6vw,3.2rem)]">
          {title}
        </h1>
        <div className="mt-8 space-y-5 leading-relaxed text-(--muted)">
          {children}
        </div>
        <p className="type-label mt-12 border-t border-(--line) pt-7 text-(--faint)">
          Pixely Financial Technologies Ltd.
        </p>
      </div>
    </main>
  );
}
