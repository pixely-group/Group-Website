"use client";

import { useRef, useState } from "react";

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

type Mode = "dark" | "light";

/**
 * Both of the app's appearances. The accent stays the brand blue in each,
 * but the tint that reads on it does not: on ink the primary only reaches
 * ~3:1, so the icons lift, while on paper the primary itself is the
 * strongest thing available.
 */
const PALETTE: Record<Mode, Record<string, string>> = {
  dark: {
    BG: "#060607",
    PANEL: "#0b0b0d",
    SURFACE: "#18181d",
    FG: "#ece9e1",
    MUTED: "rgba(236,233,225,0.52)",
    FAINT: "rgba(236,233,225,0.34)",
    SEP: "rgba(236,233,225,0.10)",
    ACCENT: "#2d46ff",
    ACCENT_FG: "#9fb4ff",
    ON_ACCENT: "#ece9e1",
    UP: "#42c48a",
    DOWN: "#e2614a",
    CHIP: "rgba(236,233,225,0.08)",
    DISC: "rgba(236,233,225,0.06)",
    HANDLE: "rgba(236,233,225,0.22)",
    SHADOW: "rgba(0,0,0,0.9)",
  },
  light: {
    BG: "#e7e8ee",
    PANEL: "#fbfbfd",
    SURFACE: "#f1f2f7",
    FG: "#14161c",
    MUTED: "rgba(20,22,28,0.56)",
    FAINT: "rgba(20,22,28,0.40)",
    SEP: "rgba(20,22,28,0.11)",
    ACCENT: "#2d46ff",
    ACCENT_FG: "#2d46ff",
    ON_ACCENT: "#ffffff",
    UP: "#12855a",
    DOWN: "#c03c26",
    CHIP: "rgba(20,22,28,0.07)",
    DISC: "rgba(20,22,28,0.05)",
    HANDLE: "rgba(20,22,28,0.20)",
    SHADOW: "rgba(20,22,28,0.18)",
  },
};

type C = Record<string, string>;

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
  ["Card top-up · Apple Pay", "+€250.00", "Tue", true],
  ["Vantage Logistics · out", "−€9,340.11", "Tue", false],
  ["Hello Systems · invoice", "+€8,120.00", "Mon", true],
] as const;

