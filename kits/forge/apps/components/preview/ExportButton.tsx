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

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#fafaf8",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${filename}.pdf`);
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
