import type { Metadata } from "next";
import SmoothScroll from "@/components/chrome/SmoothScroll";
import CustomCursor from "@/components/chrome/CustomCursor";
import { Wordmark } from "@/components/chrome/Navigation";
import Hero from "@/components/sections/Hero";

const description = "AI-powered KYC and fraud detection for banks and financial institutions in Algeria & MENA — hosted locally, privacy-first.";

export const metadata: Metadata = {
  title: "Pixely — AI-powered identity & fraud solution",
  description,
  openGraph: {
    title: "Pixely — AI-powered identity & fraud solution",
    description,
    type: "website",
  },
};

export default function Home() {
  return (
    <SmoothScroll>
      <CustomCursor />
      <header data-theme="ink" className="absolute inset-x-0 top-0 z-50 px-6 py-7 text-bone sm:px-10 lg:px-14">
        <a href="#top" aria-label="Pixely — home" data-cursor="link" className="inline-flex">
          <Wordmark />
        </a>
      </header>
      <main>
        <Hero />
      </main>
    </SmoothScroll>
  );
}
