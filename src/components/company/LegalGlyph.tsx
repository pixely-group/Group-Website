import { Hole, Junction, LINE, Mark, Ports, Pulse, Sheet } from "@/components/company/glyph";

/**
 * The Legal framework sheet: the Resources dropdown's seal, grown into a
 * register.
 *
 * The perimeter is walked continuously — the governing — and inside it the
 * thing governed is the page itself: four pillars, each opened by a junction,
 * and under each a line for every text it answers to. Payments carries
 * three; Identity one; Compliance and Algeria one each with its amendment
 * hung from it by a short rule at its left, the way the ledger below hangs
 * it. Traffic arrives at the seal from the left port and leaves by the
 * right, so the register sits on the route rather than beside it.
 */
type Line = { y: number; len: number; amends?: boolean };
const GROUPS: { head: number; lines: Line[] }[] = [
  {
    head: 106,
    lines: [
      { y: 106, len: 150 },
      { y: 122, len: 118 },
      { y: 138, len: 134 },
    ],
  },
  { head: 166, lines: [{ y: 166, len: 142 }] },
  {
    head: 194,
    lines: [
      { y: 194, len: 150 },
      { y: 210, len: 96, amends: true },
    ],
  },
  {
    head: 238,
    lines: [
      { y: 238, len: 128 },
      { y: 254, len: 96, amends: true },
    ],
  },
];

const SEAL = { x: 120, y: 64, w: 240, h: 232, r: 24 };
const TEXT_X = 166;

export default function LegalGlyph() {
  return (
    <Sheet>
      <Ports />
      <Pulse d={`M0 180 L ${SEAL.x} 180`} delay={0} dur={3.6} />
      <Pulse d={`M${SEAL.x + SEAL.w} 180 L 480 180`} delay={1.8} dur={3.6} />

      <Hole x={240} y={180} size={SEAL.w + 4} />
      <rect
        x={SEAL.x}
        y={SEAL.y}
        width={SEAL.w}
        height={SEAL.h}
        rx={SEAL.r}
        stroke={LINE}
        strokeWidth="1"
        opacity="0.55"
      />
      <rect
        className="glyph-flow"
        x={SEAL.x}
        y={SEAL.y}
        width={SEAL.w}
        height={SEAL.h}
        rx={SEAL.r}
        pathLength={100}
        strokeDasharray="16 84"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ "--delay": "0.6s", "--dur": "9s" } as React.CSSProperties}
      />

      {/* The register's spine. */}
      <line x1="146" y1="92" x2="146" y2="268" stroke={LINE} strokeWidth="1" opacity="0.14" />

      {GROUPS.map((group, g) => (
        <g key={group.head}>
          {group.lines.map((line, l) => {
            const x = line.amends ? TEXT_X + 16 : TEXT_X;
            return (
              <g key={line.y}>
                {line.amends && (
                  <line
                    x1={TEXT_X + 6}
                    y1={line.y - 12}
                    x2={TEXT_X + 6}
                    y2={line.y}
                    stroke={LINE}
                    strokeWidth="1"
                    opacity="0.3"
                  />
                )}
                <line
                  className="glyph-node"
                  x1={x}
                  y1={line.y}
                  x2={x + line.len}
                  y2={line.y}
                  stroke={LINE}
                  strokeWidth="1"
                  opacity="0.34"
                  style={{ "--i": g * 2 + l } as React.CSSProperties}
                />
              </g>
            );
          })}
          <Junction x={146} y={group.head} i={g} size={8} />
        </g>
      ))}

      <Mark x={SEAL.x} y={180} size={9} />
      <Mark x={SEAL.x + SEAL.w} y={180} size={9} />
    </Sheet>
  );
}
