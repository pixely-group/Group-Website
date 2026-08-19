"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/hooks";

/**
 * The HeroUI Pro crypto-wallet template, rebuilt for the web.
 *
 * The original ships as Expo — Skia sparklines, Reanimated, expo-blur — so
 * none of it runs here and the layout is reproduced in DOM at the template's
 * own proportions. Everything else is taken from the source rather than
 * approximated: its deterministic series generator, its mock wallet and
 * assets with their 24h changes, and its three-stop SplitView.
 *
 * The colours are the real ones. They are not in the project the way the
 * fonts are — every semantic name resolves out of `heroui-native/styles`,
 * which lives in node_modules — so they were read from that package at the
 * version the template pins (1.0.8) and its oklch and color-mix expressions
 * resolved through a browser's own colour engine.
 */
type Mode = "dark" | "light";
type ThemeId = Mode | "system";

const PALETTE: Record<Mode, Record<string, string>> = {
  light: {
    BG: "#ebebeb", // background-secondary: the app's outermost surface
    PANEL: "#f5f5f5", // background: the split view's two sections
    SURFACE: "#ffffff", // cards, tab bar, the Manage pill
    CHIP: "#d8d8d8", // separator-secondary, at the template's 30%
    FG: "#18181b",
    MUTED: "#71717a",
    SEP: "#dddee1", // border
    HANDLE: "#aaaaad", // separator
    ACCENT: "#0485f7",
    ON_ACCENT: "#fcfcfc",
    UP: "#17c964",
    DOWN: "#ff383c",
    SHADOW: "rgba(24,24,27,0.10)",
  },
  dark: {
    BG: "#0c0c0e",
    PANEL: "#060607",
    SURFACE: "#18181b",
    CHIP: "#343437",
    FG: "#fcfcfc",
    MUTED: "#9f9fa9",
    SEP: "#28282c",
    HANDLE: "#47474b",
    ACCENT: "#0485f7",
    ON_ACCENT: "#fcfcfc",
    UP: "#17c964",
    DOWN: "#db3b3e",
    SHADOW: "rgba(0,0,0,0.7)",
  },
};

type C = Record<string, string>;

const font = "var(--font-nunito)";
const SCREEN_H = 874;
/** The template's SplitView stops: under the header, under the quick
 *  actions, and as low as the tab bar allows. It opens at the middle. */
const SNAPS = [150, 336, 630] as const;

type Tx = {
  name: string;
  detail: string;
  state: "Sent" | "Received" | "Pending" | "Failed";
  amount: string;
  credit: boolean;
  time: string;
  /** Two-letter monogram, in place of the brand marks tokens carried. */
  initials: string;
};

/* The people and states from the original design, on the transactions a bank
   actually shows: a card tap, a transfer out, one still clearing, one that
   did not go through. */
const TRANSACTIONS: Tx[] = [
  { name: "Contactless", detail: "Lisbon, PT", state: "Sent", amount: "48.20", credit: false, time: "09:41", initials: "LX" },
  { name: "Marcus Lee", detail: "Transfer", state: "Sent", amount: "3,200.00", credit: false, time: "07:30", initials: "ML" },
  { name: "Evelyn Harper", detail: "Incoming", state: "Pending", amount: "1,500.00", credit: true, time: "19:12", initials: "EH" },
  { name: "Liam Patel", detail: "Transfer", state: "Received", amount: "4,000.00", credit: true, time: "20:05", initials: "LP" },
  { name: "Sophia Chen", detail: "Card payment", state: "Failed", amount: "500.00", credit: false, time: "19:45", initials: "SC" },
  { name: "Acme Corp", detail: "Invoice 8841", state: "Received", amount: "24,000.00", credit: true, time: "Yesterday", initials: "AC" },
  { name: "Northwind Labs", detail: "Direct debit", state: "Sent", amount: "890.00", credit: false, time: "Yesterday", initials: "NL" },
  { name: "Payroll", detail: "84 people", state: "Sent", amount: "128,400.00", credit: false, time: "Mon", initials: "PR" },
];

