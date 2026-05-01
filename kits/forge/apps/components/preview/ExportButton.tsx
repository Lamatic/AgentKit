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
      const sigSection = document.getElementById("signatures-section");
      if (!element) throw new Error("Document element not found");

      // Force page-break-before to signatures section
      if (sigSection) {
        sigSection.style.pageBreakBefore = "always";
        sigSection.style.breakBefore = "page";
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#fafaf8",
        width: 800,
        letterRendering: true,
        foreignObjectRendering: false,
        removeContainer: true,
        onclone: (clonedDoc) => {
          const docEl = clonedDoc.getElementById(targetId);
          const sig = clonedDoc.getElementById("signatures-section");
          if (docEl) {
            docEl.style.textShadow = "none";
            docEl.style.webkitFontSmoothing = "none";
            docEl.style.width = "800px";
            docEl.style.minWidth = "800px";
            docEl.style.maxWidth = "800px";
          }
          if (sig) {
            sig.style.pageBreakBefore = "always";
            sig.style.breakBefore = "page";
          }
        },
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Manual canvas slicing for clean page breaks
      let yOffset = 0;
      let remainingHeight = imgHeight;

      while (remainingHeight > 0) {
        if (yOffset > 0) pdf.addPage();

        const sourceY = (yOffset / imgHeight) * canvas.height;
        const sliceHeight = Math.min(pageHeight, remainingHeight);
        const sourceHeight = (sliceHeight / imgHeight) * canvas.height;

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext("2d");
        ctx?.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight
        );

        pdf.addImage(
          pageCanvas.toDataURL("image/png"),
          "PNG",
          0,
          0,
          pageWidth,
          sliceHeight
        );
        yOffset += pageHeight;
        remainingHeight -= pageHeight;
      }

      pdf.save(`${filename}.pdf`);
      setDone(true);
      setTimeout(() => setDone(false), 3000);

      // Clean up styles
      if (sigSection) {
        sigSection.style.pageBreakBefore = "";
        sigSection.style.breakBefore = "";
      }
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
