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


/* ---- the P directions ------------------------------------------------ */

/** A geometric P: one stem, one bowl. The bowl is a half turn that starts on
 *  the stem and comes back to it, which is what makes a capital P — a whole
 *  circle hung off a vertical is a lowercase p, however tall the vertical is,
 *  and that is what the first draft of this drew. */
function AperturePMark({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-label="Aperture P"
         stroke="currentColor" strokeLinecap="round">
      <line x1="7" y1="2.2" x2="7" y2="19.8" strokeWidth={1.6} />
      <path d="M7 2.2a4.9 4.9 0 0 1 0 9.8" strokeWidth={1.6} />
    </svg>
  );
}

/** The same P with the mark's own detail kept: the axis is the stem, the bowl
 *  is the half turn, and inside it runs the second, tighter arc — the meridian
 *  the sphere had. The three parts are the three parts; they are arranged to
 *  spell the letter instead of to draw a globe. */
function MeridianPMark({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-label="Meridian P"
         stroke="currentColor" strokeLinecap="round">
      <line x1="7" y1="2.2" x2="7" y2="19.8" strokeWidth={1.6} />
      <path d="M7 2.2a4.9 4.9 0 0 1 0 9.8" strokeWidth={1.6} />
      {/* The turn. First thing to go at 16px, and it should be — what is left
          is still the letter. */}
      <path d="M7 2.2a2.1 4.9 0 0 1 0 9.8" strokeWidth={1} opacity="0.55" />
    </svg>
  );
}

/** A P with enough grid to be one. The supplied glyph is three cells across
 *  and four down — seven filled squares, which is not room for a letter, and
 *  is why it reads as a fragment rather than a P. Six by eleven is. */
