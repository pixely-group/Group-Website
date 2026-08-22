import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pixely — logo lab" };

/**
 * The logo lab, second pass.
 *
 * The first pass drew the letter in hairline monoline strokes, and hairlines
 * are for diagrams: a mark needs mass. These cuts are solid letterforms with
 * real typographic proportions, derived before they were drawn — a 4-unit
 * stem on a 20-unit cap (20%), a bowl 57.5% of the cap deep, curves a
 * quarter-unit lighter than the stem, glyph width 0.625 of the cap. The
 * geometry is a bold geometric grotesk P, the family the site's own Archivo
 * belongs to; the only thing added to it is the idea.
 *
 * Every candidate renders at 220 for judging, then 44, 22 and 16 — the
 * avatar, the nav and the favicon — on both grounds.
 */

const BLUE = "#2d46ff";

/* ---- what is there today --------------------------------------------- */

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

/* ---- the letter ------------------------------------------------------- */

/** The solid P. One path: stem, capsule bowl, leg. The counter is a subpath
 *  so it is a true hole — whatever the mark sits on shows through it. */
const P_OUTER = "M5 2H11.75A5.75 5.75 0 0 1 11.75 13.5H9V22H5V2Z";
/** The counter as the bowl's own geometry: a capsule, matching the outside. */
const COUNTER_CAPSULE = "M9 5.25H11.5A2.5 2.5 0 0 1 11.5 10.25H9V5.25Z";
/** The counter as a pixel: a 5-unit square on the same equator. */
const COUNTER_SQUARE = "M9 5.25H14V10.25H9V5.25Z";

/** A — the pixel counter. The hole in the letter is a square, and the square
 *  is lit. A pixel is the smallest unit of a picture the way a transaction
 *  is the smallest unit of an economy, so the letter holds one. The bowl
 *  stays round: the idea lives in the hole, and a round outside against a
 *  square inside is what makes the square read as a decision. */
function PixelCounterP({ size = 96, lit = BLUE }: { size?: number; lit?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="Pixely P, pixel counter">
      <path d={P_OUTER + COUNTER_SQUARE} fill="currentColor" fillRule="evenodd" />
      <path d={COUNTER_SQUARE} fill={lit} />
    </svg>
  );
}

/** The same cut with the counter left open — for grounds where the blue
 *  should not shout, and for single-colour print. Still reads: the square
 *  hole is the mark even uncoloured. */
