/**
 * The Pixely consumer app, home screen — the surface an end customer holds,
 * built on the settlement layer the rest of this site describes.
 *
 * Drawn rather than screenshotted: it stays sharp at any device scale, costs
 * no image weight, recolours with the brand, and can be read by a screen
 * reader. Laid out at the iPhone's own logical size (402 × 874 pt) so every
 * measurement here is the measurement a designer would hand over; the device
 * scales the whole thing as one.
 */

const INK = "#1b2333";
const MUTED = "#8f98aa";
const BRAND = "#2d46ff";

/** Balance, split so the decimals can sit back a little. */
const BALANCE = { whole: "13,804", cents: ".75" };

type Tx = {
  name: string;
  state: "Sent" | "Pending" | "Received" | "Failed";
  amount: string;
  time: string;
  /** Sphere tint, so the row avatars are not five of the same. */
  hue: [string, string];
};

const TRANSACTIONS: Tx[] = [
  {
    name: "Marcus Lee",
    state: "Sent",
    amount: "− 3,200 DA",
    time: "7:30",
    hue: ["#a5e4fb", "#4338ca"],
  },
  {
    name: "Evelyn Harper",
    state: "Pending",
    amount: "+ 1,500 DA",
    time: "19:12",
    hue: ["#bfe6fb", "#4f46e5"],
  },
  {
    name: "Liam Patel",
    state: "Received",
    amount: "+ 4,000 DA",
    time: "20:05",
    hue: ["#9adcf8", "#3730a3"],
  },
  {
    name: "Sophia Chen",
    state: "Failed",
    amount: "− 500 DA",
    time: "19:45",
    hue: ["#c7e9fc", "#4c1d95"],
  },
];

function StateIcon({ state }: { state: Tx["state"] }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 20 20",
    fill: "none" as const,
    stroke: MUTED,
    strokeWidth: 1.5,
  };
  return (
    <svg {...common} aria-hidden>
      <circle cx="10" cy="10" r="8" />
      {state === "Sent" && (
        <path d="M7.4 12.6 12.6 7.4M8.6 7.4h4v4" strokeLinecap="round" />
      )}
      {state === "Received" && (
        <path d="M12.6 7.4 7.4 12.6M11.4 12.6h-4v-4" strokeLinecap="round" />
      )}
      {state === "Pending" && (
        <path d="M10 6.2V10l2.4 1.6" strokeLinecap="round" />
      )}
      {state === "Failed" && (
        <path d="m7.6 7.6 4.8 4.8m0-4.8-4.8 4.8" strokeLinecap="round" />
      )}
    </svg>
  );
}

/** The three round controls under the balance. */
function Action({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-[14px]">
      <div
        className="flex size-[72px] items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(158deg,#eef1fd 0%,#ccd6f8 100%)",
          boxShadow:
            "0 12px 22px -10px rgba(45,70,255,0.42), 0 2px 4px rgba(27,35,51,0.06), inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 -3px 7px rgba(45,70,255,0.09)",
        }}
      >
        {children}
      </div>
      <span
        className="text-[16px] font-bold tracking-[-0.01em]"
        style={{ color: INK }}
      >
        {label}
      </span>
    </div>
  );
}

