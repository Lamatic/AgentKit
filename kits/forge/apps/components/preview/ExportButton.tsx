"use client";

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Props {
  targetId: string;
  filename: string;
}

export default function ExportButton({ targetId, filename }: Props) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setDone(false);

    try {
      const element = document.getElementById(targetId);
      if (!element) throw new Error("Document element not found");

      // 1. Store original styles to restore later
      const originalStyle = element.style.cssText;
      
      // 2. Force a standard A4-friendly width for the capture
      // This prevents the PDF from depending on the current device width
      element.style.width = "800px";
      element.style.minWidth = "800px";
      element.style.maxWidth = "800px";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#fafaf8",
        width: 800, // Explicitly tell html2canvas to use this width
      });

      // 3. Restore original responsive styles
      element.style.cssText = originalStyle;

      // 2. Configure jsPDF
      // A4 dimensions: 210mm x 297mm
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      // 3. Use the modern .html() method which handles pagination/clipping much better
      await pdf.html(element, {
        callback: function (doc) {
          doc.save(`${filename}.pdf`);
        },
        x: 10,
        y: 10,
        width: 190, // Target width in mm (A4 is 210mm, giving us 10mm margins)
        windowWidth: 800, // Render at our standard 800px width
        autoPaging: "text", // This is the magic that prevents clipping lines
      });

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center justify-center gap-3 w-full px-6 py-4 liquid-glass-pill hover:bg-white/10 text-white font-medium transition-all duration-300 hover:!translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {exporting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Exporting...
        </>
      ) : done ? (
        <>
          <Check className="w-5 h-5 text-emerald-400" />
          PDF Saved to Downloads
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
