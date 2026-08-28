"use client";

import MagneticButton from "@/components/ui/MagneticButton";

/** The one client island the account pages need: sign out is a POST and a
 *  return home, and a server component cannot press its own button. */
export default function SignOutButton() {
  return (
    <MagneticButton
      variant="outline"
      size="sm"
      onClick={async () => {
        await fetch("/api/auth/signout", { method: "POST" });
        window.location.assign(new URL("/", window.location.origin));
      }}
    >
      Sign out
    </MagneticButton>
  );
}