function StateMark({ state, c }: { state: Tx["state"]; c: C }) {
  const tint =
    state === "Failed" ? c.DOWN : state === "Pending" ? c.MUTED : c.MUTED;
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke={tint} strokeWidth="1.6" aria-hidden>
      <circle cx="10" cy="10" r="8" />
      {state === "Sent" && <path d="M7.4 12.6 12.6 7.4M8.6 7.4h4v4" strokeLinecap="round" />}
      {state === "Received" && <path d="M12.6 7.4 7.4 12.6M11.4 12.6h-4v-4" strokeLinecap="round" />}
      {state === "Pending" && <path d="M10 6.2V10l2.4 1.6" strokeLinecap="round" />}
      {state === "Failed" && <path d="m7.6 7.6 4.8 4.8m0-4.8-4.8 4.8" strokeLinecap="round" />}
    </svg>
  );
}

function QuickAction({ label, d, c, onPress }: { label: string; d: string; c: C; onPress: () => void }) {
  return (
    <button
      type="button" onClick={onPress} data-cursor="link" aria-label={label}
      className="flex h-[104px] w-full flex-col justify-between rounded-[24px] p-[14px] text-left transition-transform duration-200 active:scale-[0.97]"
      style={{ background: c.SURFACE }}
    >
      <span className="flex size-[32px] items-center justify-center rounded-full" style={{ background: c.CHIP }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={c.FG} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} />
        </svg>
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, color: c.FG }}>{label}</span>
    </button>
  );
}

function TxRow({ t, c, onOpen }: { t: Tx; c: C; onOpen: (t: Tx) => void }) {
  return (
    <li
      role="button" tabIndex={0} data-cursor="link"
      onClick={() => onOpen(t)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(t); } }}
      className="flex cursor-pointer items-center gap-[13px] py-[11px] transition-transform duration-200 active:scale-[0.99]">
      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-full"
            style={{ background: c.CHIP, color: c.FG, fontSize: 14, fontWeight: 700 }}>
        {t.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate" style={{ fontSize: 15, fontWeight: 600, color: c.FG }}>{t.name}</span>
        <span className="mt-[1px] flex items-center gap-[6px]" style={{ fontSize: 13, color: t.state === "Failed" ? c.DOWN : c.MUTED }}>
          <StateMark state={t.state} c={c} />
          {t.state === "Sent" || t.state === "Received" ? t.detail : t.state}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block" style={{ fontSize: 15, fontWeight: 700, color: t.credit ? c.UP : c.FG }}>
          {t.credit ? "+" : "−"} {t.amount}
        </span>
        <span className="block" style={{ fontSize: 12, color: c.MUTED }}>{t.time}</span>
      </span>
    </li>
  );
}

