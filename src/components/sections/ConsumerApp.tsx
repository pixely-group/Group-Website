"use client";

import { useEffect, useRef, useState } from "react";
import PhoneShell from "@/components/ui/PhoneShell";
import { gsap } from "@/lib/gsap";

/**
 * The surface the end customer holds, built on the layer the rest of this
 * page describes. Drawn in the site's own language — ink, hairlines, mono
 * micro-labels, tabular numerals — so it reads as this company's app rather
 * than a stock fintech mock.
 */
const FG = "#ece9e1";
const MUTED = "rgba(236,233,225,0.52)";
const FAINT = "rgba(236,233,225,0.32)";
const LINE = "rgba(236,233,225,0.13)";
/** Lifted tint: the primary only reaches ~3:1 on ink. */
const ACCENT = "#7290ff";
const SOLID = "#2d46ff";

type ScreenId = "home" | "card" | "send";

const SCREENS: { id: ScreenId; label: string; note: string }[] = [
  {
    id: "home",
    label: "Balance",
    note: "Every currency they hold, on one screen, updated the moment a payment settles — not overnight, off a file.",
  },
  {
    id: "card",
    label: "Card",
    note: "Freeze, limits and controls are evaluated at the policy layer in under a millisecond. No support ticket, no waiting.",
  },
  {
    id: "send",
    label: "Send",
    note: "The rate is held before they confirm, and the money is with the recipient in about four seconds.",
  },
];

const mono = "var(--font-mono)";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: mono,
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: FAINT,
      }}
    >
      {children}
    </p>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      data-cursor="link"
      className="relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-300"
      style={{
        background: on ? SOLID : "rgba(236,233,225,0.12)",
        boxShadow: on ? "none" : `inset 0 0 0 1px ${LINE}`,
      }}
    >
      <span
        className="absolute top-[3px] size-[20px] rounded-full transition-[left] duration-300 ease-(--ease-out-expo)"
        style={{ left: on ? 21 : 3, background: on ? FG : "rgba(236,233,225,0.55)" }}
      />
    </button>
  );
}

function StatusBar() {
  return (
    <div className="flex h-[52px] items-center justify-between px-[26px] pt-[4px]">
      <span
        style={{ fontFamily: mono, fontSize: 13, letterSpacing: "0.04em", color: FG }}
      >
        9:41
      </span>
      <span className="flex items-center gap-[6px]" aria-hidden>
        <svg width="16" height="10" viewBox="0 0 16 10" fill={FG}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.2} y={7 - i * 2.2} width="2.6" height={3 + i * 2.2} rx="0.8" />
          ))}
        </svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
          <rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke={FG} strokeOpacity="0.45" />
          <rect x="2" y="2" width="15" height="7" rx="1.8" fill={FG} />
          <path d="M22.4 3.6v3.8a2 2 0 0 0 0-3.8Z" fill={FG} fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

