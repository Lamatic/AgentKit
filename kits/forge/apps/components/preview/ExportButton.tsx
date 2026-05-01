"use client";

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";

interface Props {
  targetId: string;
  filename: string;
}

export default function ExportButton({ targetId, filename }: Props) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setDone(false);

    try {
      // Set document title to the desired filename so the print dialog uses it
      const originalTitle = document.title;
      document.title = filename;

      // Note: targetId is currently handled via CSS @media print in globals.css
      // which isolates the document surface for the print engine.
      window.print();

      // Restore original title
      document.title = originalTitle;
      
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("Print failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center justify-center gap-3 w-full px-6 py-4 liquid-glass-pill hover:bg-white/10 text-white font-medium transition-all duration-300 hover:!translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed no-print"
    >
      {exporting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Preparing...
        </>
      ) : done ? (
        <>
          <Check className="w-5 h-5 text-emerald-400" />
          Print Dialog Opened
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          Export as PDF
        </>
      )}
    </button>
  );
}
