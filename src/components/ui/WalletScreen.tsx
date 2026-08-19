"use client";

import { useState } from "react";

/**
 * The HeroUI Pro crypto-wallet template, rebuilt for the web.
 *
 * The original ships as Expo / React Native — Skia sparklines, Reanimated,
 * expo-blur — none of which run in this app, so the layout is reproduced in
 * DOM at the same proportions: the split view with its drag handle, the
 * 112pt quick-action cards, the asset rows with a 72 x 32 sparkline, and the
 * floating pill tab bar. Its deterministic series generator is ported as-is,
 * so the sparklines are the curves the template would draw.
 *
 * Assets are currency pairs rather than tokens. Pixely settles fiat, and the
 * brief for this site rules out crypto motifs — the template's structure
 * carries over exactly, since an FX pair has a price, a 24h change and a
 * curve just as a token does.
 */

const BG = "#060607";
const PANEL = "#0b0b0d";
const SURFACE = "#18181d";
const FG = "#ece9e1";
const MUTED = "rgba(236,233,225,0.52)";
const FAINT = "rgba(236,233,225,0.34)";
const SEP = "rgba(236,233,225,0.10)";
const ACCENT = "#2d46ff";
const ACCENT_FG = "#9fb4ff";
const UP = "#42c48a";
const DOWN = "#e2614a";

const mono = "var(--font-mono)";

/* — Ported from the template: FNV-1a mixer plus a slow sine, a faster
     harmonic and a linear drift, which together read as a real curve. */
function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

function sparkPath(key: string, change: number, w = 72, h = 32, n = 40): string {
  const seed = hashString(key);
  const phase = (seed % 360) * (Math.PI / 180);
  const harmonicPhase = ((seed >>> 8) % 360) * (Math.PI / 180);
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const sine = Math.sin(phase + t * Math.PI * 2);
    const harmonic = Math.sin(harmonicPhase + t * Math.PI * 6) * 0.35;
    values.push((sine + harmonic) * 0.5 * 0.6 + change * 26 * t);
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

type Asset = {
  name: string;
  ticker: string;
  price: string;
  change: number;
  symbol: string;
};

const ASSETS: Asset[] = [
  { name: "Euro", ticker: "EUR / USD", price: "1.0837", change: 0.0061, symbol: "€" },
  { name: "Sterling", ticker: "GBP / USD", price: "1.2714", change: -0.0032, symbol: "£" },
  { name: "Yen", ticker: "USD / JPY", price: "151.42", change: 0.0094, symbol: "¥" },
  { name: "Swiss franc", ticker: "USD / CHF", price: "0.8829", change: -0.0018, symbol: "₣" },
  { name: "Aussie dollar", ticker: "AUD / USD", price: "0.6592", change: 0.0047, symbol: "$" },
  { name: "Canadian dollar", ticker: "USD / CAD", price: "1.3618", change: 0.0026, symbol: "$" },
];

const ACTIVITY = [
  ["Contactless · Lisbon", "−€48.20", "09:41", false],
  ["Payroll run · 84 people", "−€128,400.00", "08:02", false],
  ["Acme Corp · invoice", "+€24,000.00", "Yesterday", true],
  ["FX · EUR to USD", "+$54,185.00", "Yesterday", true],
] as const;

const pct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(2)}%`;

function TrendChip({ change, size = 11 }: { change: number; size?: number }) {
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: size,
        letterSpacing: "0.04em",
        color: change >= 0 ? UP : DOWN,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {pct(change)}
    </span>
  );
}

/** 112pt quick-action tile: round icon chip above, label below. */
function QuickAction({ label, d }: { label: string; d: string }) {
  return (
    <div
      className="flex size-[112px] shrink-0 flex-col justify-between rounded-[24px] p-[14px]"
      style={{ background: SURFACE, boxShadow: `inset 0 0 0 1px ${SEP}` }}
    >
      <span
        className="flex size-[32px] items-center justify-center rounded-full"
        style={{ background: "rgba(236,233,225,0.08)" }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={ACCENT_FG} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} />
        </svg>
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, color: FG }}>{label}</span>
    </div>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  const up = asset.change >= 0;
  return (
    <li className="flex items-center gap-[12px] py-[10px]">
      <span
        className="flex size-[40px] shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(236,233,225,0.06)", boxShadow: `inset 0 0 0 1px ${SEP}`, color: FG, fontSize: 16 }}
      >
        {asset.symbol}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate" style={{ fontSize: 15, color: FG }}>{asset.name}</span>
        <span className="block" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: FAINT }}>
          {asset.ticker}
        </span>
      </span>
      <svg width="72" height="32" viewBox="0 0 72 32" fill="none" className="shrink-0" aria-hidden>
        <path d={sparkPath(asset.ticker, asset.change)} stroke={up ? UP : DOWN} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="shrink-0 text-right" style={{ minWidth: 64 }}>
        <span className="block" style={{ fontFamily: mono, fontSize: 14, color: FG, fontVariantNumeric: "tabular-nums" }}>
          {asset.price}
        </span>
        <TrendChip change={asset.change} />
      </span>
    </li>
  );
}

type Tab = "home" | "activity" | "search";

export default function WalletScreen() {
  const [tab, setTab] = useState<Tab>("home");
  /** The template's SplitView snaps the top section between three stops and
   *  opens at the middle one, just under the quick actions. Reproduced as
   *  two: at rest the markets list fills the sheet, and the handle drops it
   *  to the stop that uncovers recent activity. */
  const [expanded, setExpanded] = useState(false);

  const tabs: { id: Tab; label: string; d: string }[] = [
    { id: "home", label: "Home", d: "M3 9.5 11 3l8 6.5V19H3V9.5Z" },
    { id: "search", label: "Search", d: "M9 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm4.8-1.7L19 19" },
    { id: "activity", label: "Activity", d: "M2.5 11h4l2.5-6 3.5 12 2.5-6h4" },
  ];

  const sheetTop = expanded ? 636 : 336;

  return (
    <div className="relative size-full overflow-hidden" style={{ background: BG, fontFamily: "var(--font-archivo)" }}>
      {/* — Top section */}
      <div className="absolute inset-x-0 top-0 rounded-b-[26px]" style={{ background: PANEL, bottom: 0 }}>
        <div className="h-[54px]" />

        <div className="flex items-center gap-[12px] px-[20px]">
          <span
            className="size-[40px] shrink-0 rounded-full"
            style={{ background: "radial-gradient(120% 120% at 30% 22%, #4a5cf0 0%, #1d2450 60%, #0d1030 100%)", boxShadow: `inset 0 0 0 1px ${SEP}` }}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate" style={{ fontSize: 16, fontWeight: 600, color: FG }}>
              Main account
            </span>
            <span className="flex items-center gap-[6px]" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.08em", color: FAINT }}>
              IBAN ···· 4417
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke={FAINT} strokeWidth="1.4" aria-hidden>
                <rect x="4.6" y="4.6" width="8" height="8" rx="1.6" />
                <path d="M9.4 1.4h-8v8" />
              </svg>
            </span>
          </span>
          <span className="flex size-[34px] items-center justify-center rounded-full" style={{ boxShadow: `inset 0 0 0 1px ${SEP}` }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={MUTED} strokeWidth="1.5" aria-hidden>
              <circle cx="9" cy="9" r="4" />
              <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M14.6 3.4l-1.4 1.4M4.8 13.2l-1.4 1.4" strokeLinecap="round" />
            </svg>
          </span>
        </div>

        <div className="mt-[22px] px-[20px]">
          <p style={{ fontFamily: mono, fontSize: 30, fontWeight: 700, color: FG, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
            $12,481.43
          </p>
          <p className="mt-[5px] flex items-center gap-[6px]">
            <span style={{ fontFamily: mono, fontSize: 12, color: UP, fontVariantNumeric: "tabular-nums" }}>+$286.27</span>
            <span style={{ fontSize: 12, color: MUTED }}>today</span>
          </p>
        </div>

        {/* Horizontally scrolling row — the fourth tile clips, as on device */}
        <div className="mt-[18px] flex gap-[8px] overflow-hidden pl-[20px]">
          <QuickAction label="Send" d="M10 16V4m0 0-4 4m4-4 4 4" />
          <QuickAction label="Receive" d="M10 4v12m0 0 4-4m-4 4-4-4" />
          <QuickAction label="Convert" d="M3 7h11m0 0-3-3m3 3-3 3M17 13H6m0 0 3-3m-3 3 3 3" />
          <QuickAction label="Buy/Sell" d="M2.5 5.5h15v9h-15v-9Zm0 3.5h15" />
        </div>

        <div className="mt-[26px] px-[20px]">
          <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: FAINT }}>
            Recent activity
          </p>
          <ul className="mt-[8px]">
            {ACTIVITY.slice(0, 3).map(([what, amount, when, credit]) => (
              <li key={what} className="flex items-center justify-between py-[11px]" style={{ borderTop: `1px solid ${SEP}` }}>
                <span className="min-w-0 pr-3">
                  <span className="block truncate" style={{ fontSize: 14, color: FG }}>{what}</span>
                  <span className="block" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: FAINT }}>{when}</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 13, color: credit ? UP : FG, fontVariantNumeric: "tabular-nums" }}>{amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* — Bottom section of the split view */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-[26px] transition-[top] duration-500 ease-(--ease-out-expo)"
        style={{ top: sheetTop, background: PANEL, boxShadow: `0 -1px 0 ${SEP}, 0 -24px 40px -24px rgba(0,0,0,0.9)` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse asset list" : "Expand asset list"}
          data-cursor="link"
          className="flex h-[26px] w-full items-center justify-center"
        >
          <span className="h-[4px] w-[38px] rounded-full" style={{ background: "rgba(236,233,225,0.22)" }} />
        </button>

        <div className="flex items-center justify-between pt-[4px] pr-[16px] pb-[6px] pl-[20px]">
          <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: FAINT }}>
            {tab === "activity" ? "All activity" : "Explore markets"}
          </p>
          <span
            className="rounded-full px-[12px] py-[6px]"
            style={{ fontSize: 12, color: MUTED, boxShadow: `inset 0 0 0 1px ${SEP}` }}
          >
            Manage
          </span>
        </div>

        <ul className="px-[20px]">
          {tab === "activity"
            ? ACTIVITY.map(([what, amount, when, credit]) => (
                <li key={what} className="flex items-center justify-between py-[13px]" style={{ borderTop: `1px solid ${SEP}` }}>
                  <span className="min-w-0 pr-3">
                    <span className="block truncate" style={{ fontSize: 15, color: FG }}>{what}</span>
                    <span className="block" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: FAINT }}>{when}</span>
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 14, color: credit ? UP : FG, fontVariantNumeric: "tabular-nums" }}>{amount}</span>
                </li>
              ))
            : ASSETS.map((a) => <AssetRow key={a.ticker} asset={a} />)}
        </ul>
      </div>

      {/* — Floating pill tab bar */}
      <div className="absolute inset-x-0 bottom-[16px] flex justify-center">
        <div
          className="flex items-center gap-[4px] rounded-full p-[6px]"
          style={{ background: SURFACE, boxShadow: `inset 0 0 0 1px ${SEP}, 0 12px 26px -10px rgba(0,0,0,0.9)` }}
        >
          {tabs.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-label={t.label}
                aria-current={on ? "page" : undefined}
                data-cursor="link"
                className="flex h-[44px] w-[56px] items-center justify-center rounded-full transition-colors duration-300"
                style={{ background: on ? ACCENT : "transparent" }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
                     stroke={on ? FG : "rgba(236,233,225,0.5)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
