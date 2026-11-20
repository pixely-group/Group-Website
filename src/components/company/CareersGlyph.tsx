import { Junction, LINE, Mark, Ports, Pulse, Sheet } from "@/components/company/glyph";

/**
 * The Careers sheet: one office and the work that leaves it.
 *
 * Algiers at one end, the brand's square on it, because that is where the
 * platform is built. At the other end a joint, not a square: the network the
 * platform connects outward to. Between them the Product dropdown's fan,
 * grown to four roads, one for each discipline the platform needs; each road
 * has its junction at the meridian where the two halves meet. Traffic runs
 * both ways, alternate roads in alternate directions: the work is not only
 * sent out, it is answered back.
 *
 * The labels are set in HTML under the sheet, not in the SVG, so they stay
 * the label face at its own size at every width.
 */
const ALGIERS = 64;
const NETWORK = 416;
const ROADS = [84, 148, 212, 276];

const road = (y: number) =>
  `M${ALGIERS} 180 C ${ALGIERS + 76} 180 ${ALGIERS + 76} ${y} ${ALGIERS + 152} ${y} ` +
  `L ${NETWORK - 152} ${y} C ${NETWORK - 76} ${y} ${NETWORK - 76} 180 ${NETWORK} 180`;

export default function CareersGlyph() {
  return (
    <figure>
      <Sheet>
        <Ports />
        {/* The fabric beyond the office, out to the ports. */}
        <Pulse d={`M0 180 L ${ALGIERS} 180`} delay={0.4} dur={3.6} />
        <Pulse d={`M${NETWORK} 180 L 480 180`} delay={2.2} dur={3.6} back />

        {/* The meridian: where the halves meet. */}
        <line x1="240" y1="56" x2="240" y2="304" stroke={LINE} strokeWidth="1" opacity="0.14" />

        {ROADS.map((y, i) => (
          <Pulse key={y} d={road(y)} delay={i * 1.05} dur={5.2} back={i % 2 === 1} />
        ))}
        {ROADS.map((y, i) => (
          <Junction key={y} x={240} y={y} i={i} />
        ))}

        <Mark x={ALGIERS} y={180} />
        <Junction x={NETWORK} y={180} i={4} />
      </Sheet>
      {/* The office named under its own square and the hand-off under its
          joint: the labels sit at those marks' own fractions of the sheet,
          so they stay under them at any width. */}
      <figcaption className="type-label relative mt-4 h-4 text-(--faint)">
        <span
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${(ALGIERS / 480) * 100}%` }}
        >
          Algiers
        </span>
        <span
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${(NETWORK / 480) * 100}%` }}
        >
          The network
        </span>
      </figcaption>
    </figure>
  );
}
