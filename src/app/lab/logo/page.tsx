import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pixely — logo lab" };

/**
 * The logo lab, third pass — and the lesson of the first two, kept where it
 * can be seen: marks built from geometric primitives (circles, lines, arcs)
 * render perfectly from code; letterforms do not. A good P is font-designer
 * work — optical corrections, modulated curves — and every hand-drawn P this
 * lab has held looked exactly as hand-drawn as it was.
 *
 * So this page holds two things only, and neither is drawn by hand:
 *
 *  1. The meridian — the mark the site already wears, built from primitives,
 *     which is why it works.
 *  2. "P." — the monogram set live in Archivo at the hero's own width and
 *     weight, with the hero's ending-dot as the full stop. The letter is the
 *     type designer's, not mine. If chosen, the shipped SVG is extracted
 *     from the font's outlines, so it stays vector everywhere.
 */

const BLUE = "#2d46ff";

/* ---- the meridian ----------------------------------------------------- */

function Meridian({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-label="Pixely meridian mark">
      <circle cx="11" cy="11" r="9.25" stroke="currentColor" strokeWidth={1.5} />
      <line x1="11" y1="0.75" x2="11" y2="21.25" stroke="currentColor" strokeWidth={1.5} />
      <ellipse cx="11" cy="11" rx="4.1" ry="9.25" stroke="currentColor" strokeWidth={1} opacity="0.55" />
    </svg>
  );
}

/* ---- the monogram ------------------------------------------------------ */

/** "P." in the site's own display voice: Archivo, stretched to the hero's
 *  125%, weight 700, with the ending-dot square sitting on the baseline the
 *  way a full stop does. Nothing here is drawn — the letter is the font's. */
function Monogram({
  size = 96,
  dot = BLUE,
}: {
  size?: number;
  dot?: string;
}) {
  return (
    <span
      aria-label="Pixely monogram"
      style={{
        fontFamily: "var(--font-display)",
        fontStretch: "125%",
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "0",
        display: "inline-flex",
        alignItems: "baseline",
      }}
    >
      P
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: size * 0.17,
          height: size * 0.17,
          marginLeft: size * 0.07,
          background: dot,
        }}
      />
    </span>
  );
}

/* ---- tiles ------------------------------------------------------------- */

function MeridianTile({ size = 96 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center text-bone"
      style={{ width: size, height: size, borderRadius: size * 0.22, background: BLUE }}
    >
      <Meridian size={size * 0.6} />
    </span>
  );
}

function MonogramTile({ size = 96 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center text-bone"
      style={{ width: size, height: size, borderRadius: size * 0.22, background: BLUE }}
    >
      <Monogram size={size * 0.52} dot="#ece9e1" />
    </span>
  );
}

/* ---- the lockup -------------------------------------------------------- */

function Lockup({ mark, size = 34 }: { mark: React.ReactNode; size?: number }) {
  return (
    <span className="flex items-center" style={{ gap: size * 0.42 }}>
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

/* ---- the page ---------------------------------------------------------- */

const SIZES = [96, 44, 22, 16];

function Bench({
  title,
  note,
  render,
  lockupMark,
}: {
  title: string;
  note: string;
  render: (size: number) => React.ReactNode;
  lockupMark?: (size: number) => React.ReactNode;
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
            className="flex min-h-[188px] flex-wrap items-end gap-9 rounded-2xl bg-theme p-8 text-theme"
          >
            {SIZES.map((s) => (
              <span key={s} className="flex flex-col items-center gap-2">
                {render(s)}
                <span className="type-label text-[0.55rem] text-(--faint)">{s}</span>
              </span>
            ))}
            {lockupMark && (
              <span className="flex flex-col gap-2">
                <Lockup mark={lockupMark(26)} size={36} />
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
          <p className="type-label section-index text-(--muted)">Branding — the mark, third pass</p>
          <h1 className="type-headline mt-5 text-[2.4rem] leading-[1.05] tracking-[-0.02em]">
            Nothing hand-drawn survives.
          </h1>
          <p className="mt-5 max-w-[62ch] text-[0.95rem] leading-relaxed text-(--muted)">
            The lesson of the last two passes: marks built from geometric primitives render
            perfectly from code, and letterforms do not — a good P is font-designer work, and
            every hand-drawn one looked exactly as hand-drawn as it was. So this page holds two
            candidates, and neither is drawn by hand. The letter below is Archivo&apos;s own,
            at the hero&apos;s width and weight.
          </p>
        </header>

        <Bench
          title="1 — The meridian, as the mark"
          note="Built from a circle, a line and an ellipse, which is why it holds at every size —
                primitives are what SVG draws perfectly. It inherits colour rather than carrying
                it, it already sits in the navigation, and it says the business: a sphere on its
                axis, turning. The case against it stands too: it says the world, not the name."
          render={(s) => <Meridian size={s} />}
          lockupMark={(s) => <Meridian size={s} />}
        />

        <Bench
          title="2 — P., the monogram"
          note="The name's initial in the site's own headline voice — Archivo stretched to the
                hero's 125%, weight 700 — with the hero's ending-dot as its full stop, on the
                baseline where a full stop lives. The letter is the type designer's, which is
                what the hand-drawn attempts were missing. It says the name and it ends the
                sentence, the way the headline does. If chosen, the shipped file is the glyph's
                extracted outline, so it stays vector everywhere type cannot go."
          render={(s) => <Monogram size={s} />}
          lockupMark={(s) => <Monogram size={s} />}
        />

        <section className="border-t border-(--line) pt-8">
          <h2 className="type-headline text-[1.15rem]">The tile — either one, contained</h2>
          <p className="mt-2 max-w-[56ch] text-[0.9rem] leading-relaxed text-(--muted)">
            Brand blue, corners at 22%, the mark in bone. The app icon and favicon for either
            candidate.
          </p>
          <div className="mt-7 flex flex-wrap items-end gap-10 rounded-2xl bg-ink p-8 text-bone">
            <span className="flex flex-col items-center gap-3">
              <span className="flex items-end gap-5">
                {SIZES.map((s) => (
                  <MeridianTile key={s} size={s} />
                ))}
              </span>
              <span className="type-label text-[0.55rem] text-(--faint)">meridian</span>
            </span>
            <span className="flex flex-col items-center gap-3">
              <span className="flex items-end gap-5">
                {SIZES.map((s) => (
                  <MonogramTile key={s} size={s} />
                ))}
              </span>
              <span className="type-label text-[0.55rem] text-(--faint)">monogram</span>
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
