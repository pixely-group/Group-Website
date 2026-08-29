/**
 * The specimen document — the thing the device scans, drawn at the same
 * fidelity as the front page's treasury mock. An ID-1 card (85.6 : 54),
 * laid out the way national cards are actually laid out: header band,
 * portrait left, label-and-value fields right, chip, and the TD1 machine
 * zone — three lines of thirty characters — bracketed at the foot.
 *
 * SPECIMEN is printed on it twice, the industry's own convention for a
 * document that exists to be photographed. The country is "SPC", which is
 * no country. Nothing on it belongs to anyone.
 *
 * The card also carries its own per-act theatre, switched by `act`:
 *   mrz  — the scan beam sweeps INSIDE the machine zone, and only there;
 *          the three lines light in reading order.
 *   ocr  — the printed fields are called out one after another.
 *   nfc  — the near field ripples out of the chip.
 *   Anything else — the card simply is.
 */

const MRZ = [
  "IDSPCP0X3LY123<8<<<<<<<<<<<<<<",
  "9403129F3401017SPC<<<<<<<<<<<2",
  "AMRANI<<LINA<<<<<<<<<<<<<<<<<<",
];

const FIELDS: [string, string][] = [
  ["Surname", "AMRANI"],
  ["Given names", "LINA"],
  ["Date of birth", "12.03.1994"],
  ["Document no", "P0X3LY123"],
  ["Expiry", "01.01.2034"],
];

export type CardAct = "idle" | "mrz" | "ocr" | "nfc";

