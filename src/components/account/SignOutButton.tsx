"use client";

import { useState } from "react";

import SignOutDialog from "@/components/chrome/SignOutDialog";
import MagneticButton from "@/components/ui/MagneticButton";

/** The settings page's own way out — through the same question the bar's
 *  panel asks, so leaving is one gesture everywhere. */
export default function SignOutButton() {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <MagneticButton
        variant="outline"
        size="sm"
        onClick={() => setAsking(true)}
      >
        Sign out
      </MagneticButton>
      <SignOutDialog
        open={asking}
        onCancel={() => setAsking(false)}
        onConfirm={async () => {
          await fetch("/api/auth/signout", { method: "POST" });
          window.location.assign(new URL("/", window.location.origin));
        }}
      />
    </>
  );
}