const pct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(2)}%`;

function TrendChip({ change, size = 11, c }: { change: number; size?: number; c: C }) {
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: size,
        letterSpacing: "0.04em",
        color: change >= 0 ? c.UP : c.DOWN,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {pct(change)}
    </span>
  );
}

/** 112pt quick-action tile: round icon chip above, label below. */
function QuickAction({ label, d, c }: { label: string; d: string; c: C }) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-cursor="link"
      className="flex size-[112px] shrink-0 flex-col justify-between rounded-[24px] p-[14px] transition-transform duration-200 active:scale-[0.97]"
      style={{ background: c.SURFACE, boxShadow: `inset 0 0 0 1px ${c.SEP}` }}
    >
      <span
        className="flex size-[32px] items-center justify-center rounded-full"
        style={{ background: c.CHIP }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={c.ACCENT_FG} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} />
        </svg>
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, color: c.FG }}>{label}</span>
    </div>
  );
}

function AssetRow({ asset, c }: { asset: Asset; c: C }) {
  const up = asset.change >= 0;
  return (
    <li
      role="button"
      tabIndex={0}
      data-cursor="link"
      className="flex items-center gap-[12px] py-[10px] transition-transform duration-200 active:scale-[0.99]"
    >
      <span
        className="flex size-[40px] shrink-0 items-center justify-center rounded-full"
        style={{ background: c.DISC, boxShadow: `inset 0 0 0 1px ${c.SEP}`, color: c.FG, fontSize: 16 }}
      >
        {asset.symbol}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate" style={{ fontSize: 15, color: c.FG }}>{asset.name}</span>
        <span className="block" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: c.FAINT }}>
          {asset.ticker}
        </span>
      </span>
      <svg width="72" height="32" viewBox="0 0 72 32" fill="none" className="shrink-0" aria-hidden>
        <path d={sparkPath(asset.ticker, asset.change)} stroke={up ? c.UP : c.DOWN} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="shrink-0 text-right" style={{ minWidth: 64 }}>
        <span className="block" style={{ fontFamily: mono, fontSize: 14, color: c.FG, fontVariantNumeric: "tabular-nums" }}>
          {asset.price}
        </span>
        <TrendChip change={asset.change} c={c} />
      </span>
    </li>
  );
}

type Tab = "home" | "activity" | "search";

/** The screen's own height in logical points — the drag needs it to turn a
 *  pointer delta on a scaled device back into screen-space pixels. */
const SCREEN_H = 874;

/**
 * The template's SplitView snaps the top section to three heights: just under
 * the header, just under the quick actions, and as low as the tab bar allows.
 * The sheet's top edge is that height, and it opens at the middle one.
 */
const SNAPS = [148, 336, 632] as const;

/** The template's search route: a field, a favourites row, and a list that
 *  narrows as you type. */
function SearchScreen({ c }: { c: C }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const hits = ASSETS.filter(
    (a) => !q || a.name.toLowerCase().includes(q) || a.ticker.toLowerCase().includes(q),
  );
  return (
    <div className="absolute inset-x-0 top-[54px] bottom-[92px] overflow-hidden px-[20px]">
      <label className="flex items-center gap-[10px] rounded-[14px] px-[14px] py-[11px]"
             style={{ background: c.SURFACE, boxShadow: `inset 0 0 0 1px ${c.SEP}` }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke={c.MUTED} strokeWidth="1.7" aria-hidden>
          <circle cx="8.6" cy="8.6" r="5.6" />
          <path d="m12.8 12.8 4 4" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search markets"
          data-cursor="text"
          className="w-full bg-transparent outline-none"
          style={{ fontSize: 15, color: c.FG }}
        />
      </label>

      <p className="mt-[20px]" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: c.FAINT }}>
        Favourites
      </p>
      <div className="mt-[10px] flex gap-[8px] overflow-hidden">
        {ASSETS.slice(0, 3).map((a) => (
          <div key={a.ticker} className="w-[104px] shrink-0 rounded-[16px] p-[12px]"
               style={{ background: c.SURFACE, boxShadow: `inset 0 0 0 1px ${c.SEP}` }}>
            <span className="block" style={{ fontSize: 20, color: c.FG }}>{a.symbol}</span>
            <span className="mt-[6px] block" style={{ fontFamily: mono, fontSize: 12, color: c.FG, fontVariantNumeric: "tabular-nums" }}>{a.price}</span>
            <span className="mt-[2px] block"><TrendChip change={a.change} c={c} size={10} /></span>
          </div>
        ))}
      </div>

      <p className="mt-[20px]" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: c.FAINT }}>
        {q ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "Top markets"}
      </p>
      <ul className="mt-[2px]">
        {hits.map((a) => <AssetRow key={a.ticker} asset={a} c={c} />)}
      </ul>
    </div>
  );
}

/** The template's activity route. */
function ActivityScreen({ c }: { c: C }) {
  return (
    <div className="absolute inset-x-0 top-[54px] bottom-[92px] overflow-hidden px-[20px]">
      <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: c.FAINT }}>
        All activity
      </p>
      <ul className="mt-[6px]">
        {ACTIVITY.map(([what, amount, when, credit]) => (
          <li key={what} className="flex items-center justify-between py-[13px] transition-transform duration-200 active:scale-[0.99]"
              style={{ borderTop: `1px solid ${c.SEP}` }}>
            <span className="min-w-0 pr-3">
              <span className="block truncate" style={{ fontSize: 15, color: c.FG }}>{what}</span>
              <span className="block" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: c.FAINT }}>{when}</span>
            </span>
            <span style={{ fontFamily: mono, fontSize: 14, color: credit ? c.UP : c.FG, fontVariantNumeric: "tabular-nums" }}>{amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WalletScreen() {
  const [tab, setTab] = useState<Tab>("home");
  const [mode, setMode] = useState<Mode>("dark");
  const c = PALETTE[mode];
  const [snap, setSnap] = useState(1);
  /** Live top edge while a drag is in flight; null when settled on a snap. */
  const [dragTop, setDragTop] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startY: number; startTop: number } | null>(null);

  const tabs: { id: Tab; label: string; d: string }[] = [
    { id: "home", label: "Home", d: "M3 9.5 11 3l8 6.5V19H3V9.5Z" },
    { id: "search", label: "Search", d: "M9 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm4.8-1.7L19 19" },
    { id: "activity", label: "Activity", d: "M2.5 11h4l2.5-6 3.5 12 2.5-6h4" },
  ];

  const sheetTop = dragTop ?? SNAPS[snap];

  const onDragStart = (e: React.PointerEvent) => {
    const root = rootRef.current;
    if (!root) return;
    // The device is drawn at 874pt and rendered at whatever the hero gives
    // it, so a pointer delta has to be divided back by that scale or the
    // sheet moves at the wrong rate.
    const scale = root.getBoundingClientRect().height / SCREEN_H;
    drag.current = { id: e.pointerId, startY: e.clientY / scale, startTop: sheetTop };
    // Capture keeps the drag alive if the pointer leaves the handle. It
    // throws for a pointer the element never saw, which must not take the
    // drag down with it.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* no capture available; the drag still tracks while over the handle */
    }
    setDragTop(sheetTop);
  };

  const onDragMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const root = rootRef.current;
    if (!d || d.id !== e.pointerId || !root) return;
    const scale = root.getBoundingClientRect().height / SCREEN_H;
    const next = d.startTop + (e.clientY / scale - d.startY);
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

  return (
    <div
      ref={rootRef}
      data-wallet
      data-cursor-theme={mode === "light" ? "bone" : "ink"}
      className="relative size-full overflow-hidden"
      style={{ background: c.BG, fontFamily: "var(--font-archivo)" }}
    >
      {tab === "home" && (
        <>
      {/* — Top section */}
      <div className="absolute inset-x-0 top-0 rounded-b-[26px]" style={{ background: c.PANEL, bottom: 0 }}>
        <div className="h-[54px]" />

        <div className="flex items-center gap-[12px] px-[20px]">
          <span
            className="size-[40px] shrink-0 rounded-full"
            style={{ background: "radial-gradient(120% 120% at 30% 22%, #4a5cf0 0%, #1d2450 60%, #0d1030 100%)", boxShadow: `inset 0 0 0 1px ${c.SEP}` }}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate" style={{ fontSize: 16, fontWeight: 600, color: c.FG }}>
              Main account
            </span>
            <span className="flex items-center gap-[6px]" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.08em", color: c.FAINT }}>
              IBAN ···· 4417
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke={c.FAINT} strokeWidth="1.4" aria-hidden>
                <rect x="4.6" y="4.6" width="8" height="8" rx="1.6" />
                <path d="M9.4 1.4h-8v8" />
              </svg>
            </span>
          </span>
          {/* The template's theme control, wired up. It shows the mode it
              will move to, not the one it is in. */}
          <button
            type="button"
            onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
            aria-label={mode === "dark" ? "Switch app to light mode" : "Switch app to dark mode"}
            data-cursor="link"
            className="flex size-[34px] shrink-0 items-center justify-center rounded-full"
            style={{ boxShadow: `inset 0 0 0 1px ${c.SEP}` }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={c.MUTED} strokeWidth="1.5" aria-hidden>
              {mode === "dark" ? (
                <>
                  <circle cx="9" cy="9" r="4" />
                  <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M14.6 3.4l-1.4 1.4M4.8 13.2l-1.4 1.4" strokeLinecap="round" />
                </>
              ) : (
                <path d="M15.2 10.6A6.6 6.6 0 0 1 7.4 2.8a6.6 6.6 0 1 0 7.8 7.8Z" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        <div className="mt-[22px] px-[20px]">
          <p style={{ fontFamily: mono, fontSize: 30, fontWeight: 700, color: c.FG, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
            $12,481.43
          </p>
          <p className="mt-[5px] flex items-center gap-[6px]">
            <span style={{ fontFamily: mono, fontSize: 12, color: c.UP, fontVariantNumeric: "tabular-nums" }}>+$286.27</span>
            <span style={{ fontSize: 12, color: c.MUTED }}>today</span>
          </p>
        </div>

        {/* Horizontally scrolling row — the fourth tile clips, as on device */}
        <div className="mt-[18px] flex gap-[8px] overflow-hidden pl-[20px]">
          <QuickAction label="Send" d="M10 16V4m0 0-4 4m4-4 4 4" c={c} />
          <QuickAction label="Receive" d="M10 4v12m0 0 4-4m-4 4-4-4" c={c} />
          <QuickAction label="Convert" d="M3 7h11m0 0-3-3m3 3-3 3M17 13H6m0 0 3-3m-3 3 3 3" c={c} />
          <QuickAction label="Buy/Sell" d="M2.5 5.5h15v9h-15v-9Zm0 3.5h15" c={c} />
        </div>

        <div className="mt-[26px] px-[20px]">
          <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: c.FAINT }}>
            Recent activity
          </p>
          <ul className="mt-[8px]">
            {ACTIVITY.slice(0, 3).map(([what, amount, when, credit]) => (
              <li key={what} className="flex items-center justify-between py-[11px]" style={{ borderTop: `1px solid ${c.SEP}` }}>
                <span className="min-w-0 pr-3">
                  <span className="block truncate" style={{ fontSize: 14, color: c.FG }}>{what}</span>
                  <span className="block" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: c.FAINT }}>{when}</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 13, color: credit ? c.UP : c.FG, fontVariantNumeric: "tabular-nums" }}>{amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* — Bottom section of the split view */}
      <div
        className={`absolute inset-x-0 bottom-0 rounded-t-[26px] ${dragTop === null ? "transition-[top] duration-500 ease-(--ease-out-expo)" : ""}`}
        style={{ top: sheetTop, background: c.PANEL, boxShadow: `0 -1px 0 ${c.SEP}, 0 -24px 40px -24px ${c.SHADOW}` }}
      >
        {/* The template's drag area and handle. Dragging moves it freely and
            it settles on the nearest stop; the keyboard and a plain click
            step through the three, since a drag is not available to both. */}
        <button
          type="button"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onClick={() => setSnap((v) => (v + 1) % SNAPS.length)}
          aria-label="Drag to resize the market list"
          data-cursor="link"
          className="flex h-[30px] w-full touch-none items-center justify-center"
        >
          <span className="h-[4px] w-[38px] rounded-full" style={{ background: c.HANDLE }} />
        </button>

        <div className="flex items-center justify-between pt-[4px] pr-[16px] pb-[6px] pl-[20px]">
          <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: c.FAINT }}>
            Explore markets
          </p>
          <span
            className="rounded-full px-[12px] py-[6px]"
            style={{ fontSize: 12, color: c.MUTED, boxShadow: `inset 0 0 0 1px ${c.SEP}` }}
          >
            Manage
          </span>
        </div>

        <ul className="px-[20px]">
          {ASSETS.map((a) => (
            <AssetRow key={a.ticker} asset={a} c={c} />
          ))}
        </ul>
      </div>
        </>
      )}

      {tab === "search" && <SearchScreen c={c} />}
      {tab === "activity" && <ActivityScreen c={c} />}

      {/* — Floating pill tab bar */}
      <div className="absolute inset-x-0 bottom-[16px] flex justify-center">
        <div
          className="flex items-center gap-[4px] rounded-full p-[6px]"
          style={{ background: c.SURFACE, boxShadow: `inset 0 0 0 1px ${c.SEP}, 0 12px 26px -10px ${c.SHADOW}` }}
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
                style={{ background: on ? c.ACCENT : "transparent" }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
                     stroke={on ? c.ON_ACCENT : c.MUTED} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