export default function IdentityCard({ act = "idle" }: { act?: CardAct }) {
  return (
    <div
      data-theme="bone"
      className="relative w-full overflow-hidden rounded-[4.2%/6.6%] bg-theme text-theme shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)]"
      style={{ aspectRatio: "85.6 / 54", containerType: "inline-size" }}
    >
      {/* The card's own print texture: the site's flowing hairlines, faint. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full opacity-[0.55]"
        viewBox="0 0 428 270"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M -20 ${30 + i * 38} C 120 ${18 + i * 38 + (i % 3) * 12}, 300 ${52 + i * 34}, 448 ${70 + i * 30}`}
            stroke="#131316"
            strokeOpacity="0.05"
            strokeWidth="1"
          />
        ))}
      </svg>
      <span
        aria-hidden
        className="pointer-events-none absolute top-[34%] left-[16%] -rotate-[18deg] font-mono text-[7.4cqw] font-semibold tracking-[0.34em] text-(--fg) opacity-[0.05] select-none"
      >
        SPECIMEN
      </span>

      {/* Header band. */}
      <div className="absolute inset-x-[5%] top-[6.4%] flex items-baseline justify-between">
        <p className="font-mono text-[2.5cqw] tracking-[0.22em] text-(--muted) uppercase">
          Republic of Specimen
        </p>
        <p className="font-mono text-[2.2cqw] tracking-[0.18em] text-(--faint) uppercase">
          National identity card
        </p>
      </div>
      <div className="absolute inset-x-[5%] top-[15.4%] h-px bg-(--line-strong)" />

      {/* Portrait. */}
      <div
        data-portrait
        className="absolute top-[21%] left-[5%] w-[24%] overflow-hidden rounded-[6px] border border-(--line-strong) bg-(--surface)"
        style={{ aspectRatio: "3 / 3.8" }}
      >
        <svg viewBox="0 0 60 76" className="size-full" fill="none" aria-hidden>
          <circle
            cx="30"
            cy="27"
            r="13"
            stroke="#131316"
            strokeOpacity="0.75"
            strokeWidth="1.4"
          />
          {/* The crown of hair that keeps a head from being an egg. */}
          <path
            d="M18 24 C 18 12, 42 12, 42 24"
            stroke="#131316"
            strokeOpacity="0.75"
            strokeWidth="1.4"
          />
          <path
            d="M12 74 C 14 52, 46 52, 48 74"
            stroke="#131316"
            strokeOpacity="0.75"
            strokeWidth="1.4"
          />
          <line
            x1="25"
            y1="28"
            x2="28"
            y2="28"
            stroke="#131316"
            strokeOpacity="0.7"
            strokeWidth="1.2"
          />
          <line
            x1="32"
            y1="28"
            x2="35"
            y2="28"
            stroke="#131316"
            strokeOpacity="0.7"
            strokeWidth="1.2"
          />
          <path
            d="M26.5 33.5 C 28.5 35, 31.5 35, 33.5 33.5"
            stroke="#131316"
            strokeOpacity="0.7"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* The chip — where the NFC act happens. */}
      <div
        data-chip
        className="absolute top-[64%] left-[9.5%] w-[10.5%] rounded-[3px] border border-(--line-strong) bg-(--surface)"
        style={{ aspectRatio: "4.4 / 3.6" }}
      >
        <svg viewBox="0 0 44 36" className="size-full" fill="none" aria-hidden>
          <path
            d="M14 0 V36 M30 0 V36 M0 12 H44 M0 24 H44"
            stroke="#131316"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <rect x="18" y="14" width="8" height="8" fill="#2d46ff" />
        </svg>
        {/* The near field, rippling only while the chip is being read. */}
        {act === "nfc" && (
          <span aria-hidden className="absolute top-1/2 left-1/2 -z-0">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="kyc-ripple absolute -top-[7cqw] -left-[7cqw] block size-[14cqw] rounded-full border border-(--color-signal)"
                style={{ "--i": i } as React.CSSProperties}
              />
            ))}
          </span>
        )}
      </div>

      {/* Fields, aligned the way documents align them. */}
      <div className="absolute top-[21%] right-[5%] left-[34%]">
        {FIELDS.map(([label, value], i) => (
          <div
            key={label}
            data-field
            className="relative mb-[1.6cqw] flex items-baseline gap-[2cqw]"
          >
            <span className="w-[34%] shrink-0 font-mono text-[2.1cqw] tracking-[0.14em] text-(--faint) uppercase">
              {label}
            </span>
            <span className="font-mono text-[2.9cqw] font-medium tracking-[0.1em] text-(--fg)">
              {value}
            </span>
            {/* The OCR call-out: this field, being read right now. */}
            {act === "ocr" && (
              <span
                aria-hidden
                className="kyc-fieldbox absolute -inset-x-[1.4cqw] -inset-y-[0.7cqw] rounded-[3px] border border-(--color-signal)"
                style={{ "--i": i } as React.CSSProperties}
              />
            )}
          </div>
        ))}
        <p className="mt-[2.4cqw] font-mono text-[1.9cqw] tracking-[0.2em] text-(--faint) uppercase">
          Specimen — not valid for travel
        </p>
      </div>

      {/* The machine-readable zone: bracketed, and owning its own scan. */}
      <div
        data-mrz
        className="absolute inset-x-[5%] bottom-[5.6%] overflow-hidden border-t border-(--line-strong) pt-[1.6cqw]"
      >
        {MRZ.map((line, i) => (
          <p
            key={line}
            className={`font-mono text-[3.4cqw] leading-[1.42] font-medium tracking-[0.08em] whitespace-pre text-(--fg) ${
              act === "mrz" ? "kyc-mrzline" : ""
            }`}
            style={{ "--i": i } as React.CSSProperties}
          >
            {line}
          </p>
        ))}
        {/* The beam. It lives inside this element, so it can only ever
            sweep the machine zone — the user's exact note. */}
        {act === "mrz" && (
          <span
            aria-hidden
            className="kyc-scan pointer-events-none absolute inset-y-0 left-0 w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 38%, rgba(45,70,255,0.16) 47%, rgba(114,144,255,0.5) 50%, rgba(45,70,255,0.16) 53%, transparent 62%)",
            }}
          />
        )}
      </div>
    </div>
  );
}