function PixelCounterPQuiet({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="Pixely P, open counter">
      <path d={P_OUTER + COUNTER_SQUARE} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** B — the full stop. The letter is a straight bold P — capsule counter,
 *  nothing altered — and the pixel sits beside it instead of inside it: a
 *  blue square parked in the letter's own empty corner, baseline-aligned
 *  with the leg. It is the site's ending-dot gesture (the hero's "your
 *  way●") made square, and it reads as "P." — the name, concluded. */
function FullStopP({ size = 96, lit = BLUE }: { size?: number; lit?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="Pixely P, full stop">
      <path d={P_OUTER + COUNTER_CAPSULE} fill="currentColor" fillRule="evenodd" />
      <rect x="13.5" y="18" width="4" height="4" fill={lit} />
    </svg>
  );
}

/** The tile: brand blue, corners at 22%, the letter knocked out in bone with
 *  the counter showing the blue through — the way a cut letter works. This
 *  is the app icon and favicon for either candidate; the choice is whether
 *  it is also the logo. */
function Tile({
  size = 96,
  mark = "pixel",
}: {
  size?: number;
  mark?: "pixel" | "fullstop";
}) {
  const d = mark === "pixel" ? P_OUTER + COUNTER_SQUARE : P_OUTER + COUNTER_CAPSULE;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="Pixely app icon">
      <rect width="24" height="24" rx={24 * 0.22} fill={BLUE} />
      <g transform="translate(5.475 5.04) scale(0.58)">
        <path d={d} fill="#ece9e1" fillRule="evenodd" />
        {mark === "fullstop" && <rect x="13.5" y="18" width="4" height="4" fill="#ece9e1" />}
      </g>
    </svg>
  );
}

/* ---- the lockup ------------------------------------------------------- */

function Lockup({ mark, size = 34 }: { mark: React.ReactNode; size?: number }) {
  return (
    <span className="flex items-center" style={{ gap: size * 0.4 }}>
      {mark}
      <span
        className="type-headline"
        style={{ fontSize: size * 0.6, letterSpacing: "0.07em", lineHeight: 1 }}
      >
        Pixely
      </span>
    </span>
  );
}

/* ---- benches ---------------------------------------------------------- */

const LADDER = [44, 22, 16];

function Candidate({
  title,
  note,
  render,
  quiet,
}: {
  title: string;
  note: string;
  render: (size: number) => React.ReactNode;
  quiet?: (size: number) => React.ReactNode;
}) {
  return (
    <section className="border-t border-(--line) pt-8">
      <h2 className="type-headline text-[1.15rem]">{title}</h2>
      <p className="mt-2 max-w-[56ch] text-[0.9rem] leading-relaxed text-(--muted)">{note}</p>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        {(["ink", "bone"] as const).map((ground) => (
          <div
            key={ground}
            data-theme={ground}
            className="flex flex-wrap items-end gap-10 rounded-2xl bg-theme p-9 text-theme"
          >
            {/* Judged big first: a mark that needs explaining at 220 has
                already failed. */}
            <span className="flex flex-col items-center gap-3">
              {render(220)}
              <span className="type-label text-[0.55rem] text-(--faint)">220</span>
            </span>
            <span className="flex flex-col gap-5">
              <span className="flex items-end gap-6">
                {LADDER.map((s) => (
                  <span key={s} className="flex flex-col items-center gap-2">
                    {render(s)}
                    <span className="type-label text-[0.55rem] text-(--faint)">{s}</span>
                  </span>
                ))}
              </span>
              <Lockup mark={render(30)} size={38} />
              {quiet && (
                <span className="flex items-end gap-6 opacity-90">
                  {LADDER.map((s) => (
                    <span key={`q${s}`} className="flex flex-col items-center gap-2">
                      {quiet(s)}
                      <span className="type-label text-[0.55rem] text-(--faint)">quiet</span>
                    </span>
                  ))}
                </span>
              )}
            </span>
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
          <p className="type-label section-index text-(--muted)">Branding — the mark, second pass</p>
          <h1 className="type-headline mt-5 text-[2.4rem] leading-[1.05] tracking-[-0.02em]">
            The letter, with mass this time.
          </h1>
          <p className="mt-5 max-w-[60ch] text-[0.95rem] leading-relaxed text-(--muted)">
            The first pass drew the P in hairlines, and hairlines are for diagrams. These are
            solid letterforms on real typographic proportions — a 20% stem, a bowl 57.5% of the
            cap, curves a shade lighter than the stem, the same geometry family as the Archivo
            the site already speaks. Judged at 220 first, because a mark that needs explaining
            big has already failed small.
          </p>
        </header>

        <Candidate
          title="Today"
          note="For reference: the supplied square. The white keyline only disappears on white, the
                blue is off-brand, and the glyph inside is seven cells of staircase."
          render={(s) => <Today size={Math.min(s, 96)} />}
        />

        <Candidate
          title="A — The pixel counter"
          note="A bold geometric P whose counter is not an oval but a square, and the square is
                lit. A pixel is to a picture what a transaction is to an economy — the smallest
                unit, everything made of them — so the letter holds one. The bowl stays round
                because the idea lives in the hole: round outside against square inside is what
                makes the square read as a decision rather than a rendering error. The quiet row
                is the same letter with the counter left open, for single-colour print."
          render={(s) => <PixelCounterP size={s} />}
          quiet={(s) => <PixelCounterPQuiet size={s} />}
        />

        <Candidate
          title="B — The full stop"
          note="The letter untouched — a straight bold P — and the pixel beside it instead of
                inside it: a blue square parked in the letter's own empty corner, on the
                baseline. It is the ending-dot the site already uses (the hero's 'your way●')
                made square, and it reads as 'P.' — the name, concluded. Quieter than A at a
                glance, and the more literate of the two."
          render={(s) => <FullStopP size={s} />}
        />

        <section className="border-t border-(--line) pt-8">
          <h2 className="type-headline text-[1.15rem]">The tile — either letter, contained</h2>
          <p className="mt-2 max-w-[56ch] text-[0.9rem] leading-relaxed text-(--muted)">
            Brand blue, corners at 22%, the letter knocked out in bone with the ground showing
            through the counter. This is the app icon and favicon for either candidate — the
            only question is whether it is also the logo.
          </p>
          <div className="mt-7 flex flex-wrap items-end gap-10 rounded-2xl bg-ink p-9 text-bone">
            {(["pixel", "fullstop"] as const).map((m) => (
              <span key={m} className="flex flex-col items-center gap-3">
                <span className="flex items-end gap-5">
                  <Tile size={96} mark={m} />
                  <Tile size={44} mark={m} />
                  <Tile size={22} mark={m} />
                  <Tile size={16} mark={m} />
                </span>
                <span className="type-label text-[0.55rem] text-(--faint)">{m}</span>
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
