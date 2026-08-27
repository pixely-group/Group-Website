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
   Two origins now, facing each other, each going on leaving itself — and
   the square crossing between them, which is the reach the column is about
   rather than one point broadcasting at nothing. */
function SolutionsGlyph() {
  const arc = (sweep: 0 | 1) => `M0 -28 A 28 28 0 0 ${sweep} 0 28`;
  return (
    <Frame>
      {([
        { x: 30, sweep: 1 as const },
        { x: 210, sweep: 0 as const },
      ]).map((side) => (
        <g key={side.x} transform={`translate(${side.x} 42)`}>
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              className="glyph-ripple"
              d={arc(side.sweep)}
              stroke="var(--accent)"
              strokeWidth="1"
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
          <path d={arc(side.sweep)} stroke={LINE} strokeWidth="1" opacity="0.2" />
          <line x1="0" y1="-32" x2="0" y2="32" stroke={LINE} strokeWidth="1" opacity="0.3" />
        </g>
      ))}
      <line x1="30" y1="42" x2="210" y2="42" stroke={LINE} strokeWidth="1" opacity="0.14" />
      <g className="glyph-cross">
        <Mark x={30} y={42} />
      </g>
    </Frame>
  );
}

/* — Platform: what the network is, seen from above ————————————————
   Replaced outright: rails said the same thing as Product's routes, in the
   same direction, and two drawings that rhyme are one drawing used twice.

   This is the shape underneath instead — a ring of nodes attesting to a
   centre, each edge carrying its confirmation inwards. It moves toward a
   point rather than across the frame, which is the one direction none of
   the others use. */
function PlatformGlyph() {
  const cx = 120;
  const cy = 42;
  const ring = [0, 60, 120, 180, 240, 300].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      deg,
      x: +(cx + 76 * Math.cos(rad)).toFixed(1),
      y: +(cy + 30 * Math.sin(rad)).toFixed(1),
    };
  });
  return (
    <Frame>
      <ellipse cx={cx} cy={cy} rx="76" ry="30" stroke={LINE} strokeWidth="1" opacity="0.16" />
      {ring.map((node, i) => {
        const edge = `M${node.x} ${node.y} L${cx} ${cy}`;
        return (
          <g key={node.deg}>
            <path d={edge} stroke={LINE} strokeWidth="1" opacity="0.24" />
            <path
              className="glyph-flow"
              d={edge}
              pathLength={100}
              strokeDasharray="26 74"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={
                {
                  "--delay": `${i * 0.42}s`,
                  "--dur": "3s",
                } as React.CSSProperties
              }
            />
            <rect
              className="glyph-node"
              x={node.x - 2.5}
              y={node.y - 2.5}
              width="5"
              height="5"
              fill={LINE}
              opacity="0.5"
              style={{ "--i": i } as React.CSSProperties}
            />
          </g>
        );
      })}
      {/* The thing being attested to, and a hole for it to sit in. */}
      <rect x={cx - 7} y={cy - 7} width="14" height="14" fill="var(--bg)" />
      <Mark x={cx} y={cy} size={8} />
    </Frame>
  );
}

/* — Company: the meridian. A sphere on its axis ——————————————————
   The ellipse alone cannot say which way it is turning: narrowing and
   widening are the same picture in both directions. So a node rides its
   rim, carried by the same scale — it crosses right to left, keeps going
   through the far side, and comes back left to right. One turn, both ways
   across the face, and the square still runs the axis. */
function CompanyGlyph() {
  return (
    <Frame>
      <g transform="translate(120 42)">
        <circle r="30" stroke={LINE} strokeWidth="1" opacity="0.5" />
        <line x1="0" y1="-34" x2="0" y2="34" stroke={LINE} strokeWidth="1" opacity="0.5" />
        <line x1="-30" y1="0" x2="30" y2="0" stroke={LINE} strokeWidth="1" opacity="0.2" />
        <g className="glyph-turn">
          <ellipse rx="13" ry="30" stroke={LINE} strokeWidth="1" opacity="0.34" />
          <rect x={10.5} y={-2.5} width="5" height="5" fill={LINE} opacity="0.7" />
        </g>
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
