import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pixely — brand system" };

/**
 * The brand system, set in itself.
 *
 * Everything here is drawn with the shipped utilities and the shipped
 * tokens — `type-display`, `type-label`, `var(--color-signal)`, the real
 * `data-theme` grounds — rather than with copies of their values. A page
 * that restated the numbers would go stale the first time one of them
 * moved; this one cannot, because it is reading them.
 *
 * The only literals are the hex strings printed as documentation, and the
 * swatch beside each one is painted from the token, so a drift between the
 * two is visible on this page rather than hidden in it.
 */

/* — the mark, live ————————————————————————————————————————— */

/** The wordmark is `type-headline` — wdth 118, weight 570, uppercase — which
 *  is what the navigation sets. Not the monogram's setting. */
function Wordmark({ size }: { size?: number }) {
  return (
    <span
      className="type-headline inline-flex items-baseline"
      /* No size means inherit, so a caller can set it fluidly from the
         outside. Passing a number would have pinned it — the cover asks for
         a clamp() and got 1px the first time this was written. */
      style={{ fontSize: size, lineHeight: 1, letterSpacing: "0.06em" }}
    >
      Pixely
      <span
        aria-hidden
        className="inline-block bg-accent"
        style={{ width: "0.17em", height: "0.17em", marginLeft: "0.12em" }}
      />
    </span>
  );
}

/** Heavier and wider than the wordmark, because it carries a 16px tile on
 *  its own. This is the setting the shipped icon.svg outline was taken at. */
function Monogram({ size = 34, dot }: { size?: number; dot?: string }) {
  return (
    <span
      className="inline-flex items-baseline"
      style={{
        fontFamily: "var(--font-display)",
        fontStretch: "125%",
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
      }}
    >
      P
      <span
        aria-hidden
        className={dot ? "inline-block" : "inline-block bg-accent"}
        style={{
          width: "0.17em",
          height: "0.17em",
          marginLeft: "0.07em",
          background: dot,
        }}
      />
    </span>
  );
}

function Tile({ size = 88 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: "var(--color-signal)",
        color: "var(--color-bone)",
      }}
    >
      <Monogram size={size * 0.52} dot="var(--color-bone)" />
    </span>
  );
}

/* — page furniture ————————————————————————————————————————— */

