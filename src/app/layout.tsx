import type { Metadata, Viewport } from "next";
import { Archivo, Fraunces, IBM_Plex_Mono, Nunito } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

/**
 * The counter-voice. Fraunces is variable across optical size, SOFT and
 * WONK, so the italic can be tuned sharp and characterful rather than
 * merely decorative — it has to hold its own beside Archivo's cold
 * grotesque at display sizes.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  // Italic only, which is all either place asks for. Worth knowing if that
  // ever changes: `not-italic` against an italic-only family renders italic
  // regardless — the computed style says normal and the screen disagrees.
  style: ["italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

/**
 * The wallet's own typeface. The HeroUI template loads Nunito and styles
 * every weight through it, and the rounded terminals are most of why that
 * app looks the way it does — setting it in Archivo would be a different
 * product wearing its layout.
 */
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pixely — AI-powered fintech platform",
  description:
    "Pixely combines payments, digital identity and artificial intelligence into one platform — secure transactions, trusted verification and intelligent financial services, built for Algeria.",
  metadataBase: new URL("https://www.pixely.dz"),
  openGraph: {
    title: "Pixely — AI-powered fintech platform",
    description:
      "Payments, digital identity and AI in one platform, built for Algeria.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${fraunces.variable} ${plexMono.variable} ${nunito.variable} h-full`}
    >
      {/* Extensions commonly stamp attributes onto <body> before React
          hydrates — the reported mismatch was a testing extension adding
          `data-testim-main-word-scripts-loaded`. This suppresses the warning
          for this element's own attributes only, one level deep, so genuine
          mismatches inside the tree are still reported. */}
      <body
        suppressHydrationWarning
        className="grain min-h-full bg-ink text-bone"
      >
        {children}
      </body>
    </html>
  );
}
