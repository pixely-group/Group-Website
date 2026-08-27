/**
 * A drawing for each sub-menu, in the language the rest of the site draws in:
 * hairlines, no fills, and the accent doing the one thing that moves.
 *
 * Built from primitives — lines, arcs, rounded rects — because that is what
 * SVG renders perfectly, and the same lesson the logo lab learned the hard
 * way about drawing by hand.
 *
 * Everything loops seamlessly, which is a constraint on how they are drawn
 * rather than a setting. The flowing ones carry `pathLength={100}`: it
 * renormalises the path so a dash pattern of "16 84" is exactly one pulse per
 * path whatever the real arc length, and sliding the offset by a full 100
 * lands on the frame it started from. No hold at the end, no jump back to the
 * start — the seam is genuinely invisible rather than hidden at speed.
 *
 * The motion lives in globals.css, scoped to an open panel, so nothing runs
 * before it is looked at — and only one of these is ever mounted, since the
 * panel renders the open column alone.
 */

const LINE = "currentColor";
/** One pulse per path, wherever the offset happens to be. */
const PULSE = "16 84";

/** The brand's square, at the size these drawings are scaled to. */
function Mark({ x, y, size = 7 }: { x: number; y: number; size?: number }) {
  return (
    <rect
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      fill="var(--accent)"
    />
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 240 84"
      className="block w-full text-(--line-strong)"
      fill="none"
      aria-hidden
      role="presentation"
    >
      {children}
    </svg>
  );
}

/** A hairline route with a pulse running it. The faint line is the route; the
 *  accent copy on top of it is the traffic. */
function Route({
  d,
  delay,
  dur = 3.4,
}: {
  d: string;
  delay: number;
  dur?: number;
}) {
  return (
    <>
      <path d={d} stroke={LINE} strokeWidth="1" opacity="0.32" />
      <path
        className="glyph-flow"
        d={d}
        pathLength={100}
        strokeDasharray={PULSE}
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={
          {
            "--delay": `${delay}s`,
            "--dur": `${dur}s`,
          } as React.CSSProperties
        }
      />
    </>
  );
}

/* — Product: one platform, six services, traffic finding its way ——————
   Everything enters at one door and leaves by another; between them the
   fabric fans out and closes again. Three routes so the middle one can be
   the straight-through case and the outer two the ones that touch a
   service on the way. */
