import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pixely — logo lab" };

/**
 * The logo, as it is and as it could be.
 *
 * Everything here is drawn at the sizes the mark actually has to survive —
 * 96 for a deck, 44 for an avatar, 22 for the navigation bar, 16 for a
 * favicon — and on both grounds, because a mark that only works on white is
 * a mark with a background attached to it.
 */

/* ---- what is there today -------------------------------------------- */

function Today({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 312 312" fill="none" aria-label="Current Pixely mark">
      <path d="M296.8 15.2V296.8H15.2V15.2H296.8Z" fill="#384CE3" stroke="white" strokeWidth="25.6" />
      <path
        d="M189.598 111.203V178.399H144.802V200.797H122.403V178.398H144.801V156.001H167.199V133.602H144.801V156.001H122.401V111.203H189.598Z"
        fill="white"
      />
    </svg>
  );
}

/* ---- 1. the meridian ------------------------------------------------- */

/** The mark the site already wears. A sphere on its axis, seen from the
 *  side: one circle, one meridian running past the poles, one ellipse for
 *  the turn. Monoline and currentColor, so it takes the colour of whatever
 *  it is set beside instead of carrying its own. */
function Meridian({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-label="Meridian mark">
      <circle cx="11" cy="11" r="9.25" stroke="currentColor" strokeWidth={1.5} />
      <line x1="11" y1="0.75" x2="11" y2="21.25" stroke="currentColor" strokeWidth={1.5} />
      {/* The turn, at two thirds the weight. It is the first thing to go at
          16px, and it should be: what is left is a circle on an axis, which
          is still the mark. */}
      <ellipse cx="11" cy="11" rx="4.1" ry="9.25" stroke="currentColor" strokeWidth={1} opacity="0.55" />
    </svg>
  );
}

/* ---- 2. the pixel meridian ------------------------------------------- */

/** The same silhouette, quantised. An 11x11 grid, a ring at radius 5, and
 *  the meridian as a filled column — the pixel idea the name carries, in the
 *  shape the business needs. It is the bridge: nothing of the old mark's
 *  language is thrown away, and none of its problems are kept. */
