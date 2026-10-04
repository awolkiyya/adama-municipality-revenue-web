"use client";

import React, { useCallback, useRef, useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

/** Masks all but the last 4 digits: 1000123456789 -> •••• 6789 */
export function maskAccountNumber(value: string) {
  const clean = value.replace(/\s+/g, "");
  if (clean.length <= 4) return clean;
  return `•••• ${clean.slice(-4)}`;
}

/** Groups characters in blocks of 4 for readability */
export function groupAccountNumber(value: string) {
  return value.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Masked account number with show/hide and copy.
 * Copy always copies the FULL number, even while it is masked.
 */
export function CopyAccountNumber({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-mask automatically after 10 seconds
  const toggleReveal = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setRevealed((prev) => {
      const next = !prev;
      if (next) hideTimer.current = setTimeout(() => setRevealed(false), 10000);
      return next;
    });
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  }, [value]);

  return (
    <div className="inline-flex items-center gap-1">
      <span
        className={`rounded-md px-2.5 py-1.5 font-mono text-[13px] tabular-nums tracking-wide transition-colors ${
          copied ? "bg-emerald-50 text-emerald-700" : "bg-muted/50"
        }`}
      >
        {copied
          ? "Copied"
          : revealed
            ? groupAccountNumber(value)
            : maskAccountNumber(value)}
      </span>

      <button
        type="button"
        onClick={toggleReveal}
        aria-label={revealed ? "Hide account number" : "Show account number"}
        title={revealed ? "Hide" : "Show"}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={copy}
        aria-label="Copy full account number"
        title="Copy full account number"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}