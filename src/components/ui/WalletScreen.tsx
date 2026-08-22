"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mulberry32 } from "@/lib/rng";
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
  { name: "Contactless", detail: "Alger, DZ", state: "Sent", amount: "350,00", credit: false, time: "09:41", initials: "AL" },
  { name: "Marcus Lee", detail: "Transfer", state: "Sent", amount: "3 200,00", credit: false, time: "07:30", initials: "ML" },
  { name: "Evelyn Harper", detail: "Incoming", state: "Pending", amount: "1 500,00", credit: true, time: "19:12", initials: "EH" },
  { name: "Liam Patel", detail: "Transfer", state: "Received", amount: "4 000,00", credit: true, time: "20:05", initials: "LP" },
  { name: "Sophia Chen", detail: "Card payment", state: "Failed", amount: "500,00", credit: false, time: "19:45", initials: "SC" },
  { name: "Acme Corp", detail: "Invoice 8841", state: "Received", amount: "24 000,00", credit: true, time: "Yesterday", initials: "AC" },
  { name: "Aurès Energie", detail: "Direct debit", state: "Sent", amount: "890,00", credit: false, time: "Yesterday", initials: "AE" },
  { name: "Payroll", detail: "84 people", state: "Sent", amount: "128 400,00", credit: false, time: "Mon", initials: "PR" },
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
      className="flex h-[104px] w-full flex-col justify-between rounded-[24px] p-[14px] text-left transition-opacity duration-200 active:opacity-60"
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
      className="flex cursor-pointer items-center gap-[13px] py-[11px] transition-opacity duration-200 active:opacity-60">
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
        className="flex size-[36px] items-center justify-center rounded-full transition-opacity duration-200 active:opacity-60"
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
/**
 * A QR code drawn from the real anatomy: three finder eyes, the timing rows
 * that run between them, an alignment block, a quiet zone, and a data field.
 *
 * The structure is genuine; the payload is not. A working code needs
 * Reed-Solomon over GF(256), the zigzag placement and mask scoring, which is
 * a few hundred lines to get subtly wrong — and a subtly wrong one does not
 * scan either. This reads as a QR at a glance, which is what a screenshot of
 * a product needs to do. Say the word and I will make it encode for real.
 */
const QR_N = 25;

function buildQr(): { on: boolean; kind: "finder" | "data" }[][] {
  const rand = mulberry32(0x9c0de);
  const g: { on: boolean; kind: "finder" | "data" }[][] = Array.from(
    { length: QR_N },
    () => Array.from({ length: QR_N }, () => ({ on: false, kind: "data" as const })),
  );
  const set = (r: number, cc: number, on: boolean, kind: "finder" | "data" = "data") => {
    if (r >= 0 && r < QR_N && cc >= 0 && cc < QR_N) g[r][cc] = { on, kind };
  };
  const reserved = new Set<string>();
  const reserve = (r: number, cc: number) => reserved.add(`${r},${cc}`);

  // Three finder eyes: a 7x7 ring, a gap, a 3x3 pupil — plus the separator.
  const finder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r += 1) {
      for (let cc = -1; cc <= 7; cc += 1) {
        const rr = top + r, ccc = left + cc;
        reserve(rr, ccc);
        const edge = r === 0 || r === 6 || cc === 0 || cc === 6;
        const pupil = r >= 2 && r <= 4 && cc >= 2 && cc <= 4;
        const inside = r >= 0 && r <= 6 && cc >= 0 && cc <= 6;
        set(rr, ccc, inside && (edge || pupil), "finder");
      }
    }
  };
  finder(0, 0);
  finder(0, QR_N - 7);
  finder(QR_N - 7, 0);

  // Timing: the alternating run that lets a scanner find the grid pitch.
  for (let i = 8; i < QR_N - 8; i += 1) {
    set(6, i, i % 2 === 0, "finder");
    set(i, 6, i % 2 === 0, "finder");
    reserve(6, i);
    reserve(i, 6);
  }

  // Alignment block, bottom-right.
  const a = QR_N - 7;
  for (let r = -2; r <= 2; r += 1) {
    for (let cc = -2; cc <= 2; cc += 1) {
      reserve(a + r, a + cc);
      set(a + r, a + cc, Math.max(Math.abs(r), Math.abs(cc)) !== 1, "finder");
    }
  }

  // The field, and a clearing in the middle for the mark to sit in.
  const mid = Math.floor(QR_N / 2);
  for (let r = 0; r < QR_N; r += 1) {
    for (let cc = 0; cc < QR_N; cc += 1) {
      if (reserved.has(`${r},${cc}`)) continue;
      if (Math.abs(r - mid) <= 2 && Math.abs(cc - mid) <= 2) continue;
      set(r, cc, rand() < 0.46);
    }
  }
  return g;
}

