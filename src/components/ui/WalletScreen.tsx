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

/* — The template's series generator, ported as written: an FNV-1a mixer, a
     slow sine, a faster harmonic and a linear drift toward the change. */
function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

function spark(key: string, change: number, w = 72, h = 32, n = 40) {
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
  const pts = values.map((v, i) => [
    (i / (n - 1)) * w,
    h - 2 - ((v - min) / span) * (h - 4),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return { line, area: `${line} L${w},${h} L0,${h} Z` };
}

type Token = {
  name: string;
  ticker: string;
  price: string;
  change: number;
  mark: (size: number) => React.ReactNode;
};

/* Brand marks, drawn from the template's own icon set. */
const disc = (fill: string, s: number, inner: React.ReactNode) => (
  <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="12" fill={fill} />
    {inner}
  </svg>
);

const TOKENS: Token[] = [
  {
    name: "Bitcoin", ticker: "BTC", price: "$67,234.18", change: 0.0214,
    mark: (s) => disc("#F7931A", s, <text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700" fontFamily="var(--font-nunito)">₿</text>),
  },
  {
    name: "Ethereum", ticker: "ETH", price: "$3,512.42", change: 0.0381,
    mark: (s) => disc("#FFFFFF", s, <>
      <path d="M12 4.2 7.9 12l4.1 2.4V4.2Z" fill="#8C8C8C" />
      <path d="M12 4.2V14.4l4.1-2.4L12 4.2Z" fill="#343434" />
      <path d="M12 15.4 7.9 13l4.1 6.8v-4.4Z" fill="#8C8C8C" />
      <path d="M12 19.8 16.1 13 12 15.4v4.4Z" fill="#3C3C3B" />
    </>),
  },
  {
    name: "Solana", ticker: "SOL", price: "$168.91", change: 0.0517,
    mark: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
        <defs>
          <linearGradient id="sol-g" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#00FFA3" />
            <stop offset="1" stopColor="#DC1FFF" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill="#000000" />
        {[8.2, 11.4, 14.6].map((y, i) => (
          <path key={y}
            d={i === 1
              ? `M7.4 ${y} h9.2 l-2 2 H5.4 Z`
              : `M${i ? 5.4 : 7.4} ${y} h9.2 l${i ? -2 : 2} 2 H${i ? 5.4 : 5.4} Z`}
            fill="url(#sol-g)" />
        ))}
      </svg>
    ),
  },
  {
    name: "USD Coin", ticker: "USDC", price: "$1.00", change: 0.0002,
    mark: (s) => disc("#2775CA", s, <>
      <circle cx="12" cy="12" r="6.4" fill="none" stroke="#FFFFFF" strokeWidth="1.4" />
      <path d="M12 7.6v8.8M13.9 10.2c-.4-.7-1.1-1-1.9-1-1 0-1.8.5-1.8 1.4 0 .8.6 1.2 1.9 1.5 1.4.3 2 .8 2 1.6 0 1-.9 1.5-2 1.5-.9 0-1.6-.4-2-1.1"
        stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </>),
  },
  {
    name: "Cardano", ticker: "ADA", price: "$0.45", change: -0.0186,
    mark: (s) => disc("#FFFFFF", s, <>
      <circle cx="12" cy="12" r="2" fill="#0033AD" />
      {[[12, 6], [12, 18], [6.8, 9], [6.8, 15], [17.2, 9], [17.2, 15]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.35" fill="#0033AD" />
      ))}
    </>),
  },
  {
    name: "Dogecoin", ticker: "DOGE", price: "$0.15", change: 0.0124,
    mark: (s) => disc("#C2A633", s, <text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="var(--font-nunito)">Ð</text>),
  },
  {
    name: "Chainlink", ticker: "LINK", price: "$18.54", change: -0.0072,
    mark: (s) => disc("#2A5ADA", s, <path d="M12 5.6 17.4 8.8v6.4L12 18.4 6.6 15.2V8.8L12 5.6Z" fill="#FFFFFF" />),
  },
];

const ACTIVITY = [
  ["Received ETH", "+0.42 ETH", "09:41", true],
  ["Swapped USDC to SOL", "12.4 SOL", "08:02", true],
  ["Sent BTC", "−0.0031 BTC", "Yesterday", false],
  ["Bought SOL", "+4.0 SOL", "Yesterday", true],
  ["Network fee", "−$1.24", "Tue", false],
  ["Received USDC", "+250.59 USDC", "Tue", true],
  ["Sent DOGE", "−120 DOGE", "Mon", false],
] as const;

const pct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(2)}%`;

function Trend({ change, c, size = 12 }: { change: number; c: C; size?: number }) {
  const up = change >= 0;
  return (
    <span className="inline-flex items-center gap-[3px]" style={{ color: up ? c.UP : c.DOWN, fontSize: size, fontWeight: 600 }}>
      <svg width="8" height="6" viewBox="0 0 8 6" aria-hidden>
        <path d={up ? "M4 0 8 6H0Z" : "M4 6 0 0h8Z"} fill="currentColor" />
      </svg>
      {pct(change)}
    </span>
  );
}

function QuickAction({ label, d, c }: { label: string; d: string; c: C }) {
  return (
    <div
      role="button" tabIndex={0} data-cursor="link"
      className="flex size-[112px] shrink-0 flex-col justify-between rounded-[24px] p-[14px] transition-transform duration-200 active:scale-[0.97]"
      style={{ background: c.SURFACE }}
    >
      <span className="flex size-[32px] items-center justify-center rounded-full" style={{ background: c.CHIP }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={c.FG} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} />
        </svg>
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, color: c.FG }}>{label}</span>
    </div>
  );
}

function TokenRow({ t, c }: { t: Token; c: C }) {
  const s = spark(t.ticker, t.change);
  const up = t.change >= 0;
  const id = `fill-${t.ticker}`;
  return (
    <li role="button" tabIndex={0} data-cursor="link"
        className="flex items-center gap-[12px] py-[10px] transition-transform duration-200 active:scale-[0.99]">
      <span className="shrink-0">{t.mark(40)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate" style={{ fontSize: 15, fontWeight: 600, color: c.FG }}>{t.name}</span>
        <span className="block" style={{ fontSize: 13, color: c.MUTED }}>{t.ticker}</span>
      </span>
      <svg width="72" height="32" viewBox="0 0 72 32" fill="none" className="shrink-0" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={up ? c.UP : c.DOWN} stopOpacity="0.45" />
            <stop offset="1" stopColor={up ? c.UP : c.DOWN} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={s.area} fill={`url(#${id})`} />
        <path d={s.line} stroke={up ? c.UP : c.DOWN} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span className="shrink-0 text-right" style={{ minWidth: 76 }}>
        <span className="block" style={{ fontSize: 14, fontWeight: 600, color: c.FG }}>{t.price}</span>
        <Trend change={t.change} c={c} />
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

function SearchScreen({ c }: { c: C }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const hits = TOKENS.filter((t) => !q || t.name.toLowerCase().includes(q) || t.ticker.toLowerCase().includes(q));
  return (
    <div className="absolute inset-x-0 top-[54px] bottom-[92px] overflow-hidden px-[20px]">
      <label className="flex items-center gap-[10px] rounded-[18px] px-[14px] py-[12px]" style={{ background: c.SURFACE }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke={c.MUTED} strokeWidth="1.8" aria-hidden>
          <circle cx="8.6" cy="8.6" r="5.6" /><path d="m12.8 12.8 4 4" strokeLinecap="round" />
        </svg>
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tokens, addresses, NFTs" data-cursor="text"
          className="w-full bg-transparent outline-none"
          style={{ fontSize: 15, color: c.FG }}
        />
      </label>
      <p className="mt-[20px]" style={{ fontSize: 15, fontWeight: 600, color: c.MUTED }}>Favorites</p>
      <div className="mt-[10px] flex gap-[8px] overflow-hidden">
        {TOKENS.slice(0, 3).map((t) => (
          <div key={t.ticker} className="w-[104px] shrink-0 rounded-[20px] p-[12px]" style={{ background: c.SURFACE }}>
            {t.mark(28)}
            <span className="mt-[8px] block" style={{ fontSize: 13, fontWeight: 600, color: c.FG }}>{t.price}</span>
            <span className="mt-[2px] block"><Trend change={t.change} c={c} size={11} /></span>
          </div>
        ))}
      </div>
      <p className="mt-[20px]" style={{ fontSize: 15, fontWeight: 600, color: c.MUTED }}>
        {q ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "Top tokens"}
      </p>
      <ul className="mt-[2px]">{hits.map((t) => <TokenRow key={t.ticker} t={t} c={c} />)}</ul>
    </div>
  );
}

function ActivityScreen({ c }: { c: C }) {
  return (
    <div className="absolute inset-x-0 top-[54px] bottom-[92px] overflow-hidden px-[20px]">
      <p style={{ fontSize: 15, fontWeight: 600, color: c.MUTED }}>All activity</p>
      <ul className="mt-[6px]">
        {ACTIVITY.map(([what, amount, when, credit]) => (
          <li key={what} className="flex items-center justify-between py-[13px] transition-transform duration-200 active:scale-[0.99]"
              style={{ borderTop: `1px solid ${c.SEP}` }}>
            <span className="min-w-0 pr-3">
              <span className="block truncate" style={{ fontSize: 15, fontWeight: 600, color: c.FG }}>{what}</span>
              <span className="block" style={{ fontSize: 13, color: c.MUTED }}>{when}</span>
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: credit ? c.UP : c.FG }}>{amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Tab = "home" | "search" | "activity";

export default function WalletScreen() {
  const [tab, setTab] = useState<Tab>("home");
  const [themeId, setThemeId] = useState<ThemeId>("dark");
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)", true);
  const mode: Mode = themeId === "system" ? (systemDark ? "dark" : "light") : themeId;
  const c = PALETTE[mode];

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
              <span className="size-[44px] shrink-0 rounded-full"
                    style={{ background: "radial-gradient(120% 120% at 30% 22%, #bfe9ff 0%, #7ea8f5 45%, #5b3fd6 100%)" }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate" style={{ fontSize: 17, fontWeight: 700, color: c.FG }}>Main Wallet</span>
                <button type="button" onClick={() => setCopied(true)} data-cursor="link"
                        className="flex items-center gap-[6px]" style={{ fontSize: 14, color: c.MUTED }}>
                  {copied ? "Copied" : "0x7A3F…9F0A"}
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={c.MUTED} strokeWidth="1.4" aria-hidden>
                    <rect x="4.6" y="4.6" width="8" height="8" rx="1.8" /><path d="M9.4 1.4h-8v8" />
                  </svg>
                </button>
              </span>
              <ThemeSelect value={themeId} onChange={setThemeId} c={c} />
            </div>

            <div className="mt-[18px] px-[20px]">
              <p style={{ fontSize: 38, fontWeight: 700, color: c.FG, letterSpacing: "-0.02em" }}>$12,481.43</p>
              <p className="mt-[2px]" style={{ fontSize: 15, color: c.MUTED }}>
                <span style={{ color: c.UP, fontWeight: 600 }}>+$286.27</span> today
              </p>
            </div>

            <div className="mt-[16px] flex gap-[8px] overflow-hidden pl-[20px]">
              <QuickAction label="Send" d="M6.5 13.5 13.5 6.5M7.5 6.5h6v6" c={c} />
              <QuickAction label="Receive" d="M13.5 6.5 6.5 13.5M12.5 13.5h-6v-6" c={c} />
              <QuickAction label="Swap" d="M3 7h11m0 0-3-3m3 3-3 3M17 13H6m0 0 3-3m-3 3 3 3" c={c} />
              <QuickAction label="Buy/Sell" d="M2.5 5.5h15v9h-15v-9Zm0 3.5h15" c={c} />
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
              aria-label="Drag to resize the token list" data-cursor="link"
              className="flex h-[30px] w-full touch-none items-center justify-center"
            >
              <span className="h-[5px] w-[40px] rounded-full" style={{ background: c.HANDLE }} />
            </button>

            <div className="flex items-center justify-between pt-[2px] pr-[16px] pb-[4px] pl-[20px]">
              <p style={{ fontSize: 17, fontWeight: 600, color: c.MUTED }}>Explore tokens</p>
              <span className="rounded-full px-[16px] py-[8px]" style={{ fontSize: 14, fontWeight: 600, color: c.FG, background: c.SURFACE }}>
                Manage
              </span>
            </div>

            <ul className="px-[20px]">
              {TOKENS.map((t) => <TokenRow key={t.ticker} t={t} c={c} />)}
            </ul>
          </div>
        </>
      )}

      {tab === "search" && <SearchScreen c={c} />}
      {tab === "activity" && <ActivityScreen c={c} />}

      <div className="absolute inset-x-0 bottom-[16px] flex justify-center">
        <div className="flex items-center gap-[4px] rounded-full p-[6px]"
             style={{ background: c.SURFACE, boxShadow: `0 12px 26px -10px ${c.SHADOW}` }}>
          {tabs.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id} type="button" onClick={() => setTab(t.id)}
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
