"use client";

/**
 * The Pixely Verify app — what the device runs on the identity page, the
 * way it runs the wallet on the front page. Laid out at the hardware's own
 * 402x874 points, themed in the site's own ink/bone/signal rather than a
 * borrowed template: this is the platform's app, on the platform's page.
 *
 * One screen per act. Every screen loops a demo rhythm on CSS clocks (all
 * gated behind reduced-motion in globals), so the app is always working,
 * never a still.
 */

const INK = "#0a0a0b";
const PANEL = "#131318";
const LINE = "rgba(236,233,225,0.14)";
const BONE = "#ece9e1";
const MUTED = "rgba(236,233,225,0.55)";
const FAINT = "rgba(236,233,225,0.3)";
const SIGNAL = "#2d46ff";
const LIFT = "#7290ff";
const GOOD = "#2f9e6e";

export type KycAct = "start" | "mrz" | "ocr" | "nfc" | "live" | "match";

const mono = "var(--font-mono)";

function Chrome({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex size-full flex-col"
      style={{ background: INK, color: BONE, fontFamily: "var(--font-sans)" }}
    >
      <div
        className="flex items-center justify-between px-7"
        style={{ paddingTop: 74, paddingBottom: 18 }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: 12,
            letterSpacing: "0.18em",
            color: MUTED,
          }}
        >
          PIXELY&nbsp;VERIFY
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: 12,
            letterSpacing: "0.14em",
            color: FAINT,
          }}
        >
          {step}
        </span>
      </div>
      <div className="px-7" style={{ paddingBottom: 14 }}>
        <p style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {title}
        </p>
      </div>
      <div className="relative flex-1 px-7 pb-8">{children}</div>
    </div>
  );
}