function QrCode({ c, size = 204 }: { c: C; size?: number }) {
  const grid = useMemo(() => buildQr(), []);
  const q = 2; // quiet zone, in modules
  const span = QR_N + q * 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${span} ${span}`} role="img"
         aria-label="Code to scan for these account details">
      <rect width={span} height={span} rx="3" fill={c.SURFACE} />
      {grid.map((row, r) =>
        row.map((m, cc) =>
          m.on ? (
            <rect
              key={`${r}-${cc}`}
              x={cc + q + 0.08} y={r + q + 0.08}
              width={0.84} height={0.84}
              rx={m.kind === "finder" ? 0.18 : 0.34}
              fill={c.FG}
            />
          ) : null,
        ),
      )}
      {/* The mark, in the clearing left for it. */}
      <g transform={`translate(${span / 2 - 2.4} ${span / 2 - 2.4})`}>
        <rect width="4.8" height="4.8" rx="1.5" fill={c.ACCENT} />
        <circle cx="2.4" cy="2.4" r="1.55" fill="none" stroke={c.ON_ACCENT} strokeWidth="0.42" />
        <line x1="2.4" y1="0.85" x2="2.4" y2="3.95" stroke={c.ON_ACCENT} strokeWidth="0.42" />
      </g>
    </svg>
  );
}

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
          className="flex size-[36px] shrink-0 items-center justify-center rounded-full transition-opacity duration-200 active:opacity-60"
          style={{ background: c.CHIP }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={c.FG} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12.5 4.5 7 10l5.5 5.5" />
          </svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: c.FG }}>{title}</span>
      </div>
      <div className="mt-[22px] px-[20px]">{children}</div>
      {footer ? <div className="absolute inset-x-0 bottom-[34px] px-[20px]">{footer}</div> : null}
    </div>
  );
}

/** The filled control every pushed screen finishes with. */
function Primary({ label, onPress, c }: { label: string; onPress: () => void; c: C }) {
  return (
    <button
      type="button" onClick={onPress} data-cursor="link"
      className="flex h-[54px] w-full items-center justify-center rounded-[20px] transition-opacity duration-200 active:opacity-60"
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
      <p className="mt-[6px]" style={{ fontSize: 42, fontWeight: 700, color: c.FG, letterSpacing: "-0.025em" }}>500,00</p>
      <div className="mt-[18px]">
        <Field label="They receive" value="500,00 DZD" c={c} />
        <Field label="Fee" value="0,00" c={c} />
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
      <div className="mt-[18px] flex flex-col items-center">
        <span className="rounded-[26px] p-[12px]" style={{ background: c.SURFACE }}>
          <QrCode c={c} />
        </span>
        <span className="mt-[12px]" style={{ fontSize: 13, color: c.MUTED }}>
          Scan to pay Amine
        </span>
      </div>
      <div className="mt-[18px]">
        <Field label="Account name" value="Amine Laissoub" c={c} />
        <Field label="IBAN" value="···· 4417" c={c} />
        <Field label="BIC" value="PXLYDZAL" c={c} />
      </div>
    </Pushed>
  );
}

function TopUpScreen({ onBack, c }: { onBack: () => void; c: C }) {
  const [amount, setAmount] = useState("5 000,00");
  const [done, setDone] = useState(false);
  return (
    <Pushed title="Top Up" onBack={onBack} c={c}
      footer={<Primary label={done ? "Added" : `Add ${amount}`} onPress={() => { setDone(true); window.setTimeout(onBack, 900); }} c={c} />}>
      <p style={{ fontSize: 15, fontWeight: 600, color: c.MUTED }}>Amount</p>
      <p className="mt-[6px]" style={{ fontSize: 42, fontWeight: 700, color: c.FG, letterSpacing: "-0.025em" }}>{amount}</p>
      <div className="mt-[16px] flex gap-[8px]">
        {["1 000,00", "5 000,00", "10 000,00"].map((v) => {
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
        <Field label="Fee" value="0,00" c={c} />
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
        <Field label="Account" value="Main · DZD" c={c} />
        <Field label="Reference" value={`PXY-${tx.initials}-8841`} c={c} />
      </div>
    </Pushed>
  );
}

/* A card is 85.60 x 53.98mm — 1.586 wide to tall. Held to that exactly, the
   stack's 362pt width gives 228 down, which was too much of the screen: the
   fan ran past where the copy comes over it and the front card's balance
   went with it. 200 is the compromise, 1.81:1 — a little wider than life,
   and still far off the 2.06 it started at, which read as a banner rather
   than a card. To have both, the stack would have to sit narrower than the
   margins it shares with everything else on the screen. */
const CARD_H = 200;
const CARD_STEP = 86;

/** The EMV contactless indicator, as it is printed on a card: four arcs
 *  about one centre, opening right, the innermost a short stub and each one
 *  three points further out. It was three arcs of equal radius set three
 *  points apart — three parallel bows, not a signal leaving a point.
 *
 *  Struck rather than drawn by hand: each arc is the same 100-degree sweep
 *  about (3,12), so the endpoints are r·cos50 across and r·sin50 up and
 *  down, and the four stay concentric by construction. */
/* Both marks are the supplied artwork, traced from the card design rather
   than reconstructed from a description of one — which is what the last two
   attempts were, and why neither landed. Figma's export wrapper is dropped:
   the backdrop-filter foreignObject, the inner-shadow filter and the
   clipPath were a background blur, a bevel and a rect the size of the
   viewBox, and the ids in them would have collided across three cards. The
   geometry is untouched. Colour is the one thing changed — the artwork is
   #1F1F1F for a light card and these are light marks on a dark one. */

/** The chip: a plate, its contacts, and the pad at the centre. */
function Chip({ size = 40, opacity = 0.85 }: { size?: number; opacity?: number }) {
  const ink = `rgba(236,233,225,${opacity})`;
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" fill="none" aria-hidden>
      <path
        d="M4.28613 0.299805H25.7139C27.9349 0.299805 29.7002 1.97571 29.7002 4V16C29.7002 18.0243 27.9349 19.7002 25.7139 19.7002H4.28613C2.06505 19.7002 0.299805 18.0243 0.299805 16V4C0.299805 1.97571 2.06505 0.299805 4.28613 0.299805Z"
        stroke={ink}
        strokeWidth="0.6"
      />
      <path d="M7.23207 0.5H7.76779V19.5H7.23207V13.5H0.535645V13H7.23207V7H0.535645V6.5H7.23207V0.5Z" fill={ink} />
      <path d="M22.4999 13H29.4642V13.5H22.4999V19.5H21.9642V9.5C21.9642 7.84314 23.4033 6.5 25.1785 6.5H29.4642V7H25.1785C23.6992 7 22.4999 8.11929 22.4999 9.5V13Z" fill={ink} />
      <path d="M22.4999 0.5H21.9642V4.5H22.4999V0.5Z" fill={ink} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.7499 10C18.7499 11.933 17.071 13.5 14.9999 13.5C12.9289 13.5 11.2499 11.933 11.2499 10C11.2499 8.067 12.9289 6.5 14.9999 6.5C17.071 6.5 18.7499 8.067 18.7499 10ZM18.2142 10C18.2142 11.6569 16.7751 13 14.9999 13C13.2247 13 11.7856 11.6569 11.7856 10C11.7856 8.34314 13.2247 7 14.9999 7C16.7751 7 18.2142 8.34314 18.2142 10Z"
        fill={ink}
      />
    </svg>
  );
}

/** The contactless mark: four arcs, filled and tapered rather than stroked,
 *  which is what makes it hold at this size where an even-weight arc did
 *  not. */
function Contactless({ opacity = 0.85, size = 30 }: { opacity?: number; size?: number }) {
  const ink = `rgba(236,233,225,${opacity})`;
  return (
    <svg width={size} height={(size * 23) / 24} viewBox="0 0 24 23" fill="none" aria-hidden
         style={{ transition: "opacity 260ms ease" }}>
      <path d="M3.22974 8.475C3.52974 8.85 3.75474 9.3 3.90474 9.75C4.05474 10.2 4.12974 10.725 4.12974 11.25C4.12974 11.775 4.05474 12.3 3.90474 12.75C3.75474 13.2 3.52974 13.65 3.22974 14.025C2.85474 14.55 2.92974 15.3 3.45474 15.675C3.97974 16.05 4.72974 15.975 5.10474 15.45C5.55474 14.85 5.85474 14.25 6.15474 13.5C6.45474 12.75 6.52974 12 6.52974 11.25C6.52974 10.5 6.37974 9.75 6.15474 9C5.92974 8.325 5.55474 7.65 5.10474 7.05C4.72974 6.525 3.97974 6.45 3.45474 6.825C2.92974 7.2 2.85474 7.95 3.22974 8.475Z" fill={ink} />
      <path d="M7.35473 6.3C8.25473 7.725 8.77973 9.45 8.77973 11.25C8.77973 13.05 8.25473 14.775 7.35473 16.2C6.97973 16.725 7.20473 17.475 7.72973 17.85C8.32973 18.225 9.00473 18 9.37973 17.475C10.5047 15.675 11.1797 13.575 11.1797 11.25C11.1797 9 10.5047 6.825 9.37973 5.025C9.00473 4.5 8.25473 4.275 7.72973 4.65C7.20473 5.025 6.97973 5.7 7.35473 6.3Z" fill={ink} />
      <path d="M11.7047 4.05C12.9797 6.15 13.6547 8.625 13.6547 11.25C13.6547 13.875 12.9047 16.35 11.7047 18.45C11.4047 19.05 11.5547 19.725 12.1547 20.1C12.7547 20.4 13.4297 20.25 13.8047 19.65C15.3047 17.175 16.1297 14.325 16.1297 11.25C16.1297 8.175 15.3047 5.325 13.8047 2.85C13.5047 2.25 12.7547 2.1 12.1547 2.4C11.5547 2.775 11.4047 3.45 11.7047 4.05Z" fill={ink} />
      <path d="M16.0547 1.8C17.6297 4.575 18.6047 7.8 18.6047 11.25C18.6047 14.7 17.7047 17.925 16.0547 20.7C15.7547 21.3 15.9047 21.975 16.5047 22.35C17.1047 22.65 17.7797 22.5 18.1547 21.9C19.9547 18.75 21.0047 15.15 21.0047 11.25C21.0047 7.35 19.9547 3.75 18.1547 0.6C17.8547 -0.0447035 17.1047 -0.15 16.5047 0.15C15.9047 0.45 15.7547 1.2 16.0547 1.8Z" fill={ink} />
    </svg>
  );
}

const CARDS = [
  { id: "primary", name: "Pixely Visa", num: "4021", bal: "412 800,00", cur: "DZD",
    tint: "linear-gradient(135deg,#2d46ff 0%,#1f33d6 46%,#0b1440 100%)", label: "Primary" },
  { id: "business", name: "Pixely Business", num: "8817", bal: "1 908 240,00", cur: "DZD",
    tint: "linear-gradient(135deg,#2a2f3c 0%,#14171e 52%,#05070a 100%)", label: "Business" },
  { id: "savings", name: "Pixely Savings", num: "2203", bal: "96 500,00", cur: "DZD",
    tint: "linear-gradient(135deg,#1d6a4f 0%,#124034 45%,#05100c 100%)", label: "Savings" },
];

/** The wallet as the device shows it once it has turned to face the reader. */
function CardsScreen({ c, pushIn }: { c: C; pushIn: string }) {
  /* The stack answers to the finger now. Tapping a card brings it to the
     front of the fan and the others close up behind it, which is the one
     gesture a wallet has; and the controls underneath follow whichever card
     is at the front, so the two halves of the screen are about the same
     card rather than about nothing in particular. */
  const [front, setFront] = useState(CARDS.length - 1);
  const [frozen, setFrozen] = useState<Record<string, boolean>>({});
  const [nfcOff, setNfcOff] = useState<Record<string, boolean>>({});

  /* Slots are places in the fan, not cards. The front card takes the last
     slot, where its whole face shows, and the rest keep their order above
     it. The list is never reordered — only each card's slot changes, so a
     card travels to its new place instead of appearing in it. */
  const order = CARDS.map((_, i) => i).filter((i) => i !== front).concat(front);
  const held = CARDS[front];
  const isFrozen = !!frozen[held.id];
  const nfcOn = !nfcOff[held.id];

  const rows = [
    {
      label: "Freeze card",
      value: isFrozen ? "On" : "Off",
      d: "M12 3v18M3 12h18M6 6l12 12M18 6 6 18",
      press: () => setFrozen((f) => ({ ...f, [held.id]: !f[held.id] })),
    },
    { label: "Spending limit", value: "250 000 DZD", d: "M4 18V8m5 10V5m5 13v-7m5 7V9" },
    {
      label: "Contactless",
      value: nfcOn ? "On" : "Off",
      d: "M6 8a8 8 0 0 1 0 8M10 5a13 13 0 0 1 0 14",
      press: () => setNfcOff((n) => ({ ...n, [held.id]: !n[held.id] })),
    },
  ];

  return (
    <div className="absolute inset-x-0 top-0 px-[20px]" style={{ paddingTop: 62 }}>
      <div className={pushIn}>
        <p style={{ fontSize: 13, color: c.MUTED, letterSpacing: "-0.01em" }}>Wallet</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: c.FG, letterSpacing: "-0.02em", marginTop: 2 }}>
          Virtual Cards
        </p>
      </div>

      {/* Height derived from the stack, not guessed: the cards are absolute,
          so a short container lets the last one overlap whatever follows. */}
      <div
        style={{
          position: "relative",
          marginTop: 22,
          height: (CARDS.length - 1) * CARD_STEP + CARD_H,
        }}
      >
        {CARDS.map((card, i) => {
          const slot = order.indexOf(i);
          const atFront = i === front;
          const off = !!frozen[card.id];
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setFront(i)}
              aria-pressed={atFront}
              aria-label={`${card.name}, ${card.label.toLowerCase()} card${off ? ", frozen" : ""}`}
              data-cursor="link"
              className={pushIn}
              style={{
                position: "absolute",
                top: slot * CARD_STEP,
                left: 0,
                right: 0,
                height: CARD_H,
                zIndex: slot,
                /* Dealt in from the right, one after another. The ease has a
                   long tail rather than a bounce: these are cards being laid
                   down, not springs. */
                animationDelay: `${90 + i * 110}ms`,
                borderRadius: 22,
                padding: 18,
                textAlign: "left",
                background: card.tint,
                boxShadow: atFront
                  ? `0 28px 52px -18px ${c.SHADOW}`
                  : `0 20px 40px -18px ${c.SHADOW}`,
                border: "1px solid rgba(236,233,225,0.14)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                /* Frozen is a state you can see on the card, not a word in a
                   list somewhere else. */
                filter: off ? "saturate(0.2) brightness(0.72)" : "none",
                transition:
                  "top 460ms cubic-bezier(0.16,1,0.3,1), box-shadow 300ms ease, filter 320ms ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
                <div>
                  <p style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(236,233,225,0.62)" }}>
                    {off ? "FROZEN" : card.label.toUpperCase()}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#ece9e1", marginTop: 4 }}>{card.name}</p>
                </div>
                {/* The two marks stack in the corner, the chip under the
                    contactless. */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                  <Contactless opacity={nfcOff[card.id] ? 0.2 : 0.85} />
                  <Chip />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "rgba(236,233,225,0.55)", letterSpacing: "0.18em" }}>
                  •••• •••• •••• {card.num}
                </p>
                <p style={{ fontSize: 19, fontWeight: 700, color: "#ece9e1", marginTop: 6, letterSpacing: "-0.02em" }}>
                  {card.bal} <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.7 }}>{card.cur}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* The stack leaves the lower half of the screen empty, which reads as
          an unfinished screen rather than a spacious one. */}
      <div
        className={pushIn}
        style={{ marginTop: 26, animationDelay: `${90 + CARDS.length * 110}ms` }}
      >
        <p style={{ fontSize: 12, color: c.MUTED, letterSpacing: "0.06em" }}>
          CARD CONTROLS · {held.label.toUpperCase()}
        </p>
        <div
          style={{
            marginTop: 10,
            borderRadius: 18,
            background: c.PANEL,
            border: `1px solid ${c.SEP}`,
            overflow: "hidden",
          }}
        >
          {rows.map((row, i) => {
            const body = (
              <>
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    background: c.CHIP,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d={row.d} stroke={c.FG} strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </span>
                <span style={{ flex: 1, fontSize: 13.5, color: c.FG, textAlign: "left" }}>{row.label}</span>
                <span style={{ fontSize: 12.5, color: c.MUTED }}>{row.value}</span>
              </>
            );
            const style = {
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 14px",
              width: "100%",
              borderTop: i === 0 ? "none" : `1px solid ${c.SEP}`,
            } as const;
            return row.press ? (
              <button key={row.label} type="button" onClick={row.press} data-cursor="link"
                      aria-pressed={row.value === "On"} style={style}
                      className="transition-opacity duration-200 active:opacity-60">
                {body}
              </button>
            ) : (
              <div key={row.label} style={style}>{body}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function WalletScreen({
  showcase,
  enterFrom,
}: {
  showcase?: "cards" | null;
  /** Which way the last screen change came from, or null on first paint. */
  enterFrom?: "left" | "right" | null;
} = {}) {
  const pushIn = enterFrom === "right" ? "wallet-in" : enterFrom === "left" ? "wallet-in-back" : "";
  const [tab, setTab] = useState<Tab>("home");
  const [themeId, setThemeId] = useState<ThemeId>("dark");
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)", true);
  const mode: Mode = themeId === "system" ? (systemDark ? "dark" : "light") : themeId;
  const c = PALETTE[mode];

  const [view, setView] = useState<View>({ name: "none" });
  const home = () => setView({ name: "none" });

  /* The scroll owns the screen. If a flow was open when the reader scrolled —
     a transaction, Send, Receive — it has to close, because those views are
     pushed over whatever tab is showing and would keep painting over the
     wallet. Left alone, the phone appears stuck on whatever was open before
     the scroll, which is exactly how it looked.

     Adjusted during render rather than from an effect: this is React's own
     pattern for reacting to a changed prop, and it avoids committing a frame
     that still shows the stale screen. */
  const [lastShowcase, setLastShowcase] = useState(showcase);
  if (showcase !== lastShowcase) {
    setLastShowcase(showcase);
    setView({ name: "none" });
    setTab("home");
  }
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
      {showcase === "cards" && <CardsScreen c={c} pushIn={pushIn} />}

      {/* The tab, and under a pushed screen it stops answering the pointer.
          It is still painted — a pushed screen is opaque and covers it — but
          painted over and untouchable are not the same thing here, and the
          difference is where the back button went.

          The phone sits inside a preserve-3d subtree, and in one the browser's
          hit-testing does not follow paint order: the pushed screen comes
          later in the DOM and paints on top, and the tab underneath still
          answered for the same pixel. The back button is 36px in the pushed
          header, the avatar is 44px in the tab header, and they sit on the
          same corner — so a click on Back landed on the avatar behind it and
          the screen never went anywhere. elementsFromPoint listed the button
          on top while elementFromPoint returned the avatar, which is the two
          orders disagreeing in one call. A z-index on the pushed screen does
          not settle it; taking the layer underneath out of the hit test
          does. */}
      <div className={view.name === "none" ? undefined : "pointer-events-none"}>
      {!showcase && tab === "home" && (
        /* Keyed on the direction, so returning to this screen replays the
           animation rather than the element being reused untouched. */
        <div key={`home-${enterFrom ?? "first"}`} className={pushIn}>
          <div className="absolute inset-x-0 top-0 bottom-0 rounded-b-[26px]" style={{ background: c.PANEL }}>
            <div className="h-[54px]" />

            <div className="flex items-center gap-[12px] px-[20px]">
              {/* The avatar and the greeting are one control — it is how you
                  reach the profile, so it names who you are rather than the
                  account. */}
              <button
                type="button" onClick={() => setCopied(true)} data-cursor="link"
                aria-label="Open profile"
                className="flex min-w-0 flex-1 items-center gap-[12px] text-left transition-opacity duration-200 active:opacity-60"
              >
                <span className="size-[44px] shrink-0 rounded-full"
                      style={{ background: "radial-gradient(120% 120% at 30% 22%, #bfe9ff 0%, #7ea8f5 45%, #5b3fd6 100%)" }} />
                <span className="min-w-0">
                  <span className="block truncate" style={{ fontSize: 17, fontWeight: 700, color: c.FG }}>Hi, Amine</span>
                  <span className="block truncate" style={{ fontSize: 14, color: c.MUTED }}>
                    {copied ? "Profile" : "Main account · DZD"}
                  </span>
                </span>
              </button>
              <ThemeSelect value={themeId} onChange={setThemeId} c={c} />
            </div>

            <div className="mt-[18px] px-[20px]">
              <p style={{ fontSize: 40, fontWeight: 700, color: c.FG, letterSpacing: "-0.025em" }}>12 481,43</p>
              <p className="mt-[2px]" style={{ fontSize: 15, color: c.MUTED }}>
                <span style={{ color: c.UP, fontWeight: 600 }}>+286,27</span> today
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
        </div>
      )}

      {!showcase && tab === "search" && <SearchScreen c={c} onOpen={openTx} />}
      {!showcase && tab === "activity" && <ActivityScreen c={c} onOpen={openTx} />}
      </div>

      {/* Pushed over whichever tab is showing, under the tab bar. */}
      {view.name === "send" && <SendScreen onBack={home} c={c} />}
      {view.name === "receive" && <ReceiveScreen onBack={home} c={c} />}
      {view.name === "topup" && <TopUpScreen onBack={home} c={c} />}
      {view.name === "tx" && <TxScreen tx={view.tx} onBack={home} c={c} />}

      {/* Hidden while a flow is open: these screens are pushed over the tab,
          not a fourth tab, so the bar has nothing to say there. */}
      {view.name === "none" && !showcase && (
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
      )}
    </div>
  );
}
