/**
 * The Platform pages' drawing primitives: IdentityGlyph's grammar, kept in one
 * place so the four sheets below it draw with the same hand.
 *
 * The contract is the one IdentityGlyph sets out for every fragment: a
 * 480 × 360 sheet, ports at y = 90, 180 and 270 on both edges, 1px hairline
 * routes in currentColor, junction squares with a --bg hole punched under
 * them, and the accent carried by the same glyph-flow / pathLength machinery
 * that runs the navigation's drawings — so a sheet ticks at the dropdown's
 * own beat.
 */

export const LINE = "currentColor";

export function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 480 360"
      className="glyph-stage block w-full text-(--line-strong)"
      fill="none"
      aria-hidden
      role="presentation"
    >
      {children}
    </svg>
  );
}

/** The joints a neighbouring sheet meets. */
export function Ports({ ys = [90, 180, 270] }: { ys?: number[] }) {
  return (
    <>
      {ys.map((y) => (
        <g key={y} opacity="0.5">
          <line x1="0" y1={y - 5} x2="0" y2={y + 5} stroke={LINE} strokeWidth="2" />
          <line x1="480" y1={y - 5} x2="480" y2={y + 5} stroke={LINE} strokeWidth="2" />
        </g>
      ))}
    </>
  );
}

export function Hole({
  x,
  y,
  w,
  h,
  rx = 0,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  rx?: number;
}) {
  const height = h ?? w;
  return (
    <rect
      x={x - w / 2}
      y={y - height / 2}
      width={w}
      height={height}
      rx={rx}
      fill="var(--bg)"
    />
  );
}

/** A stop on a route: the hole takes the arriving line, the outline breathes. */
export function Junction({
  x,
  y,
  i,
  size = 10,
}: {
  x: number;
  y: number;
  i: number;
  size?: number;
}) {
  return (
    <g>
      <Hole x={x} y={y} w={size + 3} />
      <rect
        className="glyph-node"
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        stroke={LINE}
        strokeWidth="1"
        opacity="0.6"
        style={{ "--i": i } as React.CSSProperties}
      />
    </g>
  );
}

/** The brand's square. */
export function Mark({ x, y, size = 8 }: { x: number; y: number; size?: number }) {
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

/** A route and the traffic on it: the faint line is the road, the accent
 *  copy on top of it is one pulse per trip, looping without a seam. */
export function Pulse({
  d,
  delay,
  dur = 4.2,
  dash = "10 90",
  back = false,
  base = 0.3,
}: {
  d: string;
  delay: number;
  dur?: number;
  dash?: string;
  back?: boolean;
  /** The road's own opacity; 0 draws the traffic alone. */
  base?: number;
}) {
  return (
    <>
      {base > 0 && <path d={d} stroke={LINE} strokeWidth="1" opacity={base} />}
      <path
        className={back ? "glyph-flow-back" : "glyph-flow"}
        d={d}
        pathLength={100}
        strokeDasharray={dash}
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ "--delay": `${delay}s`, "--dur": `${dur}s` } as React.CSSProperties}
      />
    </>
  );
}
