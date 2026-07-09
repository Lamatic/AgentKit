"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Copy, Check, ChevronDown, FileJson, FileText, Printer } from "lucide-react";
import type { AuditReport } from "@/lib/types";
import { toJSON, toMarkdown, toPrintableHTML } from "@/lib/report-format";

export function ExportMenu({ report }: { report: AuditReport }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close the menu and return focus to the trigger (keyboard-friendly).
  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function downloadFile(content: string, type: string, filename: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    close();
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(toJSON(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
    close();
  }

  function printPdf() {
    const w = window.open("", "_blank");
    if (!w) {
      close();
      return;
    }
    w.document.open();
    w.document.write(toPrintableHTML(report));
    w.document.close();
    w.focus();
    // Give the new document a moment to lay out before opening the print dialog.
    setTimeout(() => {
      try {
        w.print();
      } catch {
        /* user can print manually */
      }
    }, 300);
    close();
  }

  const item = "flex w-full items-center gap-2.5 px-3 py-2 text-sm text-fg hover:bg-surface-2";

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-sm text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
      >
        {copied ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {copied ? "Copied" : "Export"}
        <ChevronDown className="h-3.5 w-3.5 text-fg-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} aria-hidden />
          <div
            role="menu"
            aria-label="Export options"
            className="absolute right-0 z-40 mt-1 w-52 overflow-hidden rounded-md border border-hairline bg-surface py-1 shadow-subtle"
          >
            <button type="button" role="menuitem" onClick={copyJson} className={item}>
              <Copy className="h-4 w-4 text-fg-muted" />
              Copy as JSON
            </button>
            <div className="my-1 border-t border-hairline" />
            <button
              type="button"
              role="menuitem"
              onClick={() => downloadFile(toJSON(report), "application/json", "dockerguard-report.json")}
              className={item}
            >
              <FileJson className="h-4 w-4 text-fg-muted" />
              Download JSON
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => downloadFile(toMarkdown(report), "text/markdown", "dockerguard-report.md")}
              className={item}
            >
              <FileText className="h-4 w-4 text-fg-muted" />
              Download Markdown
            </button>
            <button type="button" role="menuitem" onClick={printPdf} className={item}>
              <Printer className="h-4 w-4 text-fg-muted" />
              Download PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