function PixelMeridian({ size = 96 }: { size?: number }) {
  const cells: [number, number][] = [];
  for (let i = 0; i < 11; i++) {
    for (let j = 0; j < 11; j++) {
      const d = Math.hypot(i - 5, j - 5);
      if ((d >= 4.4 && d <= 5.4) || i === 5) cells.push([i, j]);
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-label="Pixel meridian mark">
      {cells.map(([i, j]) => (
        <rect key={`${i}-${j}`} x={i * 2} y={j * 2} width="2" height="2" fill="currentColor" />
      ))}
    </svg>
  );
}

/* ---- 3. the square, kept and fixed ----------------------------------- */

/** For if the container is not negotiable. The white keyline goes, the
 *  corners soften, the blue becomes the one the rest of the brand uses, and
 *  the thing inside is a mark rather than four pixels of staircase. */
function Contained({ size = 96, radius = 0.22 }: { size?: number; radius?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-label="Contained mark">
      <rect width="22" height="22" rx={22 * radius} fill="#2d46ff" />
      <g transform="translate(4.4 4.4) scale(0.6)">
        <circle cx="11" cy="11" r="9.25" stroke="#ece9e1" strokeWidth={2.2} />
        <line x1="11" y1="0.75" x2="11" y2="21.25" stroke="#ece9e1" strokeWidth={2.2} />
        <ellipse cx="11" cy="11" rx="4.1" ry="9.25" stroke="#ece9e1" strokeWidth={1.5} opacity="0.55" />
      </g>
    </svg>
  );
}

/* ---- the lockup ------------------------------------------------------ */

function Lockup({
  mark,
  size = 34,
  gap = 0.42,
}: {
  mark: React.ReactNode;
  size?: number;
  gap?: number;
}) {
  return (
    <span className="flex items-center" style={{ gap: size * gap }}>
      {mark}
      <span
        className="type-headline"
        style={{ fontSize: size * 0.62, letterSpacing: "0.06em", lineHeight: 1 }}
      >
        Pixely
      </span>
    </span>
  );
}

/* ---- the page -------------------------------------------------------- */

const SIZES = [96, 44, 22, 16];

function Bench({
  title,
  note,
  render,
  fixed,
}: {
  title: string;
  note: string;
  render: (size: number) => React.ReactNode;
  fixed?: boolean;
}) {
  return (
    <section className="border-t border-(--line) pt-8">
      <h2 className="type-headline text-[1.15rem]">{title}</h2>
      <p className="mt-2 max-w-[52ch] text-[0.9rem] leading-relaxed text-(--muted)">{note}</p>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        {(["ink", "bone"] as const).map((ground) => (
          <div
            key={ground}
            data-theme={ground}
            className="flex min-h-[172px] flex-wrap items-end gap-7 rounded-2xl bg-theme p-7 text-theme"
          >
            {SIZES.map((s) => (
              <span key={s} className="flex flex-col items-center gap-2">
                {render(s)}
                <span className="type-label text-[0.55rem] text-(--faint)">{s}</span>
              </span>
            ))}
            {!fixed && (
              <span className="flex flex-col gap-2">
                <Lockup mark={render(26)} />
                <span className="type-label text-[0.55rem] text-(--faint)">lockup</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LogoLab() {
  return (
    <main data-theme="bone" className="min-h-screen bg-theme px-6 py-16 text-theme sm:px-10 lg:px-14">
      <div className="mx-auto flex max-w-5xl flex-col gap-14">
        <header>
          <p className="type-label section-index text-(--muted)">Branding — the mark</p>
          <h1 className="type-headline mt-5 text-[2.4rem] leading-[1.05] tracking-[-0.02em]">
            Four ways to wear the name.
          </h1>
          <p className="mt-5 max-w-[58ch] text-[0.95rem] leading-relaxed text-(--muted)">
            Every mark below is drawn at the sizes it actually has to survive, on both
            grounds. A mark that only works on white is a mark with a background
            attached to it.
          </p>
        </header>

        <Bench
          title="Today"
          fixed
          note="A blue square with a white keyline and a staircase inside it. The keyline is the
                problem: it is a white ring that only disappears on white, so on any other ground
                the mark arrives with a border it did not ask for. The blue is #384CE3 where the
                rest of the brand is #2d46ff. And the staircase is a 3x4 grid — at 22px that is
                five pixels of detail, which is none."
          render={(s) => <Today size={s} />}
        />

        <Bench
          title="1 — The meridian"
          note="What the site already wears, and the recommendation. A sphere on its axis: one
                circle, one meridian past the poles, one ellipse for the turn. It inherits colour
                rather than carrying it, so it works on ink, on bone, in a menu, in a footer. And
                it says what the company says — Algeria, on every corridor — where a pixel says
                only the name, which the name is already saying."
          render={(s) => <Meridian size={s} />}
        />

        <Bench
          title="2 — The pixel meridian"
          note="The same silhouette, quantised to an 11x11 grid: a ring at radius five, the
                meridian as a filled column. The bridge, if throwing the pixel away is too much
                to throw. It holds down to 22, loses the ellipse it never had room for, and at 16
                it is a ring with a bar — which is still the mark."
          render={(s) => <PixelMeridian size={s} />}
        />

        <Bench
          title="3 — The square, kept and fixed"
          note="If the container is not negotiable. The keyline goes, the corners soften to 22%,
                the blue becomes the brand's own, and what sits inside is a mark rather than four
                pixels of staircase. This is the app icon and the favicon in any case — the
                difference is whether it is also the logo."
          render={(s) => <Contained size={s} />}
        />

        <section className="border-t border-(--line) pt-8">
          <h2 className="type-headline text-[1.15rem]">4 — The wordmark, either way</h2>
          <p className="mt-2 max-w-[52ch] text-[0.9rem] leading-relaxed text-(--muted)">
            The supplied lockup sets Pixely in a default grotesk at 0 tracking, with the mark
            towering over it. Archivo at 0.06em is what the site already speaks in, and the mark
            comes down to the cap height so the two sit on one line rather than one beside the
            other.
          </p>
          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            {(["ink", "bone"] as const).map((ground) => (
              <div
                key={ground}
                data-theme={ground}
                className="flex min-h-[172px] flex-col justify-center gap-8 rounded-2xl bg-theme p-7 text-theme"
              >
                <Lockup mark={<Meridian size={40} />} size={52} />
                <Lockup mark={<Meridian size={26} />} size={34} />
                <Lockup mark={<Meridian size={18} />} size={22} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
