"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-xs text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}
