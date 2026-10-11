/** A document link that opens in a new tab and says so: muted, underlined,
 *  with a small arrow the reader sees before they click and a phrase a
 *  screen reader hears. The sign-up dialog's terms and privacy links, and the
 *  laws under the globe, are this one component, so they are one link.
 *
 *  In the dialog it opens in a new tab on purpose: the reader is mid-sign-up
 *  with a half-typed form, and a same-tab navigation throws that away to show
 *  them boilerplate. Under the globe it is the same courtesy: the law is a
 *  government PDF, and the page they were reading is still there to come back
 *  to. */
export default function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      data-cursor="link"
      className="inline-flex items-baseline gap-[0.35em] text-(--muted) underline decoration-1 underline-offset-4 transition-colors duration-200 hover:text-accent"
    >
      {children}
      <svg
        width="7"
        height="7"
        viewBox="0 0 8 8"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M1.5 6.5 6.5 1.5M2.5 1.5h4v4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
