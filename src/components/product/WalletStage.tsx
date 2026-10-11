"use client";

import dynamic from "next/dynamic";

/* The front page's own wallet, on its own device. Client-only, like every
   other mount of it: the wallet inside reads a media query on mount. */
const HeroDevice = dynamic(() => import("@/components/ui/HeroDevice"), {
  ssr: false,
});

/** The wallet, stood up beside the copy that describes it. The device is
 *  live: the reader can open a transaction, switch wallets, freeze the
 *  card — the same app the home page hands them. */
export default function WalletStage() {
  return (
    <div className="flex justify-center">
      <HeroDevice className="h-[clamp(440px,68vh,640px)]" shift={0} />
    </div>
  );
}