export default function AppScreen() {
  const stroke = { stroke: BRAND, strokeWidth: 2.4, strokeLinecap: "round" as const };

  return (
    <div
      // Its own light world inside a dark chapter: the cursor reads this
      // attribute and inverts over it, the way it does over any bone surface.
      data-cursor-theme="bone"
      className="relative h-[874px] w-[402px] overflow-hidden select-none"
      style={{
        background: "linear-gradient(180deg,#eaeef6 0%,#e4e9f3 46%,#e9edf5 100%)",
        color: INK,
        fontFamily: "var(--font-archivo)",
      }}
      role="img"
      aria-label="The Pixely app home screen: a balance of 13,804.75, controls to top up, send and receive, and a list of October transactions."
    >
      {/* — Status bar */}
      <div className="flex h-[54px] items-center justify-between px-[26px] pt-[6px]">
        <span className="text-[17px] font-semibold tracking-[-0.01em]">
          9:41 AM
        </span>
        <span className="flex items-center gap-[7px]">
          <svg width="18" height="12" viewBox="0 0 18 12" fill={INK} aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={i * 4.6}
                y={9 - i * 3}
                width="3"
                height={3 + i * 3}
                rx="1"
              />
            ))}
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
            <path
              d="M1 4.2a10 10 0 0 1 14 0M3.6 6.9a6.4 6.4 0 0 1 8.8 0"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <circle cx="8" cy="10" r="1.5" fill={INK} />
          </svg>
          <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden>
            <rect
              x="0.6"
              y="0.6"
              width="22"
              height="11.8"
              rx="3.6"
              stroke={INK}
              strokeOpacity="0.4"
              strokeWidth="1.1"
            />
            <rect x="2.4" y="2.4" width="18.4" height="8.2" rx="2.2" fill={INK} />
            <path
              d="M24.4 4.4v4.2a2.2 2.2 0 0 0 0-4.2Z"
              fill={INK}
              fillOpacity="0.4"
            />
          </svg>
        </span>
      </div>

      {/* — Greeting */}
      <div className="mt-[18px] flex items-center justify-between px-[26px]">
        <div className="flex items-center gap-[16px]">
          <div
            className="size-[54px] shrink-0 rounded-full"
            style={{
              background:
                "radial-gradient(120% 120% at 30% 22%, #dbe6fb 0%, #93a7f0 38%, #3f4fd8 100%)",
              boxShadow:
                "0 4px 12px -4px rgba(27,35,51,0.28), inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
          />
          <div>
            <p
              className="text-[21px] leading-[1.15] font-bold tracking-[-0.015em]"
              style={{ color: BRAND }}
            >
              Hey Amine
            </p>
            <p
              className="text-[18px] leading-[1.25] font-medium"
              style={{ color: "#5c6579" }}
            >
              Welcome back
            </p>
          </div>
        </div>

        <div className="relative">
          <div
            className="flex size-[50px] items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(158deg,#f4f6fd 0%,#dde4f6 100%)",
              boxShadow:
                "0 8px 16px -8px rgba(27,35,51,0.3), inset 0 1.5px 0 rgba(255,255,255,0.95)",
            }}
          >
            <svg width="23" height="24" viewBox="0 0 24 25" fill="none" aria-hidden>
              <path
                d="M12 3.2a6.2 6.2 0 0 0-6.2 6.2c0 5-2.1 6.8-2.1 6.8h16.6s-2.1-1.8-2.1-6.8A6.2 6.2 0 0 0 12 3.2Z"
                {...stroke}
                strokeLinejoin="round"
              />
              <path d="M10.2 20.1a2.1 2.1 0 0 0 3.6 0" {...stroke} />
            </svg>
          </div>
          <span
            className="absolute -top-[2px] -right-[1px] flex size-[21px] items-center justify-center rounded-full text-[12px] font-bold text-white"
            style={{ background: "#f0432f", boxShadow: "0 2px 5px rgba(240,67,47,0.5)" }}
          >
            3
          </span>
        </div>
      </div>

      {/* — Balance */}
      <p className="mt-[54px] text-center text-[62px] leading-none font-bold tracking-[-0.035em]">
        {BALANCE.whole}
        <span style={{ color: "#3c4763" }}>{BALANCE.cents}</span>
      </p>

      {/* — Controls */}
      <div className="mt-[52px] flex items-start justify-center gap-[46px]">
        <Action label="Top up">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
            <path d="M15 7v16M7 15h16" {...stroke} />
          </svg>
        </Action>
        <Action label="Send">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
            <path d="M15 23V7m0 0-6.4 6.4M15 7l6.4 6.4" {...stroke} strokeLinejoin="round" />
          </svg>
        </Action>
        <Action label="Receive">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
            <path d="M15 7v16m0 0 6.4-6.4M15 23l-6.4-6.4" {...stroke} strokeLinejoin="round" />
          </svg>
        </Action>
      </div>

      {/* — Transactions sheet */}
      <div
        className="absolute inset-x-0 bottom-0 top-[458px] rounded-t-[26px] bg-white"
        style={{ boxShadow: "0 -8px 26px -14px rgba(27,35,51,0.22)" }}
      >
        <div
          className="mx-auto mt-[11px] h-[5px] w-[42px] rounded-full"
          style={{ background: "#d4d9e3" }}
        />

        <div className="mt-[22px] flex items-center justify-between px-[30px]">
          <h3 className="text-[23px] font-bold tracking-[-0.02em]">
            Transactions
          </h3>
          <span
            className="flex items-center gap-[7px] rounded-full py-[10px] pr-[15px] pl-[19px] text-[16px] font-bold"
            style={{
              color: BRAND,
              background: "#fff",
              boxShadow:
                "0 4px 12px -4px rgba(27,35,51,0.18), 0 0 0 1px rgba(27,35,51,0.05)",
            }}
          >
            October
            <svg width="13" height="8" viewBox="0 0 14 9" fill="none" aria-hidden>
              <path d="m1 1 6 6 6-6" stroke={BRAND} strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
        </div>

        <ul className="mt-[20px] flex flex-col gap-[13px] px-[24px]">
          {TRANSACTIONS.map((tx) => (
            <li
              key={tx.name}
              className="flex items-center gap-[16px] rounded-[19px] px-[17px] py-[15px]"
              style={{ background: "#f4f7fb" }}
            >
              <span
                className="size-[42px] shrink-0 rounded-full"
                style={{
                  background: `radial-gradient(115% 115% at 32% 24%, ${tx.hue[0]} 0%, ${tx.hue[1]} 100%)`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[19px] leading-[1.2] font-bold tracking-[-0.015em]">
                  {tx.name}
                </span>
                <span
                  className="mt-[3px] flex items-center gap-[7px] text-[16px] font-medium"
                  style={{ color: MUTED }}
                >
                  <StateIcon state={tx.state} />
                  {tx.state}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[19px] leading-[1.2] font-bold tracking-[-0.02em]">
                  {tx.amount}
                </span>
                <span
                  className="mt-[3px] block text-[15px] font-medium"
                  style={{ color: MUTED }}
                >
                  {tx.time}
                </span>
              </span>
            </li>
          ))}
        </ul>

        {/* Scan to pay — floats over the list, as in the design */}
        <div
          className="absolute bottom-[34px] left-1/2 flex size-[86px] -translate-x-1/2 items-center justify-center rounded-full"
          style={{
            // Deliberately not a backdrop-filter: this sits inside a subtree
            // whose transform is rewritten every frame, and a backdrop blur
            // would resample the whole backdrop behind it on each one. At
            // this scale a flat translucent fill is indistinguishable.
            background:
              "linear-gradient(158deg,rgba(255,255,255,0.94) 0%,rgba(216,225,246,0.9) 100%)",
            boxShadow:
              "0 14px 28px -10px rgba(27,35,51,0.3), inset 0 1.5px 0 rgba(255,255,255,0.95)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
            <path
              d="M6 14V9a3 3 0 0 1 3-3h5M26 6h5a3 3 0 0 1 3 3v5M34 26v5a3 3 0 0 1-3 3h-5M14 34H9a3 3 0 0 1-3-3v-5"
              stroke={BRAND}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path d="M9 20h22" stroke={BRAND} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Home indicator */}
      <div
        className="absolute bottom-[9px] left-1/2 h-[5px] w-[138px] -translate-x-1/2 rounded-full"
        style={{ background: "rgba(27,35,51,0.28)" }}
      />
    </div>
  );
}