function TabBar({
  active,
  onSelect,
}: {
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
}) {
  const icons: Record<ScreenId, React.ReactNode> = {
    home: <path d="M3 9.5 11 3l8 6.5V19H3V9.5Z" />,
    card: <path d="M2.5 5.5h17v11h-17v-11Zm0 4h17" />,
    send: <path d="M11 18V5m0 0-5 5m5-5 5 5" />,
  };
  return (
    <div
      className="absolute inset-x-0 bottom-0 flex h-[74px] items-start justify-around pt-[13px]"
      style={{ borderTop: `1px solid ${LINE}`, background: "#0a0a0b" }}
    >
      {SCREENS.map((s) => {
        const on = s.id === active;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            aria-current={on ? "page" : undefined}
            data-cursor="link"
            className="flex w-[76px] flex-col items-center gap-[7px] transition-opacity duration-300"
            style={{ opacity: on ? 1 : 0.42 }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
                 stroke={on ? ACCENT : FG} strokeWidth="1.6" strokeLinejoin="round">
              {icons[s.id]}
            </svg>
            <span
              style={{
                fontFamily: mono, fontSize: 9, letterSpacing: "0.14em",
                textTransform: "uppercase", color: on ? ACCENT : FG,
              }}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function HomeScreen() {
  const accounts = [
    ["EUR", "Euro", "€12,480.65"],
    ["USD", "US Dollar", "$3,204.00"],
    ["GBP", "Sterling", "£860.40"],
  ];
  const actions = [
    ["Send", "M11 17V5m0 0-4.5 4.5M11 5l4.5 4.5"],
    ["Request", "M11 5v12m0 0 4.5-4.5M11 17l-4.5-4.5"],
    ["Top up", "M11 5v12M5 11h12"],
  ];
  return (
    <div className="px-[26px] pt-[10px]">
      <Label>Main account · EUR</Label>
      <p
        className="mt-[14px] leading-none"
        style={{ fontFamily: mono, fontSize: 44, letterSpacing: "-0.035em", color: FG, fontVariantNumeric: "tabular-nums" }}
      >
        €12,480.65
      </p>
      <p className="mt-[12px]" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT }}>
        +€1,204.10 this month
      </p>

      <div className="mt-[26px] grid grid-cols-3 gap-[9px]">
        {actions.map(([label, d]) => (
          <div key={label} className="flex flex-col items-center gap-[10px] rounded-[6px] py-[16px]"
               style={{ border: `1px solid ${LINE}` }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={ACCENT} strokeWidth="1.6" strokeLinejoin="round">
              <path d={d} />
            </svg>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-[30px]"><Label>Accounts</Label></div>
      <ul className="mt-[6px]">
        {accounts.map(([code, name, bal]) => (
          <li key={code} className="flex items-center justify-between py-[15px]" style={{ borderTop: `1px solid ${LINE}` }}>
            <span className="flex items-baseline gap-[12px]">
              <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: "0.1em", color: FG }}>{code}</span>
              <span style={{ fontSize: 13, color: MUTED }}>{name}</span>
            </span>
            <span style={{ fontFamily: mono, fontSize: 14, color: FG, fontVariantNumeric: "tabular-nums" }}>{bal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CardScreen() {
  const [frozen, setFrozen] = useState(false);
  const [online, setOnline] = useState(true);
  const [contactless, setContactless] = useState(true);

  return (
    <div className="px-[26px] pt-[10px]">
      <Label>Card · Virtual</Label>

      <div
        className="relative mt-[14px] h-[196px] overflow-hidden rounded-[10px] p-[20px] transition-opacity duration-500"
        style={{
          border: `1px solid ${frozen ? "rgba(236,233,225,0.18)" : "rgba(114,144,255,0.5)"}`,
          background: frozen
            ? "linear-gradient(150deg,#111113 0%,#0c0d10 100%)"
            : "linear-gradient(150deg,#16183a 0%,#0c0d16 62%)",
          opacity: frozen ? 0.62 : 1,
        }}
      >
        <div className="flex items-start justify-between">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="9.5" stroke={FG} strokeWidth="1.6" />
            <line x1="11" y1="1" x2="11" y2="21" stroke={FG} strokeWidth="1.6" />
          </svg>
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: frozen ? FAINT : ACCENT }}>
            {frozen ? "Frozen" : "Active"}
          </span>
        </div>
        <p className="mt-[46px]" style={{ fontFamily: mono, fontSize: 17, letterSpacing: "0.14em", color: FG }}>
          ···· ···· ···· 4021
        </p>
        <div className="mt-[22px] flex items-end justify-between">
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}>
            A. Laissoub
          </span>
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", color: MUTED }}>09/29</span>
        </div>
      </div>

      <div className="mt-[22px] flex items-center justify-between py-[14px]" style={{ borderTop: `1px solid ${LINE}` }}>
        <span style={{ fontSize: 15, color: FG }}>Freeze card</span>
        <Switch on={frozen} onClick={() => setFrozen((v) => !v)} />
      </div>

      <div className="py-[14px]" style={{ borderTop: `1px solid ${LINE}` }}>
        <div className="flex items-center justify-between">
          <Label>Monthly limit</Label>
          <span style={{ fontFamily: mono, fontSize: 12, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
            €1,812 / €4,000
          </span>
        </div>
        <div className="mt-[11px] h-[3px] w-full" style={{ background: "rgba(236,233,225,0.1)" }}>
          <div className="h-full" style={{ width: "45%", background: ACCENT }} />
        </div>
      </div>

      {([["Online payments", online, setOnline], ["Contactless", contactless, setContactless]] as const).map(
        ([label, value, set]) => (
          <div key={label} className="flex items-center justify-between py-[14px]" style={{ borderTop: `1px solid ${LINE}` }}>
            <span style={{ fontSize: 15, color: frozen ? FAINT : FG }}>{label}</span>
            <Switch on={frozen ? false : value} onClick={() => !frozen && set((v) => !v)} />
          </div>
        ),
      )}

      {/* The first of these is the same authorisation the security chapter
          takes apart layer by layer — the tap, then what the tap costs. */}
      <div className="mt-[16px] pt-[16px]" style={{ borderTop: `1px solid ${LINE}` }}>
        <Label>On this card</Label>
        <ul className="mt-[4px]">
          {([
            ["Contactless · Lisbon, PT", "−€48.20", "09:41"],
            ["Top-up · Apple Pay", "+€250.00", "Yesterday"],
          ] as const).map(([what, amount, when]) => (
            <li key={what} className="flex items-center justify-between py-[13px]"
                style={{ borderTop: `1px solid ${LINE}` }}>
              <span>
                <span className="block" style={{ fontSize: 14, color: FG }}>{what}</span>
                <span className="block" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: FAINT }}>
                  {when}
                </span>
              </span>
              <span style={{ fontFamily: mono, fontSize: 14, color: FG, fontVariantNumeric: "tabular-nums" }}>
                {amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SendScreen() {
  return (
    <div className="px-[26px] pt-[10px]">
      <Label>To</Label>
      <div className="mt-[12px] flex items-center gap-[14px] pb-[18px]" style={{ borderBottom: `1px solid ${LINE}` }}>
        <span
          className="flex size-[42px] items-center justify-center rounded-full"
          style={{ border: `1px solid ${LINE}`, fontFamily: mono, fontSize: 13, color: ACCENT }}
        >
          EH
        </span>
        <span>
          <span className="block" style={{ fontSize: 16, color: FG }}>Evelyn Harper</span>
          <span className="block" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", color: FAINT }}>
            IBAN ···· 4417
          </span>
        </span>
      </div>

      <div className="mt-[22px]"><Label>You send</Label></div>
      <p className="mt-[12px] leading-none" style={{ fontFamily: mono, fontSize: 44, letterSpacing: "-0.035em", color: FG, fontVariantNumeric: "tabular-nums" }}>
        €500.00
      </p>

      <div className="mt-[24px] rounded-[6px]" style={{ border: `1px solid ${LINE}` }}>
        {([["They receive", "$541.85"], ["Rate", "1 EUR = 1.0837"], ["Fee", "€0.00"]] as const).map(
          ([k, v], i) => (
            <div key={k} className="flex items-center justify-between px-[16px] py-[13px]"
                 style={i ? { borderTop: `1px solid ${LINE}` } : undefined}>
              <Label>{k}</Label>
              <span style={{ fontFamily: mono, fontSize: 13, color: FG, fontVariantNumeric: "tabular-nums" }}>{v}</span>
            </div>
          ),
        )}
      </div>

      <p className="mt-[18px]" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT }}>
        Arrives in ~4 seconds
      </p>

      <div
        className="mt-[20px] flex h-[52px] items-center justify-center rounded-[6px]"
        style={{ background: SOLID, color: FG, fontSize: 15, fontWeight: 600 }}
      >
        Confirm transfer
      </div>
    </div>
  );
}

export default function ConsumerApp() {
  const [screen, setScreen] = useState<ScreenId>("home");
  const paneRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // The screen changes the way an app's would: the outgoing view is gone
  // before the incoming one arrives, rather than crossfading through itself.
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      pane,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", overwrite: true },
    );
  }, [screen]);

  const note = SCREENS.find((s) => s.id === screen)!.note;

  return (
    <section
      id="app"
      data-theme="ink"
      className="relative bg-theme px-6 py-[16vh] text-theme sm:px-10 lg:px-14"
    >
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-20">
        <div>
          <p className="type-label section-index mb-6 text-(--muted)">
            04 — In the hand
          </p>
          <h2 className="type-headline text-big max-w-[15ch] text-balance">
            The part your customers actually hold.
          </h2>
          <p className="mt-8 max-w-md text-[0.95rem] leading-relaxed text-(--muted)">
            Pixely is invisible to them. What they see is a balance that is
            always right, a card they can freeze between one tap and the next,
            and money that lands before they put the phone down.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <span className="type-label text-(--faint)">Screen</span>
            <div
              role="radiogroup"
              aria-label="App screen"
              className="inline-flex items-center gap-1 rounded-(--radius-chip) border border-(--line-strong) p-1"
            >
              {SCREENS.map((s) => {
                const on = s.id === screen;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setScreen(s.id)}
                    data-cursor="link"
                    className={`type-label rounded-[2px] px-3 py-2 transition-colors duration-300 ${
                      on ? "bg-signal text-bone" : "text-(--muted) hover:text-(--fg)"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p
            key={screen}
            className="mt-7 max-w-sm border-t border-(--line) pt-5 text-[0.9rem] leading-relaxed text-(--muted)"
          >
            {note}
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <PhoneShell className="h-[min(82svh,700px)]">
            <div className="flex size-full flex-col" style={{ background: "#0a0a0b" }}>
              <StatusBar />
              <div ref={paneRef} className="min-h-0 flex-1 overflow-hidden pb-[74px]">
                {screen === "home" && <HomeScreen />}
                {screen === "card" && <CardScreen />}
                {screen === "send" && <SendScreen />}
              </div>
              <TabBar active={screen} onSelect={setScreen} />
            </div>
          </PhoneShell>
        </div>
      </div>
    </section>
  );
}
