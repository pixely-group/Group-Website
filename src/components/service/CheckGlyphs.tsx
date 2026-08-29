/**
 * The five checks, drawn.
 *
 * One drawing per verification technology, in the sub-menu glyphs' own
 * language grown to stage size: hairline geometry in currentColor, the
 * accent reserved for whatever travels, junction squares breathing over
 * punched --bg holes, and every loop seamless on the shared --beat. Each
 * one is a working diagram of its check — the scene as it actually
 * happens, not an icon standing near it:
 *
 *   MRZ        — the national ID flipped to its back: the TD1 zone is
 *                three lines there, and the beam walks all three.
 *   OCR        — an open passport under the capture frame, stamp and
 *                spread and all, its print lifting off into fields.
 *   NFC        — the tap as it really works: the phone lying ON the
 *                document, the near field rippling around the overlap,
 *                progress on the screen while the chip answers.
 *   Liveness   — the selfie: the face inside the phone's own oval
 *                guide, read top to bottom — and it blinks.
 *   Face match — the card's portrait against the face in the phone,
 *                the comparison circulating between them.
 *
 * Fidelity comes from layering, not shading: objects overlap by filling
 * with --bg and redrawing their outline, the way the junction squares
 * have always punched holes in the routes beneath them.
 *
 * All of them run under `.glyph-stage`, so they keep the drop-down's
 * clock and sit inside the same reduced-motion gate.
 */

const VIEW = "0 0 420 300";

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
  size = 8,
}: {
  x: number;
  y: number;
  i: number;
  size?: number;
}) {
  return (
    <g>
      <Hole x={x} y={y} size={size + 4} />
      <rect
        className="glyph-node"
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
        style={{ "--i": i } as React.CSSProperties}
      />
    </g>
  );
}

/** A travelling pulse over its own faint rail. */
function Pulse({
  d,
  delay = 0,
  dur = 7.2,
  dash = "10 90",
  back = false,
}: {
  d: string;
  delay?: number;
  dur?: number;
  dash?: string;
  back?: boolean;
}) {
  return (
    <>
      <path d={d} stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path
        className={back ? "glyph-flow-back" : "glyph-flow"}
        d={d}
        pathLength={100}
        strokeDasharray={dash}
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={
          { "--delay": `${delay}s`, "--dur": `${dur}s` } as React.CSSProperties
        }
      />
    </>
  );
}

/** The capture reticle: four corners of a frame that is looking. */
function Corners({
  x,
  y,
  w,
  h,
  arm = 16,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  arm?: number;
}) {
  const c = [
    `M${x} ${y + arm} V${y} H${x + arm}`,
    `M${x + w - arm} ${y} H${x + w} V${y + arm}`,
    `M${x + w} ${y + h - arm} V${y + h} H${x + w - arm}`,
    `M${x + arm} ${y + h} H${x} V${y + h - arm}`,
  ];
  return (
    <g opacity="0.5">
      {c.map((d) => (
        <path key={d} d={d} stroke="currentColor" strokeWidth="1" />
      ))}
    </g>
  );
}

