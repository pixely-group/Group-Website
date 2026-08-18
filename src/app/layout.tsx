import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pixely — Money should move like light",
  description:
    "Pixely is the settlement layer for companies that operate at internet speed. Accounts in 40+ currencies, value moving in milliseconds, every dollar controlled in code.",
  metadataBase: new URL("https://pixely.com"),
  openGraph: {
    title: "Pixely — Money should move like light",
    description:
      "The settlement layer for companies that operate at internet speed.",
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
      className={`${archivo.variable} ${instrument.variable} ${plexMono.variable} h-full`}
    >
      <body className="grain min-h-full bg-ink text-bone">{children}</body>
    </html>
  );
}
