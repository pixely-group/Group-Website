"use client";

import dynamic from "next/dynamic";

import KycScreen from "@/components/service/KycScreen";

const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

/**
 * The identity page's cover: the near field's concentric rings — promoted
 * here from the NFC act at the user's direction — turning slowly behind
 * the front page's own device, which stands ready on the verification
 * flow's first screen. The same hardware the wallet runs on, running the
 * platform's other app.
 */
export default function IdentityHeroArt() {
  return (
    <div className="relative flex h-[min(62vh,600px)] items-center justify-center">
      <svg
        aria-hidden
        className="kyc-rings pointer-events-none absolute top-1/2 left-1/2 h-[min(120vh,980px)] w-[min(120vh,980px)] -translate-x-1/2 -translate-y-1/2"
        viewBox="-280 -280 560 560"
        fill="none"
      >
        {[64, 106, 148, 190, 232, 274].map((r, i) => (
          <circle
            key={r}
            r={r}
            stroke={i === 2 ? "#7290ff" : "#ece9e1"}
            strokeOpacity={i === 2 ? 0.28 : 0.11 - i * 0.008}
            strokeWidth="0.8"
            strokeDasharray={i % 2 ? "2 7" : "1 5"}
          />
        ))}
      </svg>
      <div
        className="relative h-full"
        style={{ aspectRatio: "420 / 892" }}
      >
        <HeroDevice className="size-full" screen={<KycScreen act="start" />} />
      </div>
    </div>
  );
}
