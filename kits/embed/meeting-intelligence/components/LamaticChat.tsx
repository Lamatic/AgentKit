"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Config — NEXT_PUBLIC_ vars are inlined by the Next.js bundler at build time.
// ---------------------------------------------------------------------------
const PROJECT_ID = process.env.NEXT_PUBLIC_LAMATIC_PROJECT_ID ?? "";
const FLOW_ID    = process.env.NEXT_PUBLIC_LAMATIC_FLOW_ID    ?? "";
const API_URL    = process.env.NEXT_PUBLIC_LAMATIC_API_URL    ?? "";

const ROOT_ID   = "lamatic-chat-root";
const SCRIPT_ID = "lamatic-chat-script";

type LamaticWindow = Window & {
  LamaticChatWidget?: { open?: () => void; close?: () => void };
};

// Module-level guard — survives React Fast Refresh so we never double-inject.
let didBootstrap = false;

// ---------------------------------------------------------------------------
// bootstrapWidget — mirrors the official Lamatic-generated embed script.
//
// Called on mount (not on button click) so the widget fetches chatConfig and
// creates an IndexedDB session BEFORE the user sends the first message.
// This prevents the "unexpected error" on first send.
// ---------------------------------------------------------------------------
function bootstrapWidget(): void {
  if (didBootstrap) return;
  didBootstrap = true;

  if (!PROJECT_ID || !FLOW_ID || !API_URL) {
    console.warn("[LamaticChat] Missing env vars — widget disabled.", {
      PROJECT_ID: PROJECT_ID || "MISSING",
      FLOW_ID:    FLOW_ID    || "MISSING",
      API_URL:    API_URL    || "MISSING",
    });
    return;
  }

  // 1. Root div — appended directly to body (official Lamatic pattern).
  if (!document.getElementById(ROOT_ID)) {
    const root = document.createElement("div");
    root.id                = ROOT_ID;
    root.dataset.apiUrl    = API_URL;
    root.dataset.flowId    = FLOW_ID;
    root.dataset.projectId = PROJECT_ID;
    document.body.appendChild(root);
    console.log("[LamaticChat] root mounted ✓", { API_URL, FLOW_ID, PROJECT_ID });
  }

  // 2. Script — injected once (matches official Lamatic embed).
  if (!document.getElementById(SCRIPT_ID)) {
    const script   = document.createElement("script");
    script.id      = SCRIPT_ID;
    script.type    = "module";
    script.async   = true;
    script.src     = `https://widget.lamatic.ai/chat-v2?projectId=${encodeURIComponent(PROJECT_ID)}`;
    script.onload  = () => console.log("[LamaticChat] widget script loaded ✓");
    script.onerror = () => console.error("[LamaticChat] widget script failed to load");
    document.body.appendChild(script);
  }
}

interface LamaticChatProps {
  disabled?: boolean;
}

export default function LamaticChat({ disabled = false }: LamaticChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isConfigured = Boolean(PROJECT_ID && FLOW_ID && API_URL);

  // Bootstrap immediately on first client render.
  useEffect(() => {
    if (disabled || !isConfigured) return;
    bootstrapWidget();

    const handleReady = () => console.log("[LamaticChat] lamaticChatWidgetReady ✓");
    window.addEventListener("lamaticChatWidgetReady", handleReady, { once: true });
    return () => window.removeEventListener("lamaticChatWidgetReady", handleReady);
  }, [disabled, isConfigured]);

  // Sync open / close with the Lamatic widget JS API.
  useEffect(() => {
    if (!isConfigured || disabled) return;
    try {
      const w = window as LamaticWindow;
      if (isOpen) w.LamaticChatWidget?.open?.();
      else        w.LamaticChatWidget?.close?.();
    } catch (e) {
      console.warn("[LamaticChat] toggle error", e);
    }
  }, [disabled, isConfigured, isOpen]);

  // External event bus (used by HeroActions and TranscriptPlayground).
  useEffect(() => {
    if (disabled) return;
    const open   = () => setIsOpen(true);
    const close  = () => setIsOpen(false);
    const toggle = () => setIsOpen((v) => !v);
    window.addEventListener("lamatic:open",   open);
    window.addEventListener("lamatic:close",  close);
    window.addEventListener("lamatic:toggle", toggle);
    return () => {
      window.removeEventListener("lamatic:open",   open);
      window.removeEventListener("lamatic:close",  close);
      window.removeEventListener("lamatic:toggle", toggle);
    };
  }, [disabled]);

  // NOTE: #lamatic-chat-root is intentionally NOT removed on unmount.
  // Removing and re-adding it causes "ConstraintError: Key already exists"
  // in the widget's IndexedDB session store.

  if (!isConfigured || disabled) {
    return (
      <div className="fixed bottom-6 right-6 z-[70]">
        <Button type="button" className="rounded-full px-5 shadow-lg" disabled>
          Copilot unavailable
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      <Button
        type="button"
        className="rounded-full px-5 shadow-lg"
        aria-pressed={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        {isOpen ? "Close Copilot" : "Open Copilot"}
      </Button>
    </div>
  );
}