/** A portrait as documents print one: window, head, shoulders. */
function Portrait({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const cx = x + w / 2;
  const r = w * 0.21;
  const cy = y + h * 0.36;
  return (
    <g opacity="0.45">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth="1" />
      <path
        d={`M${x + w * 0.16} ${y + h * 0.92} C ${x + w * 0.28} ${y + h * 0.62}, ${x + w * 0.72} ${y + h * 0.62}, ${x + w * 0.84} ${y + h * 0.92}`}
        stroke="currentColor"
        strokeWidth="1"
      />
    </g>
  );
}

/** A phone, drawn solid over whatever it covers: body, punch-hole, home
 *  indicator. The --bg fill is the physics — it is lying on top. */
function Phone({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="20" fill="var(--bg)" />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="20"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <circle
        cx={x + w / 2}
        cy={y + 16}
        r="2.5"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <line
        x1={x + w / 2 - 16}
        y1={y + h - 12}
        x2={x + w / 2 + 16}
        y2={y + h - 12}
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
    </g>
  );
}

/** One line of machine text: the character cells, and the chevrons the
 *  format pads itself with. */
function MrzLine({
  x1,
  x2,
  y,
  chevrons,
}: {
  x1: number;
  x2: number;
  y: number;
  chevrons: number[];
}) {
  return (
    <g>
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="4 3.5"
        opacity="0.3"
      />
      {chevrons.map((x) => (
        <path
          key={x}
          d={`M${x + 4} ${y - 4} L${x} ${y} L${x + 4} ${y + 4}`}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}
    </g>
  );
}

const stage = "glyph-stage block w-full text-(--line-strong)";

/* ————————————————————————————————————————
   MRZ — the national ID, flipped. The front peeks out from behind; the
   back is up, because that is where a TD1 card keeps its three lines.
   The beam walks them in order; the check digits breathe at the ends.
   ———————————————————————————————————————— */
export function MrzGlyph() {
  return (
    <svg viewBox={VIEW} className={stage} fill="none" aria-hidden>
      {/* The front of the card, already read, resting behind. */}
      <g opacity="0.35">
        <rect
          x="52"
          y="48"
          width="180"
          height="116"
          rx="12"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="66"
          y1="66"
          x2="150"
          y2="66"
          stroke="currentColor"
          strokeWidth="1"
        />
        <rect
          x="66"
          y="78"
          width="42"
          height="52"
          rx="4"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="87" cy="97" r="9" stroke="currentColor" strokeWidth="1" />
        <path
          d="M73 126 C 78 112, 96 112, 101 126"
          stroke="currentColor"
          strokeWidth="1"
        />
        {[80, 94, 108].map((y) => (
          <line
            key={y}
            x1="118"
            y1={y}
            x2={y === 94 ? 196 : 214}
            y2={y}
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
        {/* The chip lives on the front — NFC's chapter of the same card. */}
        <rect
          x="118"
          y="122"
          width="24"
          height="18"
          rx="3"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M126 122 V 140 M118 131 H 142"
          stroke="currentColor"
          strokeWidth="1"
        />
      </g>

      {/* The back, up under the reader. */}
      <rect x="118" y="98" width="234" height="152" rx="12" fill="var(--bg)" />
      <rect
        x="118"
        y="98"
        width="234"
        height="152"
        rx="12"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <Corners x={106} y={86} w={258} h={176} />
      {/* Signature strip and the card's own small print. */}
      <line
        x1="136"
        y1="124"
        x2="230"
        y2="124"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="4 3"
        opacity="0.3"
      />
      {[
        [140, 250, 334],
        [154, 250, 316],
      ].map(([y, x1, x2]) => (
        <line
          key={y}
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}
      {/* TD1: three lines of thirty characters. */}
      <MrzLine x1={136} x2={320} y={182} chevrons={[236, 244]} />
      <MrzLine x1={136} x2={320} y={202} chevrons={[276, 284, 292]} />
      <MrzLine x1={136} x2={320} y={222} chevrons={[188, 196]} />
      {/* The reader's pass, line by line. */}
      <Pulse d="M136 182 H 320" delay={0} />
      <Pulse d="M136 202 H 320" delay={2.4} />
      <Pulse d="M136 222 H 320" delay={4.8} />
      {/* The check digits: the characters that catch the forger. */}
      <Junction x={334} y={182} i={0} size={7} />
      <Junction x={334} y={202} i={1} size={7} />
      <Junction x={334} y={222} i={2} size={7} />
    </svg>
  );
}

/* ————————————————————————————————————————
   OCR — an open passport under the capture frame: spine, stamp, photo
   page and all. The beam sweeps the spread; what it reads lifts off the
   page and lands as structured fields.
   ———————————————————————————————————————— */
export function OcrGlyph() {
  return (
    <svg viewBox={VIEW} className={stage} fill="none" aria-hidden>
      {/* The pages underneath the open pair. */}
      <rect
        x="56"
        y="68"
        width="236"
        height="170"
        rx="10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.22"
      />
      {/* The spread. */}
      <rect x="48" y="60" width="236" height="170" rx="10" fill="var(--bg)" />
      <rect
        x="48"
        y="60"
        width="236"
        height="170"
        rx="10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      {/* The spine, stitched. */}
      <line
        x1="166"
        y1="60"
        x2="166"
        y2="230"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <line
        x1="166"
        y1="70"
        x2="166"
        y2="220"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="2 5"
        opacity="0.25"
      />
      {/* Photo page: portrait, data, and the passport's two machine lines. */}
      <Portrait x={62} y={80} w={44} h={56} />
      {[
        [88, 152],
        [102, 140],
        [116, 152],
      ].map(([y, x2]) => (
        <line
          key={y}
          x1="114"
          y1={y}
          x2={x2}
          y2={y}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}
      <MrzLine x1={60} x2={154} y={198} chevrons={[128]} />
      <MrzLine x1={60} x2={154} y={212} chevrons={[100, 108]} />
      {/* The facing page: print, breathing in reading order as the beam
          passes, and the entry stamp nobody centres properly. */}
      {[
        [88, 268],
        [104, 252],
        [120, 262],
        [136, 244],
      ].map(([y, x2], i) => (
        <line
          key={y}
          className="glyph-node"
          x1="182"
          y1={y}
          x2={x2}
          y2={y}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.35"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      <g opacity="0.35" transform="rotate(-8 232 184)">
        <circle
          cx="232"
          cy="184"
          r="24"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <circle cx="232" cy="184" r="16" stroke="currentColor" strokeWidth="1" />
        <line
          x1="222"
          y1="184"
          x2="242"
          y2="184"
          stroke="currentColor"
          strokeWidth="1"
        />
      </g>
      <Corners x={38} y={50} w={256} h={190} />
      {/* The beam. */}
      <line
        className="glyph-scan"
        x1="52"
        y1="72"
        x2="280"
        y2="72"
        stroke="var(--accent)"
        strokeWidth="1.5"
        opacity="0.8"
        style={{ "--sweep": "146px" } as React.CSSProperties}
      />
      {/* What was read, leaving the page for the fields it lands in. */}
      <Pulse d="M284 100 C 300 96, 302 95, 314 94" delay={0.9} dur={3.6} />
      <Pulse d="M284 145 C 300 145, 302 146, 314 147" delay={2.1} dur={3.6} />
      <Pulse d="M284 190 C 300 196, 302 198, 314 200" delay={3.3} dur={3.6} />
      {[81, 134, 187].map((y, i) => (
        <g key={y}>
          <rect
            x="314"
            y={y}
            width="82"
            height="26"
            rx="6"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.45"
          />
          <line
            x1="326"
            y1={y + 13}
            x2={378 - i * 10}
            y2={y + 13}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />
          <Junction x={314} y={y + 13} i={i} size={7} />
        </g>
      ))}
    </svg>
  );
}

/* ————————————————————————————————————————
   NFC — the tap as it happens in the hand: the phone lying on the
   document, because near field means near. The chip pulses under the
   overlap, the field ripples around the two of them, and the screen
   shows the read running until the state's key has answered.
   ———————————————————————————————————————— */
export function NfcGlyph() {
  return (
    <svg viewBox={VIEW} className={stage} fill="none" aria-hidden>
      {/* The document, flat on the table. */}
      <rect
        x="56"
        y="92"
        width="212"
        height="136"
        rx="14"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <Portrait x={72} y={112} w={40} h={50} />
      {[
        [122, 196],
        [138, 180],
      ].map(([y, x2]) => (
        <line
          key={y}
          x1="122"
          y1={y}
          x2={x2}
          y2={y}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}
      {/* The chip: contact plate with the brand's square at its heart,
          breathing — it is the thing transmitting. It sits half-tucked
          under the phone's edge, because that is where the antenna is. */}
      <rect
        x="186"
        y="156"
        width="34"
        height="28"
        rx="4"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <path
        d="M197 156 V 184 M209 156 V 184 M186 170 H 220"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <rect
        className="glyph-node"
        x="197"
        y="166"
        width="8"
        height="8"
        fill="var(--accent)"
        style={{ "--i": 0 } as React.CSSProperties}
      />
      {/* MRZ at the document's foot, under the phone by the end. */}
      <MrzLine x1={70} x2={252} y={210} chevrons={[178, 186]} />

      {/* The phone, on the document. The fill is the physics. */}
      <Phone x={216} y={36} w={102} h={226} />
      {/* On screen: the read, running. */}
      <Pulse d="M238 96 H 296" dash="24 76" dur={3.6} />
      {[
        [118, 284],
        [130, 272],
        [142, 280],
      ].map(([y, x2]) => (
        <line
          key={y}
          x1="238"
          y1={y}
          x2={x2}
          y2={y}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}
      {/* Signature verified: the issuing state's own key answered. */}
      <g>
        <Hole x={267} y={190} size={16} />
        <rect
          x="262"
          y="185"
          width="10"
          height="10"
          stroke="var(--color-positive)"
          strokeWidth="1.2"
          opacity="0.85"
        />
      </g>

      {/* The near field: rippling out of the contact point, over card and
          phone alike — the antenna is lying on the chip. */}
      {[24, 42, 60].map((r, i) => (
        <circle
          key={r}
          className="glyph-node"
          cx="218"
          cy="170"
          r={r}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.4"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

/* ————————————————————————————————————————
   Liveness — the biometric scan itself. The face sits in the phone's
   oval guide with the reader's arc orbiting it; the template is taken as
   a mesh — seven landmarks joined by a perimeter and two struts through
   the nose, the topology lifted from the reference — drawing itself on,
   holding while it is read, erasing through and coming back. The nodes
   breathe in reading order, the eyes still blink, and the pill below
   carries the drawn tick the whole site uses for a verdict.
   ———————————————————————————————————————— */

/* The template's graph, in reading order: forehead, left temple, left
   cheek, chin, right jaw, right cheek, nose. */
const FACE_NODES: [number, number][] = [
  [210, 96],
  [177, 111],
  [185, 149],
  [207, 177],
  [231, 181],
  [243, 158],
  [209, 133],
];
const FACE_MESH = [
  /* The perimeter walk. */
  "M210 96 L177 111 L185 149 L207 177 L231 181 L243 158",
  /* Temple to cheek, through the nose. */
  "M177 111 L209 133 L243 158",
  /* Forehead to chin, through the nose. */
  "M210 96 L209 133 L207 177",
];

export function LivenessGlyph() {
  return (
    <svg viewBox={VIEW} className={stage} fill="none" aria-hidden>
      <Phone x={148} y={30} w={124} h={240} />
      {/* The guide: fit the oval. */}
      <ellipse
        cx="210"
        cy="140"
        rx="46"
        ry="58"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 4"
        opacity="0.4"
      />
      {/* The reader, orbiting it. */}
      <path
        className="glyph-flow"
        d="M210 82 A46 58 0 1 1 210 198 A46 58 0 1 1 210 82"
        pathLength={100}
        strokeDasharray="16 84"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ "--dur": "7.2s" } as React.CSSProperties}
      />
      {/* The face, and the shoulders that keep it a person. */}
      <ellipse
        cx="210"
        cy="140"
        rx="35"
        ry="45"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <path
        d="M172 232 C 184 204, 236 204, 248 232"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Features. The eyes carry the argument. */}
      <line
        className="glyph-blink"
        x1="193"
        y1="129"
        x2="203"
        y2="129"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <line
        className="glyph-blink"
        x1="217"
        y1="129"
        x2="227"
        y2="129"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M200 165 C 206 169, 214 169, 220 165"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      {/* The template, taken: the mesh draws on, holds, erases through. */}
      {FACE_MESH.map((d, i) => (
        <path
          key={d}
          className="glyph-trace"
          d={d}
          pathLength={100}
          strokeDasharray="100 100"
          stroke="var(--accent)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
          style={{ "--delay": `${i * 1.2}s` } as React.CSSProperties}
        />
      ))}
      {/* The landmarks, breathing in reading order. */}
      {FACE_NODES.map(([x, y], i) => (
        <rect
          key={`${x}${y}`}
          className="glyph-node"
          x={x - 2}
          y={y - 2}
          width="4"
          height="4"
          fill="currentColor"
          opacity="0.4"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      {/* Alive: the same drawn tick the site gives every verdict. */}
      <Hole x={210} y={243} size={26} />
      <rect
        x="186"
        y="234"
        width="48"
        height="18"
        rx="9"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      <path
        d="M202 243 l5 5 11-11"
        stroke="var(--color-positive)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ————————————————————————————————————————
   Face match — the card's printed portrait against the face in the
   phone. The comparison circulates both ways; where the two agree, the
   verdict stands between them.
   ———————————————————————————————————————— */
export function FaceMatchGlyph() {
  return (
    <svg viewBox={VIEW} className={stage} fill="none" aria-hidden>
      {/* The document and its person. */}
      <rect
        x="36"
        y="84"
        width="152"
        height="114"
        rx="10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <line
        x1="50"
        y1="102"
        x2="120"
        y2="102"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <Portrait x={50} y={112} w={44} h={54} />
      {/* The portrait under detection: the reader's corners on it, and
          the fine stripes of it being sampled column by column. */}
      <Corners x={46} y={108} w={52} h={62} arm={8} />
      {[58, 65, 72, 79, 86].map((x) => (
        <line
          key={x}
          x1={x}
          y1="116"
          x2={x}
          y2="162"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.14"
        />
      ))}
      {[
        [122, 174],
        [136, 158],
        [150, 168],
      ].map(([y, x2]) => (
        <line
          key={y}
          x1="104"
          y1={y}
          x2={x2}
          y2={y}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}
      <rect
        x="104"
        y="162"
        width="22"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* The living counterpart, in the phone. */}
      <Phone x={282} y={54} w={102} h={196} />
      <ellipse
        cx="333"
        cy="138"
        rx="34"
        ry="42"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 4"
        opacity="0.4"
      />
      <ellipse
        cx="333"
        cy="138"
        rx="25"
        ry="32"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <line
        x1="321"
        y1="130"
        x2="329"
        y2="130"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <line
        x1="337"
        y1="130"
        x2="345"
        y2="130"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M325 156 C 330 159, 336 159, 341 156"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      {/* The same template liveness took, resting on the live face —
          what the match is actually comparing. Still here: this drawing's
          motion is the circulation, not the taking. */}
      {[
        "M333 106 L308 116 L315 145 L331 165 L348 168 L358 151",
        "M308 116 L332 133 L358 151",
      ].map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.3"
        />
      ))}
      {/* Landmarks on both, breathing in the same order — the same
          geometry read from two places. */}
      {(
        [
          [72, 124, 0],
          [94, 148, 1],
          [308, 116, 0],
          [358, 151, 1],
          [331, 165, 2],
        ] as const
      ).map(([x, y, i]) => (
        <rect
          key={`${x}${y}`}
          className="glyph-node"
          x={x - 2}
          y={y - 2}
          width="4"
          height="4"
          fill="currentColor"
          opacity="0.4"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      {/* The comparison, circulating. */}
      <Pulse d="M96 118 C 180 78, 236 82, 316 112" delay={0} />
      <Pulse d="M316 168 C 236 208, 180 200, 96 156" delay={0} back />
      {/* Agreement. */}
      <g>
        <Hole x={206} y={142} size={14} />
        <rect
          x="201"
          y="137"
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
