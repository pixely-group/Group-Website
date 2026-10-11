import { Hole, Junction, LINE, Mark, Ports, Pulse, Sheet } from "@/components/platform/sheet";

/**
 * The Platform column's sheets: the navigation's PLATFORM drawing — rails,
 * ties, junctions, a switch — grown up, one idea per page. Each keeps the
 * sheet contract (see sheet.tsx), so laid beside the service fragments they
 * read as more of the same machine rather than illustrations of it.
 */

/* — Network: four services on one fabric ————————————————————————————
   The hub at the centre is the platform; the four stops at its corners are
   payments, identity, intelligence and compliance. Every stop is joined to
   the hub and to its neighbours, which is the whole point: nothing on the
   network talks to anything through a side door. Traffic arrives at the
   centre port and leaves by the far one, having passed through the hub. */
export function NetworkGlyph() {
  const nodes: [number, number][] = [
    [120, 90],
    [360, 90],
    [360, 270],
    [120, 270],
  ];
  const ring = "M120 90 L 360 90 L 360 270 L 120 270 Z";
  const spoke = ([x, y]: [number, number]) =>
    `M240 180 C 240 ${y}, ${(240 + x) / 2} ${y}, ${x} ${y}`;

  return (
    <Sheet>
      <Ports />

      {/* The ring between the four: the neighbours' own road. */}
      <path d={ring} stroke={LINE} strokeWidth="1" opacity="0.18" />
      <Pulse d={ring} delay={0.4} dur={9.6} dash="6 94" base={0} />

      {/* Each service's own way out, at the ports. */}
      <Pulse d="M0 90 L 120 90" delay={0.2} dur={3.6} dash="22 78" />
      <Pulse d="M0 270 L 120 270" delay={1.9} dur={3.6} dash="22 78" />
      <Pulse d="M360 90 L 480 90" delay={1.1} dur={3.6} dash="22 78" />
      <Pulse d="M360 270 L 480 270" delay={2.7} dur={3.6} dash="22 78" />

      {/* The spokes, hub outward — every service hears the hub. */}
      {nodes.map((n, i) => (
        <Pulse key={n.join()} d={spoke(n)} delay={i * 0.9} dur={3.6} dash="14 86" />
      ))}

      {/* The way through: in at the centre port, out by the far one. */}
      <Pulse d="M0 180 L 480 180" delay={0.6} dur={5.4} dash="8 92" base={0.22} />

      {/* The hub: the platform, its perimeter walked. */}
      <Hole x={240} y={180} w={76} rx={18} />
      <rect x="204" y="144" width="72" height="72" rx="16" stroke={LINE} strokeWidth="1" opacity="0.55" />
      <rect
        className="glyph-flow"
        x="204"
        y="144"
        width="72"
        height="72"
        rx="16"
        pathLength={100}
        strokeDasharray="18 82"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ "--delay": "0.3s", "--dur": "7.2s" } as React.CSSProperties}
      />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          className="glyph-node"
          x={240 - 10 - i * 7}
          y={180 - 10 - i * 7}
          width={20 + i * 14}
          height={20 + i * 14}
          rx={4 + i * 3}
          stroke={LINE}
          strokeWidth="1"
          opacity={0.42 - i * 0.12}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      <Mark x={240} y={180} />

      {nodes.map(([x, y], i) => (
        <Junction key={`${x}-${y}`} x={x} y={y} i={i + 1} size={14} />
      ))}
    </Sheet>
  );
}

/* — Rails: one instruction, the right road ——————————————————————————
   An instruction arrives at the centre port and meets the switch — the
   brand's square, where the route is chosen. From it the switches curve out
   to the rails: real-time settlement, interbank clearing, card, book and
   cross-border, each a road at its own pace, tied together by the
   sleepers the navigation's drawing lays under its own. */
const RAILS = [
  { y: 90, dur: 3.2, delay: 0.2 },
  { y: 135, dur: 4.4, delay: 1.3 },
  { y: 180, dur: 2.8, delay: 0.7 },
  { y: 225, dur: 3.8, delay: 2.1 },
  { y: 270, dur: 5.0, delay: 1.6 },
];

export function RailsGlyph() {
  const sw = { x: 104, y: 180 };
  const from = 196;

  return (
    <Sheet>
      <Ports />

      {/* The sleepers. */}
      {Array.from({ length: 12 }, (_, i) => from + 12 + i * 23.5).map((x) => (
        <line key={x} x1={x} y1="78" x2={x} y2="282" stroke={LINE} strokeWidth="1" opacity="0.08" />
      ))}

      <Pulse d={`M0 180 L ${sw.x} 180`} delay={0} dur={3.6} dash="24 76" />

      {RAILS.map((rail, i) => (
        <g key={rail.y}>
          {/* The switch to this rail. */}
          <Pulse
            d={`M${sw.x} ${sw.y} C ${sw.x + 46} ${sw.y}, ${from - 46} ${rail.y}, ${from} ${rail.y}`}
            delay={0.9 + i * 0.72}
            dur={3.6}
            dash="20 80"
            base={0.26}
          />
          {/* The rail itself, out to the edge. */}
          <Pulse
            d={`M${from} ${rail.y} L 480 ${rail.y}`}
            delay={rail.delay}
            dur={rail.dur}
            dash="12 88"
            base={0.34}
          />
        </g>
      ))}

      {RAILS.map((rail, i) => (
        <Junction key={rail.y} x={from} y={rail.y} i={i} />
      ))}
      {/* Junctions down the line, where a rail is worth marking. */}
      {[
        [300, 90],
        [372, 180],
        [336, 270],
      ].map(([x, y], i) => (
        <Junction key={`${x}-${y}`} x={x} y={y} i={i + 5} size={8} />
      ))}

      <Hole x={sw.x} y={sw.y} w={16} />
      <Mark x={sw.x} y={sw.y} size={10} />
    </Sheet>
  );
}