const P_BITS = [
  "111110",
  "110011",
  "110011",
  "110011",
  "111110",
  "110000",
  "110000",
  "110000",
  "110000",
  "110000",
  "110000",
];
function PixelPMark({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-label="Pixel P">
      {P_BITS.flatMap((row, j) =>
        row.split("").map((bit, i) =>
          bit === "1" ? (
            <rect key={`${i}-${j}`} x={5 + i * 2} y={j * 2} width="2" height="2" fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}

/** Any of them, in the container. */
function ContainedP({ size = 96, mark }: { size?: number; mark: "aperture" | "meridian" | "pixel" }) {
  const Inner = mark === "aperture" ? AperturePMark : mark === "meridian" ? MeridianPMark : PixelPMark;
  return (
    <span
      className="inline-flex items-center justify-center text-bone"
      style={{ width: size, height: size, borderRadius: size * 0.22, background: "#2d46ff" }}
    >
      <Inner size={size * 0.62} />
    </span>
  );
}


/* ---- a mark drawn for this company ----------------------------------- */

/* One idea, three weights.
 *
 * A pixel is to a picture what a transaction is to an economy: the smallest
 * unit there is, and everything is made of them. So the letter holds one —
 * the counter of the P is not an oval but a square, and the square is lit.
 * That is the whole mark. It says the initial, it says the name, and it says
 * what the company is for, and it does all three with one square.
 *
 * The bowl turns and the counter does not — the idea lives in the hole, and
 * the contrast between a round outside and a square inside is what makes the
 * square read as a decision rather than as a letter that failed to curve.
 */

/** The solid cut. The app icon, and anywhere the mark stands alone.
 *
 *  The bowl turns. Drawn square it was not a P at all — a rectangle on a
 *  pole reads as a flag, and that is what the first cut of this was. The idea
 *  is the counter, not the bowl: it is the hole that is a pixel, and a round
 *  bowl around a square hole is what makes the square read as a decision
 *  rather than as a letter that failed to curve. */
function LitP({ size = 96, lit = "#2d46ff" }: { size?: number; lit?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-label="Pixely P">
      <path d="M5.5 2H11a5.5 5.5 0 0 1 0 11H8.5v7h-3V2Z" fill="currentColor" />
      <rect x="8.5" y="5" width="5" height="5" fill={lit} />
    </svg>
  );
}

/** The drawn cut, for setting beside type — the nav, a footer, a signature. */
function LitPLine({ size = 96, lit = "#2d46ff" }: { size?: number; lit?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-label="Pixely P">
      <path
        d="M7 2.6v16.8M7 2.6h4.1a4.35 4.35 0 0 1 0 8.7H7"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="square"
      />
      <rect x="8.8" y="5.2" width="3.5" height="3.5" fill={lit} />
    </svg>
  );
}

/** The counted cut: the same letter spelled out in units, one of them lit.
 *  For where the pixel should be the loudest thing in the room. */
const LIT_P_BITS = [
  "111110",
  "110011",
  "110011",
  "110011",
  "111110",
  "110000",
  "110000",
  "110000",
  "110000",
  "110000",
  "110000",
];
function LitPGrid({ size = 96, lit = "#2d46ff" }: { size?: number; lit?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-label="Pixely P">
      {LIT_P_BITS.flatMap((row, j) =>
        row.split("").map((bit, i) =>
          bit === "1" ? (
            <rect key={`${i}-${j}`} x={5 + i * 2} y={j * 2} width="2" height="2" fill="currentColor" />
          ) : null,
        ),
      )}
      {/* The one unit that is not the letter: the counter, lit. */}
      <rect x="9" y="2" width="4" height="6" fill={lit} />
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
          <h2 className="type-headline text-[1.15rem]">A mark drawn for this company</h2>
          <p className="mt-2 max-w-[56ch] text-[0.9rem] leading-relaxed text-(--muted)">
            A pixel is to a picture what a transaction is to an economy: the smallest unit there
            is, and everything is made of them. So the letter holds one. The counter of the P is
            not an oval but a square, and the square is lit — that is the whole mark. It says the
            initial, it says the name, and it says what the company is for, with one square. The
            bowl turns, because the idea lives in the hole and not the outline: a square bowl on
            a stem reads as a flag, and a round bowl around a square hole is what makes the
            square read as a decision. In the app icon the counter is the container showing
            through, the way a cut letter works.
          </p>
          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            {(["ink", "bone"] as const).map((ground) => (
              <div
                key={ground}
                data-theme={ground}
                className="flex flex-col gap-8 rounded-2xl bg-theme p-7 text-theme"
              >
                {([
                  ["solid", (n: number) => <LitP size={n} />],
                  ["drawn", (n: number) => <LitPLine size={n} />],
                  ["counted", (n: number) => <LitPGrid size={n} />],
                ] as const).map(([name, render]) => (
                  <span key={name} className="flex flex-wrap items-end gap-7">
                    {SIZES.map((n) => (
                      <span key={n} className="flex flex-col items-center gap-2">
                        {render(n)}
                        <span className="type-label text-[0.55rem] text-(--faint)">{n}</span>
                      </span>
                    ))}
                    <span className="flex flex-col gap-2">
                      <Lockup mark={render(26)} />
                      <span className="type-label text-[0.55rem] text-(--faint)">{name}</span>
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-9 rounded-2xl bg-ink p-7 text-bone">
            {[96, 44, 22, 16].map((n) => (
              <span
                key={n}
                className="inline-flex items-center justify-center"
                style={{ width: n, height: n, borderRadius: n * 0.22, background: "#2d46ff" }}
              >
                <LitP size={n * 0.78} lit="#2d46ff" />
              </span>
            ))}
            <span className="type-label text-[0.55rem] text-(--faint)">app icon — the lit square inverts</span>
          </div>
        </section>

        <Bench
          title="5 — The aperture P"
          note="A geometric P: one stem, one half turn that starts on the stem and comes back to
                it. That last part is what makes it a capital — a whole circle hung off a vertical
                is a lowercase p however tall the vertical is. Two elements and no detail to lose,
                so it is still unmistakably a P at 16px, which is the size that decides these."
          render={(s) => <AperturePMark size={s} />}
        />

        <Bench
          title="6 — The meridian P"
          note="The same letter with the mark's own detail kept: the axis is the stem, the bowl is
                the half turn, and the second tighter arc inside it is the meridian the sphere
                had. The three parts are the same three, arranged to spell the letter instead of
                to draw a globe. If you want both the P and what the site already wears, this is
                the one that gives you both — the turn drops out at 16px and the letter stays."
          render={(s) => <MeridianPMark size={s} />}
        />

        <Bench
          title="7 — The pixel P"
          note="A P with enough grid to be one. The supplied glyph is three cells across and four
                down — seven filled squares, decoding to ### / #.# / .## / #.. — which is not room
                for a letter, and is why it reads as a fragment. Six by eleven is room. This keeps
                the pixel idea and spends it on the initial rather than on an abstraction."
          render={(s) => <PixelPMark size={s} />}
        />

        <section className="border-t border-(--line) pt-8">
          <h2 className="type-headline text-[1.15rem]">8 — The P in the container</h2>
          <p className="mt-2 max-w-[52ch] text-[0.9rem] leading-relaxed text-(--muted)">
            Whichever P, this is the app icon and the favicon: brand blue, corners at 22%, the
            letter knocked out. No keyline, so it needs no ground under it.
          </p>
          <div className="mt-7 flex flex-wrap items-end gap-9 rounded-2xl bg-ink p-7">
            {(["aperture", "meridian", "pixel"] as const).map((m) => (
              <span key={m} className="flex flex-col items-center gap-3">
                <span className="flex items-end gap-4">
                  <ContainedP size={96} mark={m} />
                  <ContainedP size={44} mark={m} />
                  <ContainedP size={22} mark={m} />
                  <ContainedP size={16} mark={m} />
                </span>
                <span className="type-label text-[0.55rem] text-(--faint)">{m}</span>
              </span>
            ))}
          </div>
        </section>

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