/** The template's gear-triggered theme picker: Light, Dark, System. */
function ThemeSelect({ value, onChange, c }: { value: ThemeId; onChange: (v: ThemeId) => void; c: C }) {
  const [open, setOpen] = useState(false);
  const options: { id: ThemeId; label: string; icon: React.ReactNode }[] = [
    { id: "light", label: "Light", icon: <><circle cx="9" cy="9" r="3.6" /><path d="M9 1.4v2M9 14.6v2M1.4 9h2M14.6 9h2M3.6 3.6 5 5M13 13l1.4 1.4M14.4 3.6 13 5M5 13l-1.4 1.4" strokeLinecap="round" /></> },
    { id: "dark", label: "Dark", icon: <path d="M15.2 10.6A6.6 6.6 0 0 1 7.4 2.8a6.6 6.6 0 1 0 7.8 7.8Z" strokeLinejoin="round" /> },
    { id: "system", label: "System", icon: <><rect x="2.2" y="3.4" width="13.6" height="9.4" rx="1.6" /><path d="M6.6 15.6h4.8" strokeLinecap="round" /></> },
  ];
  return (
    <div className="relative shrink-0">
      <button
        type="button" onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu" aria-expanded={open} aria-label="Switch theme" data-cursor="link"
        className="flex size-[36px] items-center justify-center rounded-full transition-transform duration-200 active:scale-[0.94]"
        style={{ background: c.CHIP }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={c.FG} strokeWidth="1.6" aria-hidden>
          <circle cx="10" cy="10" r="2.8" />
          <path d="M10 1.6v1.8M10 16.6v1.8M1.6 10h1.8M16.6 10h1.8M4.1 4.1l1.3 1.3M14.6 14.6l1.3 1.3M15.9 4.1l-1.3 1.3M5.4 14.6l-1.3 1.3" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button" aria-label="Close theme menu" tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            role="menu"
            className="absolute top-[44px] right-0 z-20 w-[176px] overflow-hidden rounded-[20px] py-[6px]"
            style={{ background: c.SURFACE, boxShadow: `0 18px 40px -12px ${c.SHADOW}, inset 0 0 0 1px ${c.SEP}` }}
          >
            {options.map((o) => (
              <button
                key={o.id} type="button" role="menuitemradio" aria-checked={value === o.id}
                onClick={() => { onChange(o.id); setOpen(false); }}
                data-cursor="link"
                className="flex w-full items-center gap-[10px] px-[14px] py-[11px]"
              >
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke={c.MUTED} strokeWidth="1.5" aria-hidden>
                  {o.icon}
                </svg>
                <span className="flex-1 text-left" style={{ fontSize: 16, color: c.FG }}>{o.label}</span>
                {value === o.id && (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={c.ACCENT} strokeWidth="2.1" aria-hidden>
                    <path d="m3 8.6 3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Anything pushed over the home screen: a title, a way back, and a body. */
function Pushed({
  title, onBack, c, children, footer,
}: {
  title: string;
  onBack: () => void;
  c: C;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0" style={{ background: c.PANEL }}>
      <div className="h-[54px]" />
      <div className="flex items-center gap-[12px] px-[20px]">
        <button
          type="button" onClick={onBack} aria-label="Back" data-cursor="link"
          className="flex size-[36px] shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-[0.94]"
          style={{ background: c.CHIP }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={c.FG} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12.5 4.5 7 10l5.5 5.5" />
          </svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: c.FG }}>{title}</span>
      </div>
      <div className="mt-[22px] px-[20px]">{children}</div>
      {footer ? <div className="absolute inset-x-0 bottom-[104px] px-[20px]">{footer}</div> : null}
    </div>
  );
}

/** The filled control every pushed screen finishes with. */
function Primary({ label, onPress, c }: { label: string; onPress: () => void; c: C }) {
  return (
    <button
      type="button" onClick={onPress} data-cursor="link"
      className="flex h-[54px] w-full items-center justify-center rounded-[20px] transition-transform duration-200 active:scale-[0.98]"
      style={{ background: c.ACCENT, color: c.ON_ACCENT, fontSize: 16, fontWeight: 700 }}
    >
      {label}
    </button>
  );
}

function Field({ label, value, c }: { label: string; value: string; c: C }) {
  return (
    <div className="flex items-center justify-between py-[14px]" style={{ borderTop: `1px solid ${c.SEP}` }}>
      <span style={{ fontSize: 15, color: c.MUTED }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: c.FG }}>{value}</span>
    </div>
  );
}

function SearchScreen({ c, onOpen }: { c: C; onOpen: (t: Tx) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const hits = TRANSACTIONS.filter(
    (t) => !q || t.name.toLowerCase().includes(q) || t.detail.toLowerCase().includes(q),
  );
  return (
    <div className="absolute inset-x-0 top-[54px] bottom-[92px] overflow-hidden px-[20px]">
      <label className="flex items-center gap-[10px] rounded-[18px] px-[14px] py-[12px]" style={{ background: c.SURFACE }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke={c.MUTED} strokeWidth="1.8" aria-hidden>
          <circle cx="8.6" cy="8.6" r="5.6" /><path d="m12.8 12.8 4 4" strokeLinecap="round" />
        </svg>
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, merchants, amounts" data-cursor="text"
          className="w-full bg-transparent outline-none"
          style={{ fontSize: 15, color: c.FG }}
        />
      </label>
      <p className="mt-[20px]" style={{ fontSize: 15, fontWeight: 600, color: c.MUTED }}>
        {q ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "Recent"}
      </p>
      <ul className="mt-[2px]">{hits.map((t) => <TxRow key={t.name} t={t} c={c} onOpen={onOpen} />)}</ul>
    </div>
  );
}

function ActivityScreen({ c, onOpen }: { c: C; onOpen: (t: Tx) => void }) {
  return (
    <div className="absolute inset-x-0 top-[54px] bottom-[92px] overflow-hidden px-[20px]">
      <p style={{ fontSize: 15, fontWeight: 600, color: c.MUTED }}>All activity</p>
      <ul className="mt-[2px]">{TRANSACTIONS.map((t) => <TxRow key={t.name} t={t} c={c} onOpen={onOpen} />)}</ul>
    </div>
  );
}

type Tab = "home" | "search" | "activity";
/** What is pushed over the tab, if anything. */
type View =
  | { name: "none" }
  | { name: "send" }
  | { name: "receive" }
  | { name: "topup" }
  | { name: "tx"; tx: Tx };

function SendScreen({ onBack, c }: { onBack: () => void; c: C }) {
  const [done, setDone] = useState(false);
  return (
    <Pushed title="Send" onBack={onBack} c={c}
      footer={<Primary label={done ? "Sent" : "Confirm transfer"} onPress={() => { setDone(true); window.setTimeout(onBack, 900); }} c={c} />}>
      <p style={{ fontSize: 15, fontWeight: 600, color: c.MUTED }}>To</p>
      <div className="mt-[10px] flex items-center gap-[13px] pb-[16px]" style={{ borderBottom: `1px solid ${c.SEP}` }}>
        <span className="flex size-[42px] items-center justify-center rounded-full"
              style={{ background: c.CHIP, color: c.FG, fontSize: 14, fontWeight: 700 }}>EH</span>
        <span>
          <span className="block" style={{ fontSize: 16, fontWeight: 600, color: c.FG }}>Evelyn Harper</span>
          <span className="block" style={{ fontSize: 13, color: c.MUTED }}>IBAN ···· 4417</span>
        </span>
      </div>
      <p className="mt-[22px]" style={{ fontSize: 15, fontWeight: 600, color: c.MUTED }}>Amount</p>
      <p className="mt-[6px]" style={{ fontSize: 42, fontWeight: 700, color: c.FG, letterSpacing: "-0.025em" }}>500.00</p>
      <div className="mt-[18px]">
        <Field label="They receive" value="500.00 EUR" c={c} />
        <Field label="Fee" value="0.00" c={c} />
        <Field label="Arrives" value="~4 seconds" c={c} />
      </div>
    </Pushed>
  );
}

function ReceiveScreen({ onBack, c }: { onBack: () => void; c: C }) {
  const [copied, setCopied] = useState(false);
  return (
    <Pushed title="Receive" onBack={onBack} c={c}
      footer={<Primary label={copied ? "Copied" : "Copy details"} onPress={() => setCopied(true)} c={c} />}>
      <p style={{ fontSize: 15, color: c.MUTED }}>
        Share these details to be paid into your main account.
      </p>
      {/* A code, drawn rather than generated — it is a still of a product. */}
      <div className="mt-[20px] flex justify-center">
        <div className="grid size-[150px] grid-cols-9 gap-[3px] rounded-[18px] p-[14px]"
             style={{ background: c.SURFACE }} aria-hidden>
          {Array.from({ length: 81 }, (_, i) => {
            const corner = (i % 9 < 3 && i < 27) || (i % 9 > 5 && i < 27) || (i % 9 < 3 && i > 53);
            const on = corner ? (i % 9) % 2 === 0 || i % 7 === 0 : (i * 7 + Math.floor(i / 9) * 3) % 5 < 2;
            return <span key={i} style={{ background: on ? c.FG : "transparent", borderRadius: 1 }} />;
          })}
        </div>
      </div>
      <div className="mt-[18px]">
        <Field label="Account name" value="Amine Laissoub" c={c} />
        <Field label="IBAN" value="···· 4417" c={c} />
        <Field label="BIC" value="PXLYGB21" c={c} />
      </div>
    </Pushed>
  );
}

function TopUpScreen({ onBack, c }: { onBack: () => void; c: C }) {
  const [amount, setAmount] = useState("250.00");
  const [done, setDone] = useState(false);
  return (
    <Pushed title="Top Up" onBack={onBack} c={c}
      footer={<Primary label={done ? "Added" : `Add ${amount}`} onPress={() => { setDone(true); window.setTimeout(onBack, 900); }} c={c} />}>
      <p style={{ fontSize: 15, fontWeight: 600, color: c.MUTED }}>Amount</p>
      <p className="mt-[6px]" style={{ fontSize: 42, fontWeight: 700, color: c.FG, letterSpacing: "-0.025em" }}>{amount}</p>
      <div className="mt-[16px] flex gap-[8px]">
        {["50.00", "250.00", "1,000.00"].map((v) => {
          const on = v === amount;
          return (
            <button key={v} type="button" onClick={() => setAmount(v)} data-cursor="link"
              className="flex-1 rounded-[16px] py-[12px] transition-colors duration-200"
              style={{ background: on ? c.ACCENT : c.SURFACE, color: on ? c.ON_ACCENT : c.FG, fontSize: 14, fontWeight: 600 }}>
              {v}
            </button>
          );
        })}
      </div>
      <div className="mt-[20px]">
        <Field label="From" value="Card ···· 4021" c={c} />
        <Field label="Fee" value="0.00" c={c} />
        <Field label="Available instantly" value="Yes" c={c} />
      </div>
    </Pushed>
  );
}

function TxScreen({ tx, onBack, c }: { tx: Tx; onBack: () => void; c: C }) {
  return (
    <Pushed title="Transaction" onBack={onBack} c={c}>
      <div className="flex flex-col items-center pt-[6px]">
        <span className="flex size-[62px] items-center justify-center rounded-full"
              style={{ background: c.CHIP, color: c.FG, fontSize: 20, fontWeight: 700 }}>
          {tx.initials}
        </span>
        <span className="mt-[14px]" style={{ fontSize: 17, fontWeight: 600, color: c.FG }}>{tx.name}</span>
        <span className="mt-[6px]" style={{ fontSize: 34, fontWeight: 700, color: tx.credit ? c.UP : c.FG, letterSpacing: "-0.02em" }}>
          {tx.credit ? "+" : "−"} {tx.amount}
        </span>
        <span className="mt-[8px] flex items-center gap-[7px]"
              style={{ fontSize: 14, color: tx.state === "Failed" ? c.DOWN : c.MUTED }}>
          <StateMark state={tx.state} c={c} />
          {tx.state}
        </span>
      </div>
      <div className="mt-[24px]">
        <Field label="Type" value={tx.detail} c={c} />
        <Field label="When" value={tx.time} c={c} />
        <Field label="Account" value="Main · EUR" c={c} />
        <Field label="Reference" value={`PXL-${tx.initials}-8841`} c={c} />
      </div>
    </Pushed>
  );
}

export default function WalletScreen() {
  const [tab, setTab] = useState<Tab>("home");
  const [themeId, setThemeId] = useState<ThemeId>("dark");
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)", true);
  const mode: Mode = themeId === "system" ? (systemDark ? "dark" : "light") : themeId;
  const c = PALETTE[mode];

  const [view, setView] = useState<View>({ name: "none" });
  const home = () => setView({ name: "none" });
  const openTx = (tx: Tx) => setView({ name: "tx", tx });
  const [snap, setSnap] = useState(1);
  const [dragTop, setDragTop] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startY: number; startTop: number } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(t);
  }, [copied]);

  const sheetTop = dragTop ?? SNAPS[snap];
  const scaleOf = () => (rootRef.current?.getBoundingClientRect().height ?? SCREEN_H) / SCREEN_H;

  const onDragStart = (e: React.PointerEvent) => {
    const s = scaleOf();
    drag.current = { id: e.pointerId, startY: e.clientY / s, startTop: sheetTop };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* no capture available; the drag still tracks over the handle */
    }
    setDragTop(sheetTop);
  };
  const onDragMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const next = d.startTop + (e.clientY / scaleOf() - d.startY);
    setDragTop(Math.min(SNAPS[SNAPS.length - 1], Math.max(SNAPS[0], next)));
  };
  const onDragEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const landed = dragTop ?? sheetTop;
    let best = 0;
    SNAPS.forEach((v: number, i: number) => {
      if (Math.abs(v - landed) < Math.abs(SNAPS[best] - landed)) best = i;
    });
    setSnap(best);
    setDragTop(null);
  };

  const tabs: { id: Tab; label: string; d: string }[] = [
    { id: "home", label: "Home", d: "M3 9.5 11 3l8 6.5V19H3V9.5Z" },
    { id: "search", label: "Search", d: "M9.6 15.6a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm4.4-1.6L19 19" },
    { id: "activity", label: "Activity", d: "M11 5.4V11l3.6 2.2M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" },
  ];

  return (
    <div
      ref={rootRef}
      data-wallet
      data-cursor-theme={mode === "light" ? "bone" : "ink"}
      className="relative size-full overflow-hidden"
      style={{ background: c.BG, fontFamily: font }}
    >
      {tab === "home" && (
        <>
          <div className="absolute inset-x-0 top-0 bottom-0 rounded-b-[26px]" style={{ background: c.PANEL }}>
            <div className="h-[54px]" />

            <div className="flex items-center gap-[12px] px-[20px]">
              {/* The avatar and the greeting are one control — it is how you
                  reach the profile, so it names who you are rather than the
                  account. */}
              <button
                type="button" onClick={() => setCopied(true)} data-cursor="link"
                aria-label="Open profile"
                className="flex min-w-0 flex-1 items-center gap-[12px] text-left transition-transform duration-200 active:scale-[0.99]"
              >
                <span className="size-[44px] shrink-0 rounded-full"
                      style={{ background: "radial-gradient(120% 120% at 30% 22%, #bfe9ff 0%, #7ea8f5 45%, #5b3fd6 100%)" }} />
                <span className="min-w-0">
                  <span className="block truncate" style={{ fontSize: 17, fontWeight: 700, color: c.FG }}>Hi, Amine</span>
                  <span className="block truncate" style={{ fontSize: 14, color: c.MUTED }}>
                    {copied ? "Profile" : "Main account · EUR"}
                  </span>
                </span>
              </button>
              <ThemeSelect value={themeId} onChange={setThemeId} c={c} />
            </div>

            <div className="mt-[18px] px-[20px]">
              <p style={{ fontSize: 40, fontWeight: 700, color: c.FG, letterSpacing: "-0.025em" }}>12,481.43</p>
              <p className="mt-[2px]" style={{ fontSize: 15, color: c.MUTED }}>
                <span style={{ color: c.UP, fontWeight: 600 }}>+286.27</span> today
              </p>
            </div>

            {/* Three, and they now share the width instead of the fourth
                hanging off the edge. */}
            <div className="mt-[16px] grid grid-cols-3 gap-[9px] px-[20px]">
              <QuickAction label="Send" d="M6.5 13.5 13.5 6.5M7.5 6.5h6v6" c={c} onPress={() => setView({ name: "send" })} />
              <QuickAction label="Receive" d="M13.5 6.5 6.5 13.5M12.5 13.5h-6v-6" c={c} onPress={() => setView({ name: "receive" })} />
              <QuickAction label="Top Up" d="M10 4.5v11M4.5 10h11" c={c} onPress={() => setView({ name: "topup" })} />
            </div>
          </div>

          <div
            className={`absolute inset-x-0 bottom-0 rounded-t-[26px] ${dragTop === null ? "transition-[top] duration-500 ease-(--ease-out-expo)" : ""}`}
            style={{ top: sheetTop, background: c.PANEL }}
          >
            <button
              type="button"
              onPointerDown={onDragStart} onPointerMove={onDragMove}
              onPointerUp={onDragEnd} onPointerCancel={onDragEnd}
              onClick={() => setSnap((v) => (v + 1) % SNAPS.length)}
              aria-label="Drag to resize the transaction list" data-cursor="link"
              className="flex h-[30px] w-full touch-none items-center justify-center"
            >
              <span className="h-[5px] w-[40px] rounded-full" style={{ background: c.HANDLE }} />
            </button>

            <div className="flex items-center justify-between pt-[2px] pr-[16px] pb-[4px] pl-[20px]">
              <p style={{ fontSize: 17, fontWeight: 600, color: c.MUTED }}>Recent Transactions</p>
              <span className="rounded-full px-[16px] py-[8px]" style={{ fontSize: 14, fontWeight: 600, color: c.FG, background: c.SURFACE }}>
                See all
              </span>
            </div>

            <ul className="px-[20px]">
              {TRANSACTIONS.map((t) => <TxRow key={t.name} t={t} c={c} onOpen={openTx} />)}
            </ul>
          </div>
        </>
      )}

      {tab === "search" && <SearchScreen c={c} onOpen={openTx} />}
      {tab === "activity" && <ActivityScreen c={c} onOpen={openTx} />}

      {/* Pushed over whichever tab is showing, under the tab bar. */}
      {view.name === "send" && <SendScreen onBack={home} c={c} />}
      {view.name === "receive" && <ReceiveScreen onBack={home} c={c} />}
      {view.name === "topup" && <TopUpScreen onBack={home} c={c} />}
      {view.name === "tx" && <TxScreen tx={view.tx} onBack={home} c={c} />}

      <div className="absolute inset-x-0 bottom-[16px] flex justify-center">
        <div className="flex items-center gap-[4px] rounded-full p-[6px]"
             style={{ background: c.SURFACE, boxShadow: `0 12px 26px -10px ${c.SHADOW}` }}>
          {tabs.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id} type="button" onClick={() => { setTab(t.id); home(); }}
                aria-label={t.label} aria-current={on ? "page" : undefined} data-cursor="link"
                className="flex h-[44px] w-[56px] items-center justify-center rounded-full transition-colors duration-300"
                style={{ background: on ? c.ACCENT : "transparent" }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
                     stroke={on ? c.ON_ACCENT : c.MUTED} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d={t.d} />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
