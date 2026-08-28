/**
 * The five checks, drawn.
 *
 * One drawing per verification technology, in the sub-menu glyphs' own
 * language grown to stage size: hairline geometry in currentColor, the
 * accent reserved for whatever travels, junction squares breathing over
 * punched --bg holes, and every loop seamless on the shared --beat. Each
 * one is a working diagram of its check — what is read, what moves, and
 * where the verdict lands — not an illustration standing near it.
 *
 * All of them run under `.glyph-stage`, so they keep the drop-down's clock
 * and sit inside the same reduced-motion gate.
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

const stage = "glyph-stage block w-full text-(--line-strong)";

/* ————————————————————————————————————————
   MRZ — the two lines at the foot of the document, read and checksummed.
   The beam walks each line in turn; the check digits at the ends breathe.
   ———————————————————————————————————————— */
export function MrzGlyph() {
  return (
    <svg viewBox={VIEW} className={stage} fill="none" aria-hidden>
      {/* The document. */}
      <rect
        x="70"
        y="50"
        width="280"
        height="190"
        rx="14"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      {/* Portrait window: the person as the document prints them. */}
      <rect
        x="100"
        y="85"
        width="64"
        height="80"
        rx="6"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <circle
        cx="132"
        cy="112"
        r="11"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M112 158 C 118 138, 146 138, 152 158"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* The visual-inspection fields — what a human reads. */}
      {[
        [92, 320],
        [110, 292],
        [128, 310],
        [146, 268],
      ].map(([y, x2]) => (
        <line
          key={y}
          x1="190"
          y1={y}
          x2={x2}
          y2={y}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}
      {/* The zone itself, ruled off from the rest of the page. */}
      <line
        x1="86"
        y1="182"
        x2="334"
        y2="182"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      {/* Two lines of machine text: character cells, with the chevron fill
          the format pads itself with. */}
      {[205, 222].map((y) => (
        <line
          key={y}
          x1="88"
          y1={y}
          x2="318"
          y2={y}
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="4 3.5"
          opacity="0.3"
        />
      ))}
      {[
        [232, 205],
        [240, 205],
        [270, 222],
        [278, 222],
        [286, 222],
      ].map(([x, y]) => (
        <path
          key={`${x}${y}`}
          d={`M${x + 4} ${y - 4} L${x} ${y} L${x + 4} ${y + 4}`}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}
      {/* The reader's pass: one line, then the other. */}
      <Pulse d="M88 205 H 318" delay={0} />
      <Pulse d="M88 222 H 318" delay={3.6} />
      {/* The check digits: the characters that catch the forger. */}
      <Junction x={331} y={205} i={0} size={7} />
      <Junction x={331} y={222} i={2} size={7} />
    </svg>
  );
}

/* ————————————————————————————————————————
   OCR — print lifted off the page into fields. The frame scans the
   document; what it reads travels out and lands as structured data.
   ———————————————————————————————————————— */
export function OcrGlyph() {
  return (
    <svg viewBox={VIEW} className={stage} fill="none" aria-hidden>
      {/* The page under the camera. */}
      <rect
        x="55"
        y="70"
        width="180"
        height="160"
        rx="12"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <Corners x={45} y={60} w={200} h={180} />
      {/* Printed lines, breathing in reading order as the beam passes. */}
      {[
        [95, 215],
        [115, 195],
        [135, 208],
        [155, 182],
        [175, 210],
        [195, 170],
      ].map(([y, x2], i) => (
        <line
          key={y}
          className="glyph-node"
          x1="75"
          y1={y}
          x2={x2}
          y2={y}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.35"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      {/* The beam itself. */}
      <line
        className="glyph-scan"
        x1="65"
        y1="82"
        x2="225"
        y2="82"
        stroke="var(--accent)"
        strokeWidth="1.5"
        opacity="0.8"
        style={{ "--sweep": "136px" } as React.CSSProperties}
      />
      {/* What was read, leaving the page. */}
      <Pulse d="M235 115 C 262 108, 268 108, 292 106" delay={0.9} dur={3.6} />
      <Pulse d="M235 150 C 262 150, 268 151, 292 151" delay={2.1} dur={3.6} />
      <Pulse d="M235 185 C 262 192, 268 194, 292 196" delay={3.3} dur={3.6} />
      {/* The fields it lands in: the document as data. */}
      {[93, 138, 183].map((y, i) => (
        <g key={y}>
          <rect
            x="292"
            y={y}
            width="100"
            height="26"
            rx="6"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.45"
          />
          <line
            x1="304"
            y1={y + 13}
            x2={356 - i * 10}
            y2={y + 13}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />
          <Junction x={292} y={y + 13} i={i} size={7} />
        </g>
      ))}
    </svg>
  );
}

/* ————————————————————————————————————————
   NFC — the tap. The chip's signature crosses to the reader and the
   challenge comes back: a conversation, not a copy. The waves ripple
   outward on the node stagger; the verdict stands on the phone.
   ———————————————————————————————————————— */
export function NfcGlyph() {
  return (
    <svg viewBox={VIEW} className={stage} fill="none" aria-hidden>
      {/* The document, chip forward. */}
      <rect
        x="40"
        y="80"
        width="200"
        height="140"
        rx="14"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      {/* The chip: contact plate with the brand's square at its heart. */}
      <rect
        x="70"
        y="110"
        width="36"
        height="30"
        rx="4"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <path
        d="M82 110 V 140 M94 110 V 140 M70 125 H 106"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <rect x="84" y="121" width="8" height="8" fill="var(--accent)" />
      {/* The field, rippling off the chip. */}
      {[26, 42, 58].map((r, i) => (
        <path
          key={r}
          className="glyph-node"
          d={`M${118} ${125 - r} A ${r} ${r} 0 0 1 ${118} ${125 + r}`}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.4"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      {/* The reader. */}
      <rect
        x="310"
        y="45"
        width="100"
        height="210"
        rx="18"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <line
        x1="345"
        y1="60"
        x2="375"
        y2="60"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <rect
        x="346"
        y="112"
        width="26"
        height="26"
        rx="4"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Signature out, challenge back: both directions on the same tap. */}
      <Pulse d="M106 118 C 200 118, 240 118, 346 118" delay={0} />
      <Pulse d="M346 132 C 240 132, 200 132, 106 132" delay={0} back />
      <Junction x={359} y={125} i={1} size={7} />
      {/* Signature verified: the state's own key answered. */}
      <g>
        <Hole x={359} y={180} size={14} />
        <rect
          x="354"
          y="175"
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

/* ————————————————————————————————————————
   Liveness — the frame is looking at a person, not a picture. The beam
   reads the face, the mesh breathes point by point, and the eyes blink —
   the one thing a photograph never does.
   ———————————————————————————————————————— */
export function LivenessGlyph() {
  return (
    <svg viewBox={VIEW} className={stage} fill="none" aria-hidden>
      <Corners x={118} y={42} w={184} h={216} />
      {/* The face, and the shoulders that keep it a person. */}
      <ellipse
        cx="210"
        cy="145"
        rx="52"
        ry="64"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <path
        d="M142 258 C 162 214, 258 214, 278 258"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Features. The eyes carry the argument. */}
      <line
        className="glyph-blink"
        x1="186"
        y1="130"
        x2="198"
        y2="130"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <line
        className="glyph-blink"
        x1="222"
        y1="130"
        x2="234"
        y2="130"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M210 138 V 158 H 205"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M196 178 C 204 183, 216 183, 224 178"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      {/* The mesh, read point by point. */}
      {[
        [168, 118],
        [252, 118],
        [174, 178],
        [246, 178],
        [210, 205],
      ].map(([x, y], i) => (
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
      {/* The reading beam, over the whole face and back. */}
      <line
        className="glyph-scan"
        x1="130"
        y1="68"
        x2="290"
        y2="68"
        stroke="var(--accent)"
        strokeWidth="1.5"
        opacity="0.8"
        style={{ "--sweep": "164px" } as React.CSSProperties}
      />
    </svg>
  );
}

/* ————————————————————————————————————————
   Face match — the portrait the document carries against the face that
   passed liveness. The comparison circulates both ways; where the two
   agree, the verdict stands.
   ———————————————————————————————————————— */
export function FaceMatchGlyph() {
  return (
    <svg viewBox={VIEW} className={stage} fill="none" aria-hidden>
      {/* The document and its printed person. */}
      <rect
        x="45"
        y="90"
        width="130"
        height="120"
        rx="10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <circle
        cx="93"
        cy="133"
        r="14"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M70 168 C 78 150, 108 150, 116 168"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      {[125, 141].map((y) => (
        <line
          key={y}
          x1="128"
          y1={y}
          x2="160"
          y2={y}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}
      <line
        x1="58"
        y1="192"
        x2="162"
        y2="192"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="3.5 3"
        opacity="0.3"
      />
      {/* The living counterpart, in the frame. */}
      <Corners x={252} y={72} w={136} h={156} arm={14} />
      <ellipse
        cx="320"
        cy="148"
        rx="42"
        ry="52"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <line
        x1="301"
        y1="136"
        x2="311"
        y2="136"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <line
        x1="329"
        y1="136"
        x2="339"
        y2="136"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M308 172 C 314 176, 326 176, 332 172"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      {[
        [286, 122],
        [354, 122],
        [320, 190],
      ].map(([x, y], i) => (
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
      <Pulse d="M112 116 C 190 88, 240 92, 302 122" delay={0} />
      <Pulse d="M302 176 C 240 204, 190 200, 112 152" delay={0} back />
      {/* Agreement. */}
      <g>
        <Hole x={211} y={146} size={14} />
        <rect
          x="206"
          y="141"
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
