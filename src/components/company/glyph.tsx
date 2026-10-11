/**
 * The drawing primitives the Company sheets are built from — the same ones
 * the navigation's drawings and the Identity sheet use: 1px hairlines in
 * currentColor, junction squares with a --bg hole punched under them, and
 * accent pulses on the glyph-flow clock (pathLength 100, so one dash is
 * one pulse per path and the loop has no seam). Every sheet is 480 × 360 and
 * mounts inside `.glyph-stage`, so it keeps the dropdown's own beat.
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

export function Hole({ x, y, size = 12 }: { x: number; y: number; size?: number }) {
  return (
    <rect
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      fill="var(--bg)"
    />
  );
}

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
      <Hole x={x} y={y} size={size + 3} />
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

/** The brand's square, on a hole so the route arrives at it and stops. */
export function Mark({ x, y, size = 10 }: { x: number; y: number; size?: number }) {
  return (
    <g>
      <Hole x={x} y={y} size={size + 4} />
      <rect
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        fill="var(--accent)"
      />
    </g>
  );
}

/** A hairline route with its traffic: the faint line is the road, the
 *  accent dash on top of it the pulse. `back` runs it the other way. */
export function Pulse({
  d,
  delay,
  dur = 4.2,
  dash = "10 90",
  back = false,
}: {
  d: string;
  delay: number;
  dur?: number;
  dash?: string;
  back?: boolean;
}) {
  return (
    <>
      <path d={d} stroke={LINE} strokeWidth="1" opacity="0.3" />
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

/** The joints a neighbouring sheet would meet, at the contract's ports. */
export function Ports() {
  return (
    <>
      {[90, 180, 270].map((y) => (
        <g key={y} opacity="0.5">
          <line x1="0" y1={y - 5} x2="0" y2={y + 5} stroke={LINE} strokeWidth="2" />
          <line x1="480" y1={y - 5} x2="480" y2={y + 5} stroke={LINE} strokeWidth="2" />
        </g>
      ))}
    </>
  );
}
