import { OFFICES } from "@/lib/company";

const MEDIA_EMAIL = "contact@pixely.dz";
const algiers = OFFICES[0];

/**
 * The Press hero's right-hand column: the media contact, set the way About
 * sets its manifesto — a hairline above, the address in the display voice,
 * and the caption underneath naming who answers it.
 */
export default function PressAside() {
  return (
    <figure className="border-t border-(--line) pt-7">
      <p className="type-label text-(--faint)">Media contact</p>
      <a
        href={`mailto:${MEDIA_EMAIL}`}
        data-cursor="link"
        className="type-headline mt-5 block text-[clamp(1.5rem,3.3vw,2.9rem)] leading-none break-all transition-colors duration-200 hover:text-accent sm:break-normal"
      >
        {MEDIA_EMAIL}
      </a>
      <p className="mt-6 max-w-[44ch] text-[0.95rem] leading-relaxed text-(--muted)">
        For interviews, briefings and media enquiries — or choose Press on the
        contact form.
      </p>
      <figcaption className="type-label mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-(--faint)">
        <span className="flex items-center gap-3 whitespace-nowrap">
          <span aria-hidden className="size-[7px] bg-accent" />
          {algiers.entity} · {algiers.city}
        </span>
        {algiers.phone && (
          <a
            href={`tel:${algiers.phone.tel}`}
            data-cursor="link"
            className="whitespace-nowrap transition-colors duration-200 hover:text-accent"
          >
            {algiers.phone.display}
          </a>
        )}
      </figcaption>
    </figure>
  );
}