function Panel({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderRadius: 22,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Tick({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M3.4 8.4 L6.6 11.6 L12.8 4.8"
        stroke={GOOD}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The face the app sees: a person, not a Lego — crown of hair, jaw that
 *  tapers, a smile. Shared by the selfie and the match screens. */
function Face({ width = 190 }: { width?: number }) {
  return (
    <svg
      viewBox="0 0 120 150"
      width={width}
      fill="none"
      aria-hidden
      className="glyph-stage"
    >
      {/* Skull: egg standing on its narrow end. */}
      <path
        d="M60 16 C 86 16, 96 40, 94 66 C 92 92, 80 112, 60 112 C 40 112, 28 92, 26 66 C 24 40, 34 16, 60 16 Z"
        stroke={BONE}
        strokeOpacity="0.7"
        strokeWidth="1.4"
      />
      {/* Hair: the crown drawn over the skull. */}
      <path
        d="M28 52 C 26 24, 44 12, 60 12 C 76 12, 94 24, 92 52 C 84 40, 76 34, 60 34 C 44 34, 36 40, 28 52 Z"
        stroke={BONE}
        strokeOpacity="0.55"
        strokeWidth="1.3"
      />
      {/* Ears. */}
      <path
        d="M26 62 C 20 60, 20 72, 27 74 M94 62 C 100 60, 100 72, 93 74"
        stroke={BONE}
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />
      {/* Eyes, blinking on the site's own clock. */}
      <line
        className="glyph-blink"
        x1="42"
        y1="64"
        x2="52"
        y2="64"
        stroke={BONE}
        strokeWidth="2"
      />
      <line
        className="glyph-blink"
        x1="68"
        y1="64"
        x2="78"
        y2="64"
        stroke={BONE}
        strokeWidth="2"
      />
      {/* Nose. */}
      <path
        d="M60 66 L58 82 L63 83"
        stroke={BONE}
        strokeOpacity="0.55"
        strokeWidth="1.3"
      />
      {/* The smile. */}
      <path
        d="M46 92 C 52 98, 68 98, 74 92"
        stroke={BONE}
        strokeOpacity="0.8"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Shoulders. */}
      <path
        d="M18 150 C 24 124, 96 124, 102 150"
        stroke={BONE}
        strokeOpacity="0.6"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function StatusRow({
  label,
  ok,
  i,
}: {
  label: string;
  ok?: boolean;
  i: number;
}) {
  return (
    <div
      className="kyc-arrive flex items-center justify-between"
      style={
        {
          "--i": i,
          padding: "13px 2px",
          borderBottom: `1px solid ${LINE}`,
          fontFamily: mono,
          fontSize: 12.5,
          letterSpacing: "0.1em",
        } as React.CSSProperties
      }
    >
      <span style={{ color: MUTED }}>{label}</span>
      {ok ? (
        <Tick />
      ) : (
        <span style={{ color: FAINT, fontSize: 11 }}>· · ·</span>
      )}
    </div>
  );
}

/* ——— the six screens ——— */

function StartScreen() {
  return (
    <Chrome step="00 / 05" title="Verify your identity">
      <p style={{ fontSize: 14.5, lineHeight: 1.55, color: MUTED, maxWidth: 300 }}>
        Three minutes, one document, your face. Checked live, attested once,
        never asked twice.
      </p>
      <div className="mt-6">
        {[
          "Scan the machine zone",
          "Read the printed page",
          "Authenticate the chip",
          "Prove you are live",
          "Match face to document",
        ].map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-4"
            style={{
              padding: "13px 2px",
              borderBottom: `1px solid ${LINE}`,
              fontSize: 14,
              color: MUTED,
            }}
          >
            <span
              style={{
                fontFamily: mono,
                fontSize: 11,
                color: i === 0 ? LIFT : FAINT,
                letterSpacing: "0.12em",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s}
          </div>
        ))}
      </div>
      <div
        className="absolute right-7 bottom-8 left-7 flex items-center justify-center"
        style={{
          height: 56,
          borderRadius: 28,
          background: SIGNAL,
          color: BONE,
          fontFamily: mono,
          fontSize: 13,
          letterSpacing: "0.16em",
        }}
      >
        BEGIN
      </div>
    </Chrome>
  );
}

function MrzScreen() {
  return (
    <Chrome step="01 / 05" title="Scanning the machine zone">
      <Panel style={{ height: 268, padding: 18 }}>
        {/* The viewfinder sees the card's foot; the zone is the bright part. */}
        <div
          style={{
            position: "absolute",
            inset: 18,
            borderRadius: 12,
            background: "#1b1b21",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "18px 16px", opacity: 0.32 }}>
            {[150, 190, 120, 170].map((w, i) => (
              <div
                key={i}
                style={{
                  height: 7,
                  width: w,
                  marginBottom: 12,
                  background: BONE,
                  opacity: 0.4,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              left: 12,
              borderTop: `1px solid rgba(236,233,225,0.35)`,
              paddingTop: 8,
              overflow: "hidden",
            }}
          >
            {[
              "IDSPCP0X3LY123<8<<<<<<<<<<<<<<",
              "9403129F3401017SPC<<<<<<<<<<<2",
              "AMRANI<<LINA<<<<<<<<<<<<<<<<<<",
            ].map((l, i) => (
              <p
                key={l}
                className="kyc-mrzline"
                style={
                  {
                    "--i": i,
                    fontFamily: mono,
                    fontSize: 11.5,
                    letterSpacing: "0.06em",
                    lineHeight: 1.6,
                    whiteSpace: "pre",
                    color: BONE,
                  } as React.CSSProperties
                }
              >
                {l}
              </p>
            ))}
            <span
              aria-hidden
              className="kyc-scan"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, transparent 38%, rgba(45,70,255,0.2) 47%, rgba(114,144,255,0.55) 50%, rgba(45,70,255,0.2) 53%, transparent 62%)",
              }}
            />
          </div>
        </div>
      </Panel>
      <div className="mt-5">
        <StatusRow label="LINE 1 — DOCUMENT" ok i={0} />
        <StatusRow label="LINE 2 — DATES + CHECKS" ok i={1} />
        <StatusRow label="LINE 3 — NAME" ok i={2} />
        <StatusRow label="CHECK DIGITS AGREE" ok i={3} />
      </div>
    </Chrome>
  );
}

function OcrScreen() {
  return (
    <Chrome step="02 / 05" title="Reading the printed page">
      <div>
        {(
          [
            ["SURNAME", "AMRANI"],
            ["GIVEN NAMES", "LINA"],
            ["DATE OF BIRTH", "12.03.1994"],
            ["DOCUMENT NO", "P0X3LY123"],
            ["EXPIRY", "01.01.2034"],
          ] as const
        ).map(([label, value], i) => (
          <div
            key={label}
            className="kyc-arrive"
            style={
              {
                "--i": i,
                padding: "14px 2px",
                borderBottom: `1px solid ${LINE}`,
              } as React.CSSProperties
            }
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  color: FAINT,
                }}
              >
                {label}
              </span>
              <Tick />
            </div>
            <p
              style={{
                fontFamily: mono,
                fontSize: 17,
                letterSpacing: "0.06em",
                marginTop: 4,
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
      <p
        style={{
          marginTop: 18,
          fontFamily: mono,
          fontSize: 11.5,
          letterSpacing: "0.12em",
          color: MUTED,
        }}
      >
        VISUAL ZONE ⇄ MACHINE ZONE — AGREE
      </p>
    </Chrome>
  );
}

function NfcScreen() {
  return (
    <Chrome step="03 / 05" title="Hold on the document">
      <Panel style={{ height: 330 }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative" style={{ width: 168, height: 168 }}>
            <svg viewBox="0 0 120 120" className="absolute inset-0 size-full">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={LINE}
                strokeWidth="3"
              />
              <circle
                className="kyc-progress"
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={SIGNAL}
                strokeWidth="3"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100 100"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div
              className="kyc-progress-tick absolute inset-0 flex items-center justify-center"
              style={{ transformOrigin: "center" }}
            >
              <Tick size={44} />
            </div>
          </div>
          <p
            style={{
              marginTop: 26,
              fontFamily: mono,
              fontSize: 12,
              letterSpacing: "0.14em",
              color: MUTED,
            }}
          >
            READING CHIP — HOLD STILL
          </p>
        </div>
      </Panel>
      <div className="mt-5">
        <StatusRow label="CHIP FOUND" ok i={0} />
        <StatusRow label="STATE SIGNATURE VALID" ok i={1} />
        <StatusRow label="ACTIVE AUTHENTICATION" ok i={2} />
      </div>
    </Chrome>
  );
}

function LiveScreen() {
  return (
    <Chrome step="04 / 05" title="Look at the camera">
      <Panel style={{ height: 400 }}>
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {/* The oval guide every capture app draws. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              width: 236,
              height: 320,
              borderRadius: "50%",
              border: `1.5px dashed rgba(236,233,225,0.4)`,
            }}
          />
          <Face width={210} />
          {/* The sweep, inside the frame. */}
          <span
            aria-hidden
            className="kyc-sweep"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 40%, rgba(45,70,255,0.12) 48%, rgba(114,144,255,0.4) 50%, rgba(45,70,255,0.12) 52%, transparent 60%)",
            }}
          />
        </div>
      </Panel>
      <div className="mt-5">
        <StatusRow label="FACE IN FRAME" ok i={0} />
        <StatusRow label="DEPTH + TEXTURE — LIVE" ok i={1} />
        <StatusRow label="NOT A SCREEN, NOT A PRINT" ok i={2} />
      </div>
    </Chrome>
  );
}

function MatchScreen() {
  return (
    <Chrome step="05 / 05" title="Same person">
      <div className="flex gap-4">
        {(["DOCUMENT", "LIVE"] as const).map((who) => (
          <Panel key={who} style={{ flex: 1, height: 230 }}>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
              <Face width={128} />
            </div>
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 12,
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: "0.16em",
                color: FAINT,
              }}
            >
              {who}
            </span>
          </Panel>
        ))}
      </div>
      <div
        className="mt-5 flex items-center justify-between"
        style={{
          padding: "16px 18px",
          borderRadius: 16,
          border: `1px solid rgba(47,158,110,0.5)`,
          background: "rgba(47,158,110,0.08)",
        }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: 12.5,
            letterSpacing: "0.14em",
            color: BONE,
          }}
        >
          FACES MATCH
        </span>
        <Tick size={20} />
      </div>
      <div className="mt-4">
        <StatusRow label="PORTRAIT ⇄ CHIP ⇄ FACE" ok i={0} />
        <StatusRow label="ATTESTATION WRITTEN" ok i={1} />
      </div>
    </Chrome>
  );
}

const SCREENS: Record<KycAct, () => React.ReactNode> = {
  start: StartScreen,
  mrz: MrzScreen,
  ocr: OcrScreen,
  nfc: NfcScreen,
  live: LiveScreen,
  match: MatchScreen,
};

export default function KycScreen({ act }: { act: KycAct }) {
  const Active = SCREENS[act];
  return (
    <div className="relative size-full" style={{ background: INK }}>
      {/* Keyed so a change of act crossfades the whole screen. */}
      <div key={act} className="kyc-screen-in absolute inset-0">
        <Active />
      </div>
    </div>
  );
}
