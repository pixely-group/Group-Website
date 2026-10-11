import { Junction, LINE, Mark, Ports, Pulse, Sheet } from "@/components/company/glyph";

/**
 * The Careers sheet: two offices and the work between them.
 *
 * London at one end, Algiers at the other — the brand's square at each,
 * because both are Pixely. Between them the Product dropdown's fan, grown to
 * four roads, one for each discipline the platform needs; each road has its
 * junction at the meridian where the two halves meet. Traffic runs both
 * ways, alternate roads in alternate directions: the work is not shipped
 * from one office to the other, it is done across both.
 *
 * The labels are set in HTML under the sheet, not in the SVG, so they stay
 * the label face at its own size at every width.
 */
const LONDON = 64;
const ALGIERS = 416;
const ROADS = [84, 148, 212, 276];

const road = (y: number) =>
  `M${LONDON} 180 C ${LONDON + 76} 180 ${LONDON + 76} ${y} ${LONDON + 152} ${y} ` +
  `L ${ALGIERS - 152} ${y} C ${ALGIERS - 76} ${y} ${ALGIERS - 76} 180 ${ALGIERS} 180`;

export default function CareersGlyph() {
  return (
    <figure>
      <Sheet>
        <Ports />
        {/* The fabric beyond each office, out to the ports. */}
        <Pulse d={`M0 180 L ${LONDON} 180`} delay={0.4} dur={3.6} />
        <Pulse d={`M${ALGIERS} 180 L 480 180`} delay={2.2} dur={3.6} back />

        {/* The meridian: where the halves meet. */}
        <line x1="240" y1="56" x2="240" y2="304" stroke={LINE} strokeWidth="1" opacity="0.14" />

        {ROADS.map((y, i) => (
          <Pulse key={y} d={road(y)} delay={i * 1.05} dur={5.2} back={i % 2 === 1} />
        ))}
        {ROADS.map((y, i) => (
          <Junction key={y} x={240} y={y} i={i} />
        ))}

        <Mark x={LONDON} y={180} />
        <Mark x={ALGIERS} y={180} />
      </Sheet>
      {/* Each office named under its own square: the labels sit at the
          marks' own fractions of the sheet, so they stay under them at any
          width. */}
      <figcaption className="type-label relative mt-4 h-4 text-(--faint)">
        <span
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${(LONDON / 480) * 100}%` }}
        >
          London
        </span>
        <span
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${(ALGIERS / 480) * 100}%` }}
        >
          Algiers
        </span>
      </figcaption>
    </figure>
  );
}
