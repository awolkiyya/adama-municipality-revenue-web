"use client";

import React, { useCallback, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Shows a code in a monospace chip. Clicking it copies the value. */
export function CopyCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      title="Click to copy code"
      aria-label={copied ? "Code copied" : `Copy code ${value}`}
      className={`group inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[13px] tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        copied
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-transparent bg-muted/50 hover:border-border hover:bg-muted"
      }`}
    >
      <span>{copied ? "Copied" : value}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}