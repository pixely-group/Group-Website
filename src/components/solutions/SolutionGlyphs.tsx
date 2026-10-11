/**
 * The Solutions fragments of the Pixely drawing.
 *
 * Each audience page opens on a grown-up piece of the Solutions dropdown's
 * own drawing, cut to the same contract as the Identity sheet so the pieces
 * read as one machine:
 *
 *   - viewBox 480 × 360, one audience per sheet;
 *   - PORTS at y = 90, 180 and 270 on both edges, marked by notches, and any
 *     route that leaves the sheet leaves at one;
 *   - 1px hairline routes in currentColor, junction squares with a --bg hole
 *     punched under them, accent pulses on the glyph-flow/pathLength clock and
 *     the panel's own --beat;
 *   - one accent, and the brand's square where something begins or arrives.
 *
 * No labels and no numbers. The page's words say what each drawing is of;
 * the drawing only has to show how it moves.
 */

const LINE = "currentColor";

function Sheet({ children }: { children: React.ReactNode }) {
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
      {children}
    </svg>
  );
}

function Hole({ x, y, w, h = w }: { x: number; y: number; w: number; h?: number }) {
  return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="var(--bg)" />;
}

/** A stop on a route: the hole takes the line, the outline breathes. */
function Junction({ x, y, i, size = 10 }: { x: number; y: number; i: number; size?: number }) {
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
function Mark({ x, y, size = 9 }: { x: number; y: number; size?: number }) {
  return (
    <g>
      <Hole x={x} y={y} w={size + 4} />
      <rect x={x - size / 2} y={y - size / 2} width={size} height={size} fill="var(--accent)" />
    </g>
  );
}

/** A route and its traffic: the faint line is the road, the accent dash on
 *  top of it is what travels. `dashed` draws the road itself broken — a lane
 *  that is a rehearsal for the real one. */
function Route({
  d,
  delay,
  dur = 4.2,
  pulse = "10 90",
  dashed = false,
  quiet = false,
}: {
  d: string;
  delay: number;
  dur?: number;
  pulse?: string;
  dashed?: boolean;
  /** The road alone, with nothing on it yet. */
  quiet?: boolean;
}) {
  return (
    <>
      <path
        d={d}
        stroke={LINE}
        strokeWidth="1"
        opacity={dashed ? 0.45 : 0.3}
        strokeDasharray={dashed ? "3 5" : undefined}
      />
      {!quiet && (
        <path
          className="glyph-flow"
          d={d}
          pathLength={100}
          strokeDasharray={pulse}
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ "--delay": `${delay}s`, "--dur": `${dur}s` } as React.CSSProperties}
        />
      )}
    </>
  );
}

/** A rounded chamber with its perimeter continuously walked — the Resources
 *  seal grown up, as the Identity gate is. */
function Chamber({
  x,
  y,
  w,
  h,
  r = 20,
  delay = 0.6,
  dur = 7.2,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  delay?: number;
  dur?: number;
}) {
  return (
    <>
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={r + 2} fill="var(--bg)" />
      <rect x={x} y={y} width={w} height={h} rx={r} stroke={LINE} strokeWidth="1" opacity="0.55" />
      <rect
        className="glyph-flow"
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        pathLength={100}
        strokeDasharray="18 82"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ "--delay": `${delay}s`, "--dur": `${dur}s` } as React.CSSProperties}
      />
    </>
  );
}

/* — Startups: one integration, then the switch to live ———————————————
   The product arrives at the left port and meets one gate: the six services
   sit inside it, breathing in turn, because a team integrates the gate and
   not the six. Out of the gate the road is broken — the sandbox, simulated
   rails — until the review junction, where the switch lifts it onto the solid
   lane that leaves by the centre port. Above, the same gate's next lane,
   drawn and waiting: the second product on the same integration. */
export function StartupsGlyph() {
  const arrive = "M0 180 L 110 180";
  const sandbox = "M210 180 C 252 180 248 270 290 270 L 340 270";
  const live = "M340 270 C 392 270 388 180 440 180 L 480 180";
  const next = "M210 180 C 252 180 248 90 290 90 L 480 90";
  return (
    <Sheet>
      <Route d={arrive} delay={0} />
      <Route d={next} delay={0} quiet />
      <Route d={sandbox} delay={1.2} dashed pulse="14 86" />
      <Route d={live} delay={2.6} />

      <Chamber x={110} y={120} w={100} h={120} r={22} />
      {/* The six services, two by three, seated in the gate. */}
      {[150, 180, 210].flatMap((y, row) =>
        [145, 175].map((x, col) => (
          <rect
            key={`${x}-${y}`}
            className="glyph-node"
            x={x - 6}
            y={y - 6}
            width="12"
            height="12"
            stroke={LINE}
            strokeWidth="1"
            opacity="0.6"
            style={{ "--i": row * 2 + col } as React.CSSProperties}
          />
        )),
      )}

      <Junction x={110} y={180} i={0} />
      <Junction x={210} y={180} i={1} />
      <Junction x={340} y={90} i={2} />
      {/* The review: the one place the broken road becomes a solid one. */}
      <Junction x={340} y={270} i={3} size={12} />
      <Mark x={440} y={180} />
    </Sheet>
  );
}

/* — Enterprises: every entity, one ledger, one hand on it ————————————
   Four entities down the left, each with its accounts ruled inside, and
   each sending its traffic to the one ledger. Above the ledger the control
   plane: a single line with its approvals marked on it, reaching down into
   the ledger. Out of the ledger, the three ports — the banks already in
   place, still connected underneath. */
export function EnterprisesGlyph() {
  const entities = [66, 142, 218, 294];
  const into = [138, 162, 198, 222];
  return (
    <Sheet>
      {entities.map((y, i) => (
        <Route
          key={y}
          d={`M100 ${y} C 200 ${y} 200 ${into[i]} 300 ${into[i]}`}
          delay={i * 1.05}
        />
      ))}
      {/* Out to the banks underneath, by the three ports. */}
      <Route d="M400 150 C 440 150 440 90 480 90" delay={1.6} />
      <Route d="M400 180 L 480 180" delay={2.4} />
      <Route d="M400 210 C 440 210 440 270 480 270" delay={3.2} />

      {/* The control plane, and its reach into the ledger. */}
      <line x1="170" y1="40" x2="430" y2="40" stroke={LINE} strokeWidth="1" opacity="0.34" />
      <Route d="M350 40 L 350 100" delay={0.5} dur={3.6} pulse="24 76" />

      {entities.map((y, i) => (
        <g key={y}>
          <rect x="20" y={y - 22} width="80" height="44" rx="10" fill="var(--bg)" />
          <rect x="20" y={y - 22} width="80" height="44" rx="10" stroke={LINE} strokeWidth="1" opacity="0.5" />
          {[-7, 7].map((dy, j) => (
            <line
              key={dy}
              className="glyph-node"
              x1="34"
              y1={y + dy}
              x2={j === 0 ? 82 : 66}
              y2={y + dy}
              stroke={LINE}
              strokeWidth="1"
              opacity="0.3"
              style={{ "--i": i + j } as React.CSSProperties}
            />
          ))}
        </g>
      ))}

      <Chamber x={300} y={100} w={100} h={160} r={18} delay={1.2} dur={8} />
      {[124, 146, 168, 190, 212, 234].map((y, i) => (
        <line
          key={y}
          className="glyph-node"
          x1="318"
          y1={y}
          x2={i % 2 === 0 ? 382 : 366}
          y2={y}
          stroke={LINE}
          strokeWidth="1"
          opacity="0.3"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}

      {[210, 270].map((x, i) => (
        <Junction key={x} x={x} y={40} i={i} />
      ))}
      <Mark x={350} y={40} />
    </Sheet>
  );
}

/* — Platforms: collect, hold, split, pay out ———————————————————————
   Money arrives at all three ports and is collected at one junction. It
   rests in the hold — a chamber walked slowly, the reserve — then reaches
   the split, the brand's square, where the rule fans it out to every seller
   down the right, each landing on a stop of its own. */
export function PlatformsGlyph() {
  const sellers = [52, 116, 180, 244, 308];
  return (
    <Sheet>
      <Route d="M0 90 C 80 90 80 180 150 180" delay={0} />
      <Route d="M0 180 L 150 180" delay={1.4} />
      <Route d="M0 270 C 80 270 80 180 150 180" delay={2.8} />
      <Route d="M150 180 L 200 180" delay={0} quiet />
      <Route d="M290 180 L 330 180" delay={0} quiet />

      {sellers.map((y, i) => (
        <Route
          key={y}
          d={`M330 180 L 352 180 C 394 180 390 ${y} 432 ${y} L 452 ${y}`}
          delay={0.9 + i * 0.7}
          dur={3.8}
        />
      ))}
      {/* The middle payout carries on through the centre port: the next
          sheet picks it up there. */}
      <line x1="452" y1="180" x2="480" y2="180" stroke={LINE} strokeWidth="1" opacity="0.2" />

      <Chamber x={200} y={146} w={90} h={68} r={16} delay={0.4} dur={9} />
      {[170, 190].map((y, i) => (
        <line
          key={y}
          className="glyph-node"
          x1="222"
          y1={y}
          x2={i === 0 ? 268 : 252}
          y2={y}
          stroke={LINE}
          strokeWidth="1"
          opacity="0.3"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}

      <Junction x={150} y={180} i={0} />
      {sellers.map((y, i) => (
        <Junction key={y} x={452} y={y} i={i + 1} />
      ))}
      <Mark x={330} y={180} />
    </Sheet>
  );
}

/* — Financial teams: the close that never waits for month-end ———————
   Two columns of entries — what the bank says on the left, what the ledger
   says on the right — and between each pair the match, drawing itself on as
   it is made, holding while it is read, and travelling on. A beam walks down
   the rows the whole time: reconciliation as a standing property, not an
   event. Under it all, the month, ruled in days, with its traffic still
   running — and the close already waiting at the end of it. */
export function FinanceGlyph() {
  const rows = [72, 112, 152, 192, 232];
  const left = [130, 104, 142, 96, 120];
  const right = [124, 138, 98, 132, 108];
  return (
    <Sheet>
      {rows.map((y, i) => (
        <g key={y}>
          <line x1={190 - left[i]} y1={y} x2="190" y2={y} stroke={LINE} strokeWidth="1" opacity="0.3" />
          <line x1="290" y1={y} x2={290 + right[i]} y2={y} stroke={LINE} strokeWidth="1" opacity="0.3" />
          <line x1="190" y1={y} x2="290" y2={y} stroke={LINE} strokeWidth="1" opacity="0.12" />
          <path
            className="glyph-trace"
            d={`M190 ${y} L 290 ${y}`}
            pathLength={100}
            strokeDasharray="100 100"
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.85"
            style={{ "--delay": `${i * 1.3}s` } as React.CSSProperties}
          />
        </g>
      ))}
      {rows.map((y, i) => (
        <g key={y}>
          <Junction x={190} y={y} i={i} size={8} />
          <Junction x={290} y={y} i={i + 1} size={8} />
        </g>
      ))}

      {/* The beam, walking the rows. */}
      <line
        className="glyph-scan"
        x1="40"
        y1="56"
        x2="440"
        y2="56"
        stroke="var(--accent)"
        strokeWidth="1"
        opacity="0.45"
        style={{ "--sweep": "192px" } as React.CSSProperties}
      />

      {/* The month: in by the foot port's row, ruled in days, still moving. */}
      <Route d="M0 270 C 20 270 24 300 44 300 L 420 300" delay={0} dur={9} pulse="8 92" />
      {Array.from({ length: 31 }, (_, i) => 44 + i * 12.53).map((x) => (
        <line key={x} x1={x} y1="296" x2={x} y2="304" stroke={LINE} strokeWidth="1" opacity="0.22" />
      ))}
      <Mark x={432} y={300} />
    </Sheet>
  );
}
