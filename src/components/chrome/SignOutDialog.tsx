"use client";

import { useEffect, useId, useRef } from "react";

import { useLenis } from "@/components/chrome/SmoothScroll";
import MagneticButton from "@/components/ui/MagneticButton";

/**
 * "Are you sure?" — in the sign-in panel's own shell: same scrim, same
 * entrance, same top anchor, so leaving reads as the same doorway entering
 * did. One question, two buttons, and the safe answer is the quiet one.
 *
 * A confirmation, not ceremony: sign-out used to fire on a single press,
 * and a dropped session is cheap but never what an accidental click meant.
 */
export default function SignOutDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const lenis = useLenis();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    lenis?.stop();
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      lenis?.start();
      returnTo.current?.focus({ preventScroll: true });
    };
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const ring = [
        ...(panelRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled])",
        ) ?? []),
      ];
      if (!ring.length) return;
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <div
      data-theme="ink"
      aria-hidden={!open}
      inert={!open || undefined}
      className={`fixed inset-0 z-(--z-dialog) flex items-start justify-center overflow-y-auto px-6 py-[max(2.5rem,10vh)] transition-opacity duration-300 ease-(--ease-out-expo) ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-ink/72 backdrop-blur-md"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`auth-panel relative w-full max-w-[24rem] rounded-(--radius-panel) border border-(--line) bg-ink-2 p-8 text-(--fg) shadow-[0_40px_90px_-30px_rgb(0_0_0/0.7)] ${
          open ? "is-open" : ""
        }`}
      >
        <span className="type-headline inline-flex items-baseline text-[1.05rem] tracking-[0.06em] text-(--fg)">
          Pixely
          <span
            aria-hidden
            className="inline-block bg-accent"
            style={{ width: "0.17em", height: "0.17em", marginLeft: "0.12em" }}
          />
        </span>

        <h2 id={titleId} className="type-headline mt-6 text-[1.5rem]">
          Sign out?
        </h2>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-(--muted)">
          You&apos;ll be signed out of Pixely on this browser. Signing back in
          takes one link.
        </p>

        <div className="mt-7 flex gap-3">
          <MagneticButton
            variant="outline"
            size="md"
            className="flex-1 justify-center"
            onClick={onCancel}
          >
            Cancel
          </MagneticButton>
          <MagneticButton
            size="md"
            className="flex-1 justify-center"
            onClick={onConfirm}
          >
            Sign out
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}
