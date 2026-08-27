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
   service on the way.

   Two nodes, one on each outer route, sitting at the middle of its flat
   run — where the pulse is travelling straight and the node reads as a
   stop on the line rather than a speck beside it. They are drawn last, so
   the pulse passes behind them. */
function ProductGlyph() {
  const top = "M20 42 C 62 42 62 14 104 14 L 136 14 C 178 14 178 42 220 42";
  const mid = "M20 42 L 220 42";
  const low = "M20 42 C 62 42 62 70 104 70 L 136 70 C 178 70 178 42 220 42";
  return (
    <Frame>
      <Route d={top} delay={0} />
      <Route d={mid} delay={1.15} />
      <Route d={low} delay={2.3} />
      <line x1="120" y1="34" x2="120" y2="50" stroke={LINE} strokeWidth="1" opacity="0.18" />
      {[14, 70].map((y) => (
        <g key={y}>
          {/* A hole in the route, so the line stops at the node instead of
              running under it and out the far side. */}
          <rect x={116} y={y - 4} width="8" height="8" fill="var(--bg)" />
          <rect
            x={116.5}
            y={y - 3.5}
            width="7"
            height="7"
            stroke={LINE}
            strokeWidth="1"
            opacity="0.75"
          />
        </g>
      ))}
      <Mark x={20} y={42} />
      <Mark x={220} y={42} />
    </Frame>
  );
}

/* — Solutions: first transaction to national scale ————————————————
   Two origins facing each other, each going on leaving itself, and the
   square crossing between them.

   The weave is six wavefronts a side rather than four, alternating deep and
   shallow so they read as a wave train with a shape to it instead of one
   arc scaled six times. Odd fronts run wider and fainter, even ones tighter
   and brighter, and the pair of banks meets in the middle where the square
   is crossing. */
function SolutionsGlyph() {
  const arc = (sweep: 0 | 1, rx: number) =>
    `M0 -30 A ${rx} 30 0 0 ${sweep} 0 30`;
  const fronts = [0, 1, 2, 3, 4, 5];
  return (
    <Frame>
      {([
        { x: 26, sweep: 1 as const },
        { x: 214, sweep: 0 as const },
      ]).map((side) => (
        <g key={side.x} transform={`translate(${side.x} 42)`}>
          {fronts.map((i) => (
            <path
              key={i}
              className="glyph-ripple"
              d={arc(side.sweep, i % 2 ? 20 : 30)}
              stroke="var(--accent)"
              strokeWidth={i % 2 ? 1 : 1.2}
              opacity={i % 2 ? 0.55 : 1}
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
          <path d={arc(side.sweep, 30)} stroke={LINE} strokeWidth="1" opacity="0.22" />
          <line x1="0" y1="-33" x2="0" y2="33" stroke={LINE} strokeWidth="1" opacity="0.34" />
        </g>
      ))}
      <line x1="26" y1="42" x2="214" y2="42" stroke={LINE} strokeWidth="1" opacity="0.12" />
      <g className="glyph-cross">
        <Mark x={26} y={42} />
      </g>
    </Frame>
  );
}

/* — Platform: the rails underneath ————————————————————————————————
   The rails again, with more on them. Three roads at their own speeds and
   the ties between; the outer two run one way and the middle runs back, so
   the drawing has traffic rather than a current. Junctions where a rail is
   worth marking, and a switch curving between the top two — the one place
   something can change lines, which is what a junction is for. */
function PlatformGlyph() {
  const rails = [
    { y: 20, dur: 3.2, delay: 0, back: false },
    { y: 42, dur: 2.4, delay: 0.7, back: true },
    { y: 64, dur: 3.8, delay: 1.3, back: false },
  ];
  const switchPath = "M96 20 C 116 20 116 42 136 42";
  return (
    <Frame>
      {Array.from({ length: 15 }, (_, i) => 16 + i * 15.1).map((x) => (
        <line key={x} x1={x} y1="20" x2={x} y2="64" stroke={LINE} strokeWidth="1" opacity="0.08" />
      ))}

      {rails.map((rail) => (
        <g key={rail.y}>
          <line x1="14" y1={rail.y} x2="226" y2={rail.y} stroke={LINE} strokeWidth="1" opacity="0.34" />
          <path
            className={rail.back ? "glyph-flow-back" : "glyph-flow"}
            d={`M14 ${rail.y} L226 ${rail.y}`}
            pathLength={100}
            strokeDasharray="12 88"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={
              { "--delay": `${rail.delay}s`, "--dur": `${rail.dur}s` } as React.CSSProperties
            }
          />
        </g>
      ))}

      {/* The switch: the one place a line can change lines. */}
      <path d={switchPath} stroke={LINE} strokeWidth="1" opacity="0.3" />
      <path
        className="glyph-flow"
        d={switchPath}
        pathLength={100}
        strokeDasharray="30 70"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ "--delay": "1.9s", "--dur": "4.2s" } as React.CSSProperties}
      />

      {/* Junctions, on the rails rather than beside them. */}
      {[
        [60, 20],
        [96, 20],
        [136, 42],
        [180, 64],
      ].map(([x, y], i) => (
        <g key={`${x}-${y}`}>
          <rect x={x - 4} y={y - 4} width="8" height="8" fill="var(--bg)" />
          <rect
            className="glyph-node"
            x={x - 3.5}
            y={y - 3.5}
            width="7"
            height="7"
            stroke={LINE}
            strokeWidth="1"
            opacity="0.6"
            style={{ "--i": i } as React.CSSProperties}
          />
        </g>
      ))}

      <Mark x={14} y={42} size={6} />
      <Mark x={226} y={42} size={6} />
    </Frame>
  );
}

/* — Company: the meridian. A sphere on its axis ——————————————————
   One meridian, not a whole ellipse. That is the entire difference and it is
   the reason the turn was invisible before: an ellipse carries both of its
   arcs, so scaling it to -1 draws exactly the same picture as scaling it to
   1, and the left half of the journey was already on screen. A single arc
   has a side. It bulges right, flattens through the axis, bulges left, and
   comes back — the same gesture on both sides, going round rather than
   turning back at the middle.

   The square still runs the axis. */
function CompanyGlyph() {
  return (
    <Frame>
      <g transform="translate(120 42)">
        <circle r="30" stroke={LINE} strokeWidth="1" opacity="0.5" />
        <line x1="0" y1="-34" x2="0" y2="34" stroke={LINE} strokeWidth="1" opacity="0.5" />
        <line x1="-30" y1="0" x2="30" y2="0" stroke={LINE} strokeWidth="1" opacity="0.2" />
        <path
          className="glyph-turn"
          d="M0 -30 A 13 30 0 0 1 0 30"
          stroke={LINE}
          strokeWidth="1"
          opacity="0.42"
        />
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
