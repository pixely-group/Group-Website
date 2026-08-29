/**
 * The Identity fragment of the Pixely drawing.
 *
 * THE PUZZLE. Every service page opens on a grown-up piece of the dropdown's
 * own drawing, and the pieces are cut to interlock: laid side by side they
 * assemble one continuous machine — the whole Pixely. The contract that
 * makes that work, for every fragment that follows this one:
 *
 *   - viewBox 480 × 360, one service per sheet.
 *   - PORTS at y = 90, 180 and 270 on both edges: any route that enters or
 *     leaves the sheet does it at a port, marked by a notch, so the next
 *     sheet's routes meet it exactly.
 *   - The dropdown's own grammar, enlarged: 1px hairline routes in
 *     currentColor, junction squares with a --bg hole punched under them,
 *     accent pulses driven by the same glyph-flow/pathLength machinery and
 *     the same --beat the panel keeps.
 *   - One accent; positive and negative only where they mean verdicts.
 *
 * This sheet: the fabric's traffic arrives from the left — the same three
 * routes the PLATFORM dropdown fans out — and meets the gate. Inside the
 * gate, the check: the reach-field arcs from the Solutions drawing, read
 * here as the person being recognised. What passes leaves by the right
 * port at centre, verified; what fails drops to the stop at the foot and
 * comes to rest. Payments' sheet will pick up the verified route at the
 * right port; that is the joint.
 */

const LINE = "currentColor";

function Hole({ x, y, size = 12 }: { x: number; y: number; size?: number }) {
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

function Junction({
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

function Pulse({
  d,
  delay,
  dur = 4.2,
  dash = "10 90",
  stroke = "var(--accent)",
}: {
  d: string;
  delay: number;
  dur?: number;
  dash?: string;
  stroke?: string;
}) {
  return (
    <>
      <path d={d} stroke={LINE} strokeWidth="1" opacity="0.3" />
      <path
        className="glyph-flow"
        d={d}
        pathLength={100}
        strokeDasharray={dash}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ "--delay": `${delay}s`, "--dur": `${dur}s` } as React.CSSProperties}
      />
    </>
  );
}

export default function IdentityGlyph() {
  /* The three arrivals — the dropdown's fabric, entering at the ports. */
  const inTop = "M0 90 C 90 90 100 180 190 180";
  const inMid = "M0 180 L 190 180";
  const inLow = "M0 270 C 90 270 100 180 190 180";
  /* The verified route, out by the centre port. */
  const outOk = "M290 180 L 480 180";

  return (
    <svg
      viewBox="0 0 480 360"
      className="glyph-stage block w-full text-(--line-strong)"
      fill="none"
      aria-hidden
      role="presentation"
    >
      {/* Port notches: the joints the neighbouring sheets meet. */}
      {[90, 180, 270].map((y) => (
        <g key={y} opacity="0.5">
          <line x1="0" y1={y - 5} x2="0" y2={y + 5} stroke={LINE} strokeWidth="2" />
          <line x1="480" y1={y - 5} x2="480" y2={y + 5} stroke={LINE} strokeWidth="2" />
        </g>
      ))}

      {/* Arrivals, each carrying its own pulse — the fabric's traffic. */}
      <Pulse d={inTop} delay={0} />
      <Pulse d={inMid} delay={1.4} />
      <Pulse d={inLow} delay={2.8} />

      {/* The verified route out. Slightly behind the arrivals, so a pulse
          reads as passing through the gate rather than teleporting. */}
      <Pulse d={outOk} delay={1.1} dur={4.2} />

      {/* The gate. The Resources seal grown to a chamber, its perimeter
          continuously walked — the check that never sleeps. */}
      <Hole x={240} y={180} size={104} />
      <rect
        x="190"
        y="130"
        width="100"
        height="100"
        rx="22"
        stroke={LINE}
        strokeWidth="1"
        opacity="0.55"
      />
      <rect
        className="glyph-flow"
        x="190"
        y="130"
        width="100"
        height="100"
        rx="22"
        pathLength={100}
        strokeDasharray="18 82"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ "--delay": "0.6s", "--dur": "7.2s" } as React.CSSProperties}
      />

      {/* Inside: the recognition. The Solutions reach-arcs, turned inward —
          three wavefronts reading the one at the centre, who is the brand's
          own square. */}
      {[14, 24, 34].map((r, i) => (
        <path
          key={r}
          className="glyph-node"
          d={`M${240 - r} 180 A ${r} ${r} 0 0 1 ${240 + r} 180`}
          stroke={LINE}
          strokeWidth="1"
          opacity={0.5 - i * 0.12}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      <rect x="236" y="176" width="8" height="8" fill="var(--accent)" />

      {/* Junctions where routes are worth marking: the merge before the
          gate, the verified exit, and the verdicts. */}
      <Junction x={190} y={180} i={0} />
      <Junction x={290} y={180} i={1} />
      {/* The verdicts wear their colours and stand steady — a verdict that
          breathed down to nothing would look unsure of itself. */}
      <g>
        <Hole x={480 - 90} y={180} size={13} />
        <rect
          x={480 - 95}
          y={175}
          width="10"
          height="10"
          stroke="var(--color-positive)"
          strokeWidth="1.2"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}