function Section({
  index,
  title,
  lede,
  ground,
  children,
}: {
  index: string;
  title: string;
  lede?: React.ReactNode;
  ground: "ink" | "bone";
  children: React.ReactNode;
}) {
  return (
    <section
      data-theme={ground}
      className="bg-theme px-6 py-20 text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-6xl">
        <p className="type-label section-index text-(--muted)">{index}</p>
        <h2 className="type-headline mt-5 text-[clamp(2rem,5vw,3.4rem)]">
          {title}
        </h2>
        {lede && (
          <p className="mt-5 max-w-[62ch] leading-relaxed text-(--muted)">
            {lede}
          </p>
        )}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-(--radius-panel) border border-(--line) bg-(--surface) p-6">
      <h3 className="type-label text-(--faint)">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** A specimen carries its own ground whatever band it sits in — the point is
 *  judging the system on both. */
function Spec({
  ground,
  label,
  meta,
  children,
}: {
  ground: "ink" | "bone";
  label: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme={ground}
      className="overflow-hidden rounded-(--radius-panel) border border-(--line) bg-theme p-7 text-theme"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="type-label text-(--faint)">{label}</p>
        {meta && <p className="type-label text-(--faint)">{meta}</p>}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

/* — data ——————————————————————————————————————————————————— */

const PALETTE = [
  {
    name: "Ink",
    token: "--color-ink",
    hex: "#0a0a0b",
    role: "Primary ground. The hero, the manifesto, the product chapters.",
  },
  {
    name: "Bone",
    token: "--color-bone",
    hex: "#ece9e1",
    role: "Counter-ground, and the type colour on ink. Warm, never white.",
  },
  {
    name: "Signal",
    token: "--color-signal",
    hex: "#2d46ff",
    role: "The only accent. Full chroma at 233° — as vivid as this hue gets while clearing AA on bone.",
  },
  {
    name: "Signal lift",
    token: "--color-signal-lift",
    hex: "#7290ff",
    role: "Accented text on ink, where signal itself is AA-large only.",
  },
  {
    name: "Signal glow",
    token: "--color-signal-glow",
    hex: "#9fb4ff",
    role: "Canvas and WebGL marks only — alpha-blended and additive. Never flat DOM colour.",
  },
  {
    name: "Signal deep",
    token: "--color-signal-deep",
    hex: "#1f33d6",
    role: "Pressed states and gradient ends. 6.92:1 on bone.",
  },
  {
    name: "Positive",
    token: "--color-positive",
    hex: "#23855c",
    role: "Credits, settled, verified. Semantic only — never decorative.",
  },
  {
    name: "Negative",
    token: "--color-negative",
    hex: "#c2402d",
    role: "Failed, refused, debits. Semantic only.",
  },
] as const;

/** Computed from the shipped values with the WCAG relative-luminance
 *  formula, not estimated. The code's own note said signal on ink was
 *  3.25:1; it is 3.23. */
const CONTRAST = [
  { fg: "Bone", bg: "Ink", ratio: "16.31:1", grade: "AAA" },
  { fg: "Foreground #131316", bg: "Bone", ratio: "15.29:1", grade: "AAA" },
  { fg: "Signal deep", bg: "Bone", ratio: "6.92:1", grade: "AA" },
  { fg: "Signal lift", bg: "Ink", ratio: "6.74:1", grade: "AA" },
  { fg: "Signal", bg: "Bone", ratio: "5.04:1", grade: "AA" },
  { fg: "Bone", bg: "Signal", ratio: "5.04:1", grade: "AA" },
  { fg: "Negative", bg: "Bone", ratio: "4.26:1", grade: "AA large" },
  { fg: "Positive", bg: "Bone", ratio: "3.78:1", grade: "AA large" },
  { fg: "Signal", bg: "Ink", ratio: "3.23:1", grade: "AA large" },
] as const;

const GROUNDS = [
  { token: "--fg", ink: "#ece9e1", bone: "#131316" },
  { token: "--muted", ink: "bone / 52%", bone: "ink / 56%" },
  { token: "--faint", ink: "bone / 28%", bone: "ink / 32%" },
  { token: "--line", ink: "bone / 14%", bone: "ink / 16%" },
  { token: "--line-strong", ink: "bone / 32%", bone: "ink / 40%" },
  { token: "--surface", ink: "bone / 4%", bone: "ink / 4%" },
] as const;

const EASES = [
  {
    token: "--ease-out-expo",
    value: "cubic-bezier(0.16, 1, 0.3, 1)",
    use: "Arrivals. Leaves fast, lands without a stop. The default for anything entering.",
  },
  {
    token: "--ease-inout-soft",
    value: "cubic-bezier(0.65, 0, 0.35, 1)",
    use: "Round trips — things that leave and return to where they were.",
  },
  {
    token: "--ease-swift",
    value: "cubic-bezier(0.55, 0, 0.1, 1)",
    use: "Controls answering a press. Short, decisive, no float.",
  },
  {
    token: "--ease-cross",
    value: "cubic-bezier(0.4, 0, 0.2, 1)",
    use: "Colour only. The motion curves hold still at the start, which on a colour reads as a delay and then a swipe.",
  },
] as const;

/* — the page ——————————————————————————————————————————————— */

export default function BrandLab() {
  return (
    <main>
      {/* — cover — */}
      <header
        data-theme="ink"
        className="bg-theme px-6 pt-28 pb-20 text-theme sm:px-10 lg:px-14"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-[clamp(3rem,11vw,8rem)]">
            <Wordmark />
          </div>
          <h1 className="type-display mt-12 max-w-[18ch] text-[clamp(1.9rem,4.6vw,3rem)]">
            The mark, the palette and the two voices
          </h1>
          <p className="mt-6 max-w-[62ch] leading-relaxed text-(--muted)">
            Pixely combines payments, digital identity and artificial
            intelligence into one platform — secure transactions, trusted
            verification and intelligent financial services, built for
            Algeria. This is the system that carries it, drawn with the
            shipped tokens rather than with copies of them.
          </p>
          <p className="type-label mt-14 border-t border-(--line) pt-7 leading-relaxed text-(--faint)">
            Financial inclusion · Intelligent innovation · Trust &amp; security
          </p>
        </div>
      </header>

      {/* — 01 — */}
      <Section
        index="01 — Two voices"
        title="One sentence, said by a machine and a person"
        ground="bone"
        lede={
          <>
            The identity is not a logo with a palette attached. It is a
            collision of two typefaces, and everything else follows from it.
            Archivo is the infrastructure speaking: extended, uppercase, set
            tight and cold. Fraunces answers in italic lowercase — drawn, warm,
            human. The brand happens in the seam between them, which is why the
            two are never used apart.
          </>
        }
      >
        <Spec ground="ink" label="The construction">
          <p className="type-display text-[clamp(1.8rem,6vw,4rem)]">
            We make money
            <br />
            move{" "}
            <em className="type-serif-inherit text-[1.4em] text-signal-lift normal-case">
              instantly
            </em>
            <span
              aria-hidden
              className="caret-dot"
              style={{ background: "var(--color-signal-lift)" }}
            />
          </p>
          <p className="mt-7 max-w-[54ch] leading-relaxed text-(--muted)">
            The machine states the fact. The serif supplies the promise, and it
            is the only word that changes — instantly, securely, your way. It
            runs at 1.4em against the line it interrupts, because at matching
            size it reads as a mistake rather than an answer.
          </p>
        </Spec>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Panel title="What Archivo says">
            <p className="leading-relaxed text-(--muted)">
              Rails, ledgers, settlement, compliance — anything a regulator
              would recognise. Always uppercase, always negative-tracked, always
              set below single leading, because infrastructure packs.
            </p>
          </Panel>
          <Panel title="What Fraunces says">
            <p className="leading-relaxed text-(--muted)">
              The consequence for a person. Once per headline at most, never in
              a paragraph, never in a label. Overused it stops being a
              counter-voice and becomes a decorative font.
            </p>
          </Panel>
        </div>
      </Section>

      {/* — 02 — */}
      <Section
        index="02 — The mark"
        title="A word, a letter, and the full stop that outranks both"
        ground="ink"
        lede={
          <>
            The mark is the name carrying its own full stop — square, not
            round, because it is a lit pixel as much as a period. Two lengths
            of one gesture, never a third, and the square is the part that
            travels.
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Spec ground="bone" label="Primary — the wordmark" meta="wdth 118 · 570">
            <Wordmark size={52} />
            <p className="mt-6 leading-relaxed text-(--muted)">
              Archivo at the headline setting — <code>type-headline</code>,
              uppercase, tracked +0.06em. The default in every context with
              room for it.
            </p>
          </Spec>
          <Spec ground="bone" label="Reduction — the monogram" meta="wdth 125 · 700">
            <Monogram size={52} />
            <p className="mt-6 leading-relaxed text-(--muted)">
              Wider and heavier, because it carries a 16px tile alone. Use it
              for the app icon and any standalone mark. <b>Not</b> the
              navigation&apos;s gathered P — that is the wordmark with its tail
              closed, so it keeps 118 / 570.
            </p>
          </Spec>
        </div>

        <div className="mt-14 border-t border-(--line) pt-10">
          <h3 className="type-headline text-[1.3rem]">
            The rule that decides every lockup
          </h3>
          <p className="mt-4 max-w-[62ch] leading-relaxed text-(--muted)">
            The monogram never sits beside the wordmark. The name begins with
            the same letter, so a P locked to the left of “Pixely” says the P
            twice and reads as a stutter. One gesture, two lengths. If a lockup
            needs a mark and a name, the name is already the mark.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Panel title="Geometry">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[0.9rem]">
              {[
                ["Wordmark", "wdth 118 / 570, uppercase, +0.06em"],
                ["Monogram", "wdth 125 / 700, standalone and in the tile"],
                ["Dot", "0.17em square, at every size"],
                ["After the word", "0.12em — clears the y descender"],
                ["After the P", "0.07em — no descender to clear"],
                ["Ending a headline", "0.14em — the caret-dot utility"],
                ["Tile radius", "22% of the tile’s width"],
                ["Mark in tile", "52% of the tile’s width"],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="type-mono whitespace-nowrap text-(--fg)">
                    {k}
                  </dt>
                  <dd className="text-(--muted)">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-[0.9rem] leading-relaxed text-(--muted)">
              Three offsets, one square. The gap answers to whatever sits to
              its left, which is why it is not a single number.
            </p>
          </Panel>

          <Panel title="Clear space & minimum size">
            <p className="text-[0.9rem] leading-relaxed text-(--muted)">
              Clear space on all four sides is the cap height of the P. It
              scales with the mark and needs no table.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-9">
              <span className="inline-flex p-[0.72em] outline-1 outline-dashed outline-(--line-strong)">
                <Monogram size={40} />
              </span>
              <span className="flex flex-col gap-2">
                <Wordmark size={17.6} />
                <span className="type-label text-(--faint)">
                  17.6px — shipped nav size
                </span>
              </span>
            </div>
            <p className="mt-6 text-[0.9rem] leading-relaxed text-(--muted)">
              Floor is 16px of font size, where the dot lands at 2.7px and
              still reads as a square. Below that use the monogram; below 16px
              square, the tile.
            </p>
          </Panel>
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="type-headline text-[1.15rem]">The tile</h3>
            <p className="mt-4 leading-relaxed text-(--muted)">
              Signal ground, bone mark, corner at 22%. The shipped{" "}
              <code>icon.svg</code> is not type — it is Archivo&apos;s real P
              outline, extracted at wdth 125 / wght 700, so it stays vector
              everywhere type cannot go.
            </p>
            <div className="mt-7 flex flex-wrap items-end gap-6">
              <Tile size={88} />
              <Tile size={48} />
              <Tile size={28} />
              <Tile size={16} />
            </div>
          </div>
          <div>
            <h3 className="type-headline text-[1.15rem]">
              The dot is a system, not an ornament
            </h3>
            <p className="mt-4 leading-relaxed text-(--muted)">
              The square leaves the logo and does the same job everywhere else
              at the same 0.17em ratio: it walks the navigation to mark the
              chapter you are in, it becomes the caret that types and erases
              the rotating word, and it ends the headline. It blinks only when
              the full name is shown and untouched — a lone P with a flashing
              dot reads as a fault, not a caret.
            </p>
            <p className="mt-4 leading-relaxed text-(--muted)">
              One consequence: nothing else on the surface is a small blue
              circle. Bullets, status marks and markers all take the square.
            </p>
          </div>
        </div>

        <div className="mt-14 border-t border-(--line) pt-10">
          <h3 className="type-headline text-[1.3rem]">Misuse</h3>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              "Never lock the monogram beside the wordmark — the P is said twice.",
              "Never round the dot. It is a pixel and a full stop, not a bullet.",
              "Never re-draw the letterform. Hand-drawn versions look hand-drawn.",
              "Never re-colour the dot to anything but signal, or bone on signal.",
              "Never set the word in another face, width or weight.",
              "Do let it be cropped — the mark is confident enough to run off an edge.",
            ].map((line, i) => (
              <li
                key={line}
                className="flex gap-3 leading-relaxed text-(--muted)"
              >
                <span
                  aria-hidden
                  className="type-mono shrink-0"
                  style={{
                    color:
                      i === 5
                        ? "var(--color-positive)"
                        : "var(--color-negative)",
                  }}
                >
                  {i === 5 ? "✓" : "✕"}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* — 03 — */}
      <Section
        index="03 — Colour"
        title="Ink, bone, signal"
        ground="bone"
        lede={
          <>
            One neutral pair used both ways, and one blue. Ink and bone are not
            a light mode and a dark mode — they are two grounds the page moves
            between as it goes, and every component is written in tokens so it
            can live on either without knowing which it is on.
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PALETTE.map((c) => (
            <div
              key={c.token}
              className="overflow-hidden rounded-(--radius-control) border border-(--line)"
            >
              <div
                className="h-24"
                style={{ background: `var(${c.token})` }}
              />
              <div className="bg-(--surface) p-4">
                <p className="font-semibold text-(--fg)">{c.name}</p>
                <p className="type-label mt-1 text-(--faint)">{c.token}</p>
                <p className="type-mono mt-3 text-[0.85rem] text-(--muted)">
                  {c.hex}
                </p>
                <p className="mt-3 text-[0.82rem] leading-relaxed text-(--muted)">
                  {c.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-(--line) pt-10">
          <h3 className="type-headline text-[1.3rem]">
            The one rule people get wrong
          </h3>
          <p className="mt-4 max-w-[62ch] leading-relaxed text-(--muted)">
            Signal clears AA as text on bone. On ink it does not — it lands at
            3.23:1, which passes for large text and fails for small. Accented
            text on ink lifts to <code>--color-signal-lift</code>; signal itself
            stays for fills, rules and marks, where contrast is not a reading
            requirement.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-[0.9rem]">
              <thead>
                <tr>
                  {["Foreground", "Ground", "Ratio", "Verdict"].map((h) => (
                    <th
                      key={h}
                      className="type-label border-b border-(--line) pb-3 text-left text-(--faint)"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONTRAST.map((r) => (
                  <tr key={`${r.fg}-${r.bg}`}>
                    <td className="border-b border-(--line) py-3 pr-6 font-semibold text-(--fg)">
                      {r.fg}
                    </td>
                    <td className="border-b border-(--line) py-3 pr-6 text-(--muted)">
                      {r.bg}
                    </td>
                    <td className="type-mono border-b border-(--line) py-3 pr-6 text-(--fg)">
                      {r.ratio}
                    </td>
                    <td className="border-b border-(--line) py-3">
                      <span
                        className="type-label rounded-(--radius-mock-tag) px-2 py-1"
                        style={{
                          color:
                            r.grade === "AA large"
                              ? "var(--color-negative)"
                              : "var(--color-positive)",
                          background:
                            r.grade === "AA large"
                              ? "color-mix(in oklab, var(--color-negative) 14%, transparent)"
                              : "color-mix(in oklab, var(--color-positive) 14%, transparent)",
                        }}
                      >
                        {r.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-14 border-t border-(--line) pt-10">
          <h3 className="type-headline text-[1.3rem]">
            Semantic tokens — the only names a component should use
          </h3>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {(["ink", "bone"] as const).map((ground) => (
              <Spec
                key={ground}
                ground={ground}
                label={`data-theme="${ground}"`}
              >
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[0.9rem]">
                  {GROUNDS.map((g) => (
                    <div key={g.token} className="contents">
                      <dt className="type-mono text-(--fg)">{g.token}</dt>
                      <dd className="type-mono text-(--muted)">
                        {ground === "ink" ? g.ink : g.bone}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Spec>
            ))}
          </div>
          <p className="mt-7 max-w-[62ch] leading-relaxed text-(--muted)">
            The two grounds are deliberately asymmetric — muted is 52% on ink
            and 56% on bone, line is 14% and 16%. Dark type on a light ground
            carries further than light type on a dark one, so an inverted copy
            of the same numbers reads heavier than it should.
          </p>
        </div>
      </Section>

      {/* — 04 — */}
      <Section
        index="04 — Typography"
        title="Five families, five jobs, no overlap"
        ground="ink"
        lede={
          <>
            Each face is here because something needed doing that the others
            could not do. None of them is a general-purpose body font — the
            roles are the point, and a face used outside its role is the
            fastest way to break this identity.
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <Spec
            ground="bone"
            label="Display — Archivo"
            meta="wdth 125 · 600 · −0.015em · lh 0.94"
          >
            <p className="type-display text-[clamp(1.9rem,6.5vw,4rem)]">
              One ledger.
              <br />
              Every movement.
            </p>
            <p className="mt-7 leading-relaxed text-(--muted)">
              Headlines and the wordmark. Extended and uppercase, set below
              single leading so the lines lock together. Section headlines drop
              to wdth 118 / 570 / −0.01em / lh 0.98 — a shade narrower and
              lighter, so a headline never competes with a hero.
            </p>
          </Spec>

          <Spec
            ground="bone"
            label="Counter-voice — Fraunces"
            meta="italic · opsz 144 · SOFT 0 · WONK 1"
          >
            <p className="type-serif text-[clamp(1.9rem,6.5vw,4rem)] text-signal">
              instantly, securely, your way
            </p>
            <p className="mt-7 leading-relaxed text-(--muted)">
              Three axes, all deliberate. <b>opsz 144</b> for display-optical
              sharpness; <b>SOFT 0</b> to keep corners crisp beside
              Archivo&apos;s cold geometry; <b>WONK 1</b> for the single-storey
              forms that make it read as drawn rather than set. Drop any one and
              it becomes a generic italic serif.
            </p>
          </Spec>

          <Spec
            ground="bone"
            label="Utility — IBM Plex Mono"
            meta="11px · 400 · +0.16em · lh 1.5"
          >
            <p className="type-label text-[0.8rem] text-(--fg)">
              01 — Manifesto · Pixely — financial infrastructure for Algeria ·
              Scroll · L3 Policy · Refused
            </p>
            <p className="mt-7 leading-relaxed text-(--muted)">
              Eyebrows, section indices, data, state. Uppercase and widely
              tracked, which is what lets an 11px label hold its own against a
              72px headline. Line height is 1.5, not 1 — set solid, two lines
              of 11px caps leave no gap at all between them.
            </p>
          </Spec>

          <Spec
            ground="bone"
            label="Product UI — Nunito"
            meta="400 / 500 / 600 / 700"
          >
            <div style={{ fontFamily: "var(--font-nunito)" }}>
              <p className="text-[0.85rem] text-(--muted)">
                Main account · DZD
              </p>
              <p className="mt-1 text-[2.4rem] font-bold tracking-[-0.025em] text-(--fg)">
                12 481,43
              </p>
              <p className="mt-1 text-[0.95rem]">
                <span className="font-semibold text-positive">+286,27</span>{" "}
                <span className="text-(--muted)">today</span>
              </p>
            </div>
            <p className="mt-7 leading-relaxed text-(--muted)">
              Inside the app only. The rounded terminals are most of why the
              product reads as friendly where the site reads as infrastructure.
              Setting the app in Archivo would make it a colder product;
              setting the site in Nunito would throw the identity away.
            </p>
          </Spec>

          <Spec
            ground="bone"
            label="Figures — Martian Mono"
            meta="500 · the corridor clock only"
          >
            <p
              className="text-[2rem] tracking-[-0.04em] text-(--fg)"
              style={{ fontFamily: "var(--font-clock)" }}
            >
              04:21 · 17:38 · 23:05
            </p>
            <p className="mt-7 leading-relaxed text-(--muted)">
              Departure-board figures, read as a mechanism rather than as
              prose. One job, one face — cheaper than bending a face that
              already has another one.
            </p>
          </Spec>
        </div>

        <div className="mt-14 border-t border-(--line) pt-10">
          <h3 className="type-headline text-[1.3rem]">
            The hero scale is solved, not chosen
          </h3>
          <p className="type-mono mt-5 text-[0.85rem] break-words text-(--fg)">
            clamp(1.7rem, min(7.4vw, calc((100svh − 430px) / 5)), 11.5rem)
          </p>
          <p className="mt-5 max-w-[62ch] leading-relaxed text-(--muted)">
            Width alone cannot size a full-bleed headline: on a short, wide
            window a pure vw value pushes the first line up behind the
            navigation. The second term is the height actually available — the
            viewport less the rest of the hero stack, over the line-heights the
            headline needs. Measured, not guessed.
          </p>
        </div>
      </Section>

      {/* — 05 — */}
      <Section
        index="05 — Motion & form"
        title="Four curves, three speeds, one corner"
        ground="bone"
        lede={
          <>
            Motion is part of the identity here, not a finish applied
            afterwards. The curves are named for what they are for, and one of
            them exists only for colour — worth keeping, because it is the
            mistake everyone makes.
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          {EASES.map((e) => (
            <Panel key={e.token} title={e.token}>
              <p className="leading-relaxed text-(--muted)">{e.use}</p>
              <p className="type-mono mt-4 text-[0.8rem] text-(--faint)">
                {e.value}
              </p>
            </Panel>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-x-14 gap-y-6">
          {[
            ["--duration-fast", "200ms", "Hover, press, focus"],
            ["--duration-base", "500ms", "Entrances, sheet snaps"],
            ["--duration-slow", "900ms", "Chapter and ground crossings"],
          ].map(([token, value, use]) => (
            <div key={token}>
              <p className="type-label text-(--faint)">{token}</p>
              <p className="type-mono mt-1 text-[1.3rem] text-(--fg)">
                {value}
              </p>
              <p className="mt-1 text-[0.85rem] text-(--muted)">{use}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-(--line) pt-10">
          <h3 className="type-headline text-[1.3rem]">
            The corner is derived, not picked
          </h3>
          <p className="mt-4 max-w-[62ch] leading-relaxed text-(--muted)">
            A control sitting 4px inside a panel wants exactly the
            panel&apos;s corner less those 4px, or the two curves fight. That is
            the whole system: panel 22 and control 18 are one decision, not two.
            The product miniatures take the same corner at the same ratio, not
            the same pixel count — <code>--radius-mock</code> is the control
            halved and <code>--radius-mock-tag</code> is it quartered.
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-8">
            {[
              ["--radius-panel", "22px", 88],
              ["--radius-control", "18px", 88],
              ["--radius-mock", "9px", 56],
              ["--radius-mock-tag", "4.5px", 36],
            ].map(([token, value, size]) => (
              <figure key={token as string} className="m-0 text-center">
                <div
                  className="border border-(--line-strong) bg-(--surface)"
                  style={{
                    width: size as number,
                    height: size as number,
                    borderRadius: `var(${token})`,
                  }}
                />
                <figcaption className="type-label mt-3 text-(--faint)">
                  {value}
                </figcaption>
              </figure>
            ))}
            <figure className="m-0">
              <span className="inline-block rounded-(--radius-panel) border border-(--line) bg-(--surface) p-[4px]">
                <span className="type-label block rounded-(--radius-control) bg-signal px-6 py-3 text-bone">
                  Nested, 4px inset
                </span>
              </span>
              <figcaption className="type-label mt-3 text-(--faint)">
                The case it was solved for
              </figcaption>
            </figure>
          </div>
        </div>
      </Section>

      {/* — 06 — */}
      <Section
        index="06 — In use"
        title="Where the system shows its work"
        ground="ink"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <Panel title="App icon & favicon">
            <div className="flex items-center gap-5">
              <Tile size={64} />
              <Tile size={32} />
            </div>
            <p className="mt-5 leading-relaxed text-(--muted)">
              512 tile, rx 112.64, signal ground, bone mark. The outline is
              extracted from the font, never live type.
            </p>
          </Panel>
          <Panel title="Navigation">
            <p className="leading-relaxed text-(--muted)">
              The wordmark gathers to a lone P as the bar shrinks — its tail
              closes, so it keeps the wordmark&apos;s own weight — and the dot
              leaves the logo to walk to whichever chapter you are in. It
              returns home when the page returns to the top. On phones and
              portrait tablets the dot stays beside the P, because there are no
              menu items for it to travel to.
            </p>
          </Panel>
          <Panel title="Hairlines">
            <p className="leading-relaxed text-(--muted)">
              Every rule on the site is 1px at <code>--line</code>. Structure is
              drawn with hairlines and space, never with boxes, fills or
              shadows — the one exception being the product miniatures, which
              are depicting a different product.
            </p>
          </Panel>
        </div>

        <div className="mt-14 border-t border-(--line) pt-10">
          <h3 className="type-headline text-[1.3rem]">Voice</h3>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              [true, "Name the consequence, not the mechanism. A person receives money; they do not settle a ledger entry."],
              [false, "No invented metrics. Pixely is a real company; a placeholder figure becomes a claim the moment it ships."],
              [true, "State figures exactly or not at all. Tabular numerals, real values."],
              [false, "No exclamation, no “revolutionary”, no “seamless”."],
              [true, "One sentence, then stop. The display face does the emphasis; the copy does not need to."],
              [false, "No second accent colour introduced to make a slide look livelier."],
            ].map(([ok, line]) => (
              <p
                key={line as string}
                className="flex gap-3 leading-relaxed text-(--muted)"
              >
                <span
                  aria-hidden
                  className="type-mono shrink-0"
                  style={{
                    color: ok
                      ? "var(--color-positive)"
                      : "var(--color-negative)",
                  }}
                >
                  {ok ? "✓" : "✕"}
                </span>
                <span>{line}</span>
              </p>
            ))}
          </div>
        </div>
      </Section>

      <footer
        data-theme="ink"
        className="bg-theme px-6 py-14 text-theme sm:px-10 lg:px-14"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-6 border-t border-(--line) pt-10">
          <Wordmark size={22} />
          <p className="type-label text-(--faint)">
            Brand system · drawn with the shipped tokens
          </p>
        </div>
      </footer>
    </main>
  );
}