/* — Ledger: the chain, and the entry being added to it ——————————————
   Three records, each holding its lines, each joined to the last by a
   link — the hash. The traffic runs the length of the chain and shows only
   in the links, which is what a hash-linked record is: nothing between
   entries but the proof that they follow one another. The fourth record is
   still open. It waits on two hands — one route from above, one from
   below — and is not written until both have arrived. */
export function LedgerGlyph() {
  const W = 78;
  const H = 128;
  const xs = [44, 150, 256, 362];
  const top = 180 - H / 2;

  return (
    <Sheet>
      <Ports />

      {/* The chain's own route: it shows only where the records do not. */}
      <Pulse d="M0 180 L 480 180" delay={0} dur={4.8} dash="6 94" base={0.3} />

      {/* Dual control: two approvers, one route each, converging. */}
      <Pulse d={`M${xs[3] + W / 2} 26 L ${xs[3] + W / 2} ${top}`} delay={0.3} dur={3.6} dash="22 78" />
      <Pulse d={`M${xs[3] + W / 2} 334 L ${xs[3] + W / 2} ${top + H}`} delay={2.1} dur={3.6} dash="22 78" />

      {xs.map((x, i) => {
        const open = i === xs.length - 1;
        return (
          <g key={x}>
            <Hole x={x + W / 2} y={180} w={W + 2} h={H + 2} rx={12} />
            <rect
              className={open ? "glyph-node" : undefined}
              x={x}
              y={top}
              width={W}
              height={H}
              rx={11}
              stroke={LINE}
              strokeWidth="1"
              strokeDasharray={open ? "4 4" : undefined}
              opacity={open ? 0.7 : 0.55}
              style={open ? ({ "--i": 0 } as React.CSSProperties) : undefined}
            />
            {/* The record's lines. The open one has only its first. */}
            {[0, 1, 2, 3, 4].slice(0, open ? 1 : 5).map((r) => (
              <line
                key={r}
                className="glyph-node"
                x1={x + 14}
                y1={top + 28 + r * 17}
                x2={x + (r % 2 === 0 ? W - 14 : W - 30)}
                y2={top + 28 + r * 17}
                stroke={LINE}
                strokeWidth="1"
                opacity="0.3"
                style={{ "--i": i + r } as React.CSSProperties}
              />
            ))}
            {/* The hash this record carries forward, at its foot. */}
            {!open && (
              <rect
                x={x + W - 22}
                y={top + H - 22}
                width="8"
                height="8"
                stroke={LINE}
                strokeWidth="1"
                opacity="0.5"
              />
            )}
          </g>
        );
      })}

      {/* The links: the hash, from one record to the next. */}
      {xs.slice(0, -1).map((x, i) => (
        <Junction key={x} x={x + W + (xs[1] - xs[0] - W) / 2} y={180} i={i + 1} size={8} />
      ))}

      {/* The two hands. */}
      <Junction x={xs[3] + W / 2} y={26} i={2} size={10} />
      <Junction x={xs[3] + W / 2} y={334} i={3} size={10} />
      <Mark x={xs[3] + W / 2} y={180} />
    </Sheet>
  );
}

/* — Security: five plates between intent and settlement ———————————————
   The request comes in at the top as the brand's square and falls through
   each plate in order — application, identity, policy, ledger, rails —
   meeting a junction at every one, and arrives at the foot as settlement.
   Any plate could stop it; the drawing shows the one trip that is allowed
   all the way down. */
export function SecurityGlyph() {
  const ys = [72, 126, 180, 234, 288];
  const route = "M240 18 L 240 342";

  return (
    <Sheet>
      {/* The sides of the stack: the request's own reach. */}
      {[96, 384].map((x) => (
        <line key={x} x1={x} y1={ys[0]} x2={x} y2={ys[ys.length - 1]} stroke={LINE} strokeWidth="1" opacity="0.12" />
      ))}

      <Pulse d={route} delay={0} dur={4.6} dash="9 91" base={0.32} />

      {ys.map((y, i) => (
        <g key={y}>
          <rect
            x={96}
            y={y - 15}
            width={288}
            height={30}
            rx={8}
            fill="var(--bg)"
            stroke={LINE}
            strokeWidth="1"
            opacity={0.62 - i * 0.04}
          />
          {/* The plate's face: its rules, either side of the way through. */}
          {[0, 1].map((side) => (
            <line
              key={side}
              className="glyph-node"
              x1={side === 0 ? 116 : 270}
              y1={y}
              x2={side === 0 ? 210 : i % 2 ? 330 : 364}
              y2={y}
              stroke={LINE}
              strokeWidth="1"
              opacity="0.28"
              style={{ "--i": i + side } as React.CSSProperties}
            />
          ))}
        </g>
      ))}

      {/* The way through each plate: a gap in it, marked as a junction. */}
      {ys.map((y, i) => (
        <Junction key={y} x={240} y={y} i={i} size={10} />
      ))}

      {/* One plate's edge walked: the policy layer, the one that refuses. */}
      <rect
        className="glyph-flow"
        x={96}
        y={ys[2] - 15}
        width={288}
        height={30}
        rx={8}
        pathLength={100}
        strokeDasharray="14 86"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ "--delay": "0.8s", "--dur": "7.2s" } as React.CSSProperties}
      />

      <Hole x={240} y={18} w={12} />
      <Mark x={240} y={18} />
      <g>
        <Hole x={240} y={342} w={14} />
        <rect
          x={235}
          y={337}
          width="10"
          height="10"
          stroke="var(--color-positive)"
          strokeWidth="1.2"
          opacity="0.85"
        />
      </g>
    </Sheet>
  );
}