function ProductGlyph() {
  const top = "M20 42 C 62 42 62 14 104 14 L 136 14 C 178 14 178 42 220 42";
  const mid = "M20 42 L 220 42";
  const low = "M20 42 C 62 42 62 70 104 70 L 136 70 C 178 70 178 42 220 42";
  return (
    <Frame>
      <Route d={top} delay={0} />
      <Route d={mid} delay={1.15} />
      <Route d={low} delay={2.3} />
      {[
        [104, 14],
        [136, 14],
        [104, 70],
        [136, 70],
      ].map(([x, y], i) => (
        <rect
          key={`${x}-${y}`}
          className="glyph-node"
          x={x - 2.5}
          y={y - 2.5}
          width="5"
          height="5"
          fill={LINE}
          opacity="0.45"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      <line x1="120" y1="34" x2="120" y2="50" stroke={LINE} strokeWidth="1" opacity="0.18" />
      <Mark x={20} y={42} />
      <Mark x={220} y={42} />
    </Frame>
  );
}

/* — Solutions: first transaction to national scale ————————————————
   Rings leaving one point and going on leaving it. The reach is the
   subject, so the rings are the whole drawing and the origin is a single
   square. */
function SolutionsGlyph() {
  return (
    <Frame>
      <g transform="translate(34 42)">
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            className="glyph-ripple"
            d="M0 -30 A 30 30 0 0 1 0 30"
            stroke="var(--accent)"
            strokeWidth="1"
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}
        <path d="M0 -30 A 30 30 0 0 1 0 30" stroke={LINE} strokeWidth="1" opacity="0.2" />
        <line x1="0" y1="-34" x2="0" y2="34" stroke={LINE} strokeWidth="1" opacity="0.3" />
        <Mark x={0} y={0} />
      </g>
      {/* The far edge it is reaching for. */}
      <line
        x1="222"
        y1="12"
        x2="222"
        y2="72"
        stroke={LINE}
        strokeWidth="1"
        opacity="0.28"
        strokeDasharray="3 5"
      />
    </Frame>
  );
}

/* — Platform: the rails underneath ————————————————————————————————
   Three of them, carrying at their own speeds, with the ties between. The
   traffic is dashes flowing rather than a single object crossing, because a
   rail is a thing that is continuously busy. */
function PlatformGlyph() {
  const rails = [
    { y: 22, dur: 2.6, delay: 0 },
    { y: 42, dur: 3.6, delay: 0.5 },
    { y: 62, dur: 3.1, delay: 1.1 },
  ];
  return (
    <Frame>
      {Array.from({ length: 13 }, (_, i) => 16 + i * 17.4).map((x) => (
        <line key={x} x1={x} y1="22" x2={x} y2="62" stroke={LINE} strokeWidth="1" opacity="0.1" />
      ))}
      {rails.map((rail) => (
        <g key={rail.y}>
          <line x1="14" y1={rail.y} x2="226" y2={rail.y} stroke={LINE} strokeWidth="1" opacity="0.34" />
          <path
            className="glyph-flow"
            d={`M14 ${rail.y} L226 ${rail.y}`}
            pathLength={100}
            strokeDasharray="10 90"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={
              {
                "--delay": `${rail.delay}s`,
                "--dur": `${rail.dur}s`,
              } as React.CSSProperties
            }
          />
        </g>
      ))}
      <Mark x={14} y={42} size={6} />
      <Mark x={226} y={42} size={6} />
    </Frame>
  );
}

/* — Company: the meridian. A sphere on its axis, and the square running the
   axis rather than orbiting it — asked for, and better: the orbit read as a
   satellite, which is a different idea from a position held. */
function CompanyGlyph() {
  return (
    <Frame>
      <g transform="translate(120 42)">
        <circle r="30" stroke={LINE} strokeWidth="1" opacity="0.5" />
        <line x1="0" y1="-34" x2="0" y2="34" stroke={LINE} strokeWidth="1" opacity="0.5" />
        <ellipse className="glyph-turn" rx="13" ry="30" stroke={LINE} strokeWidth="1" opacity="0.34" />
        <line x1="-30" y1="0" x2="30" y2="0" stroke={LINE} strokeWidth="1" opacity="0.2" />
        <g className="glyph-bob">
          <Mark x={0} y={0} size={7} />
        </g>
      </g>
    </Frame>
  );
}

/* — Resources: secured, documented, governed ——————————————————————
   A seal with its perimeter continuously being walked, and the record it is
   drawn around. The walk is the governing; the lines inside are the thing
   governed. */
function ResourcesGlyph() {
  const seal = "M88 12 H152 A16 16 0 0 1 168 28 V56 A16 16 0 0 1 152 72 H88 A16 16 0 0 1 72 56 V28 A16 16 0 0 1 88 12 Z";
  return (
    <Frame>
      <path d={seal} stroke={LINE} strokeWidth="1" opacity="0.34" />
      <path
        className="glyph-flow"
        d={seal}
        pathLength={100}
        strokeDasharray="22 78"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ "--delay": "0s", "--dur": "5s" } as React.CSSProperties}
      />
      {[30, 38, 46, 54].map((y, i) => (
        <line
          key={y}
          className="glyph-node"
          x1="90"
          y1={y}
          x2={i % 2 === 0 ? 150 : 132}
          y2={y}
          stroke={LINE}
          strokeWidth="1"
          opacity="0.28"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      <Mark x={72} y={42} size={6} />
      <Mark x={168} y={42} size={6} />
    </Frame>
  );
}

const GLYPHS: Record<string, () => React.ReactElement> = {
  Product: ProductGlyph,
  Solutions: SolutionsGlyph,
  Platform: PlatformGlyph,
  Company: CompanyGlyph,
  Resources: ResourcesGlyph,
};

export default function NavGlyph({ heading }: { heading: string }) {
  const Glyph = GLYPHS[heading];
  return Glyph ? <Glyph /> : null;
}
