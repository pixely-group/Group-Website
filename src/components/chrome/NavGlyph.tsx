/**
 * A drawing for each sub-menu, in the language the rest of the site draws in:
 * hairlines, no fills, and one thing in the accent that moves.
 *
 * Built from primitives — lines, rects, circles, arcs — because that is what
 * SVG renders perfectly and because it is the same lesson the logo lab
 * learned the hard way. Each one says what its column is about rather than
 * decorating it: a signal running a rail of services, a scale being climbed,
 * two rails with a packet on them, a sphere on its axis, a sweep passing over
 * stacked sheets.
 *
 * The motion lives in globals.css, scoped to an open panel, so nothing here
 * animates while it is closed — and only ever one of these is mounted, since
 * the panel renders the open column alone.
 */

const LINE = "currentColor";

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

/* — Product: six services on one rail, with the signal running it —————— */
function ProductGlyph() {
  const stops = [24, 65, 106, 147, 188, 216];
  return (
    <Frame>
      <line x1="12" y1="42" x2="228" y2="42" stroke={LINE} strokeWidth="1" opacity="0.45" />
      {stops.map((x) => (
        <g key={x}>
          <rect x={x - 2.5} y="39.5" width="5" height="5" fill={LINE} opacity="0.4" />
          <line x1={x} y1="30" x2={x} y2="34" stroke={LINE} strokeWidth="1" opacity="0.22" />
        </g>
      ))}
      <g className="glyph-run">
        <line x1="-26" y1="42" x2="0" y2="42" stroke="var(--accent)" strokeWidth="1" opacity="0.35" />
        <Mark x={0} y={42} />
      </g>
    </Frame>
  );
}

/* — Solutions: first transaction to national scale ————————————————— */
function SolutionsGlyph() {
  const bars = [
    { x: 30, h: 14 },
    { x: 70, h: 26 },
    { x: 110, h: 38 },
    { x: 150, h: 50 },
    { x: 190, h: 62 },
  ];
  return (
    <Frame>
      <line x1="12" y1="70" x2="228" y2="70" stroke={LINE} strokeWidth="1" opacity="0.45" />
      {bars.map((bar, i) => (
        <g key={bar.x} className="glyph-rise" style={{ "--i": i } as React.CSSProperties}>
          <line
            x1={bar.x}
            y1="70"
            x2={bar.x}
            y2={70 - bar.h}
            stroke={LINE}
            strokeWidth="1"
            opacity={0.3 + i * 0.12}
          />
          <rect x={bar.x - 2} y={68 - bar.h} width="4" height="4" fill={LINE} opacity={0.4 + i * 0.1} />
        </g>
      ))}
      <g className="glyph-climb">
        <Mark x={190} y={8} />
      </g>
    </Frame>
  );
}

/* — Platform: two rails, and something moving on them ————————————— */
function PlatformGlyph() {
  return (
    <Frame>
      <line x1="12" y1="32" x2="228" y2="32" stroke={LINE} strokeWidth="1" opacity="0.45" />
      <line x1="12" y1="52" x2="228" y2="52" stroke={LINE} strokeWidth="1" opacity="0.45" />
      {Array.from({ length: 12 }, (_, i) => 20 + i * 18).map((x) => (
        <line key={x} x1={x} y1="32" x2={x} y2="52" stroke={LINE} strokeWidth="1" opacity="0.16" />
      ))}
      <g className="glyph-run">
        <Mark x={0} y={32} size={6} />
      </g>
      <g className="glyph-run-back">
        <Mark x={0} y={52} size={6} />
      </g>
    </Frame>
  );
}

/* — Company: the meridian. A sphere on its axis, turning ———————————— */
function CompanyGlyph() {
  return (
    <Frame>
      <g transform="translate(120 42)">
        <circle r="30" stroke={LINE} strokeWidth="1" opacity="0.5" />
        <line x1="0" y1="-34" x2="0" y2="34" stroke={LINE} strokeWidth="1" opacity="0.5" />
        <ellipse className="glyph-turn" rx="13" ry="30" stroke={LINE} strokeWidth="1" opacity="0.34" />
        <line x1="-30" y1="0" x2="30" y2="0" stroke={LINE} strokeWidth="1" opacity="0.2" />
        <g className="glyph-orbit">
          <Mark x={0} y={-30} size={6} />
        </g>
      </g>
    </Frame>
  );
}

/* — Resources: a sweep passing over stacked sheets ————————————————— */
function ResourcesGlyph() {
  return (
    <Frame>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={66 + i * 6}
          y={20 + i * 12}
          width="108"
          height="30"
          rx="5"
          stroke={LINE}
          strokeWidth="1"
          opacity={0.5 - i * 0.13}
        />
      ))}
      <line x1="78" y1="30" x2="130" y2="30" stroke={LINE} strokeWidth="1" opacity="0.3" />
      <line x1="78" y1="38" x2="112" y2="38" stroke={LINE} strokeWidth="1" opacity="0.22" />
      <g className="glyph-sweep">
        <line x1="52" y1="0" x2="52" y2="84" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
        <Mark x={52} y={42} size={6} />
      </g>
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
