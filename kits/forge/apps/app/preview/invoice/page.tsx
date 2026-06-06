"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PenLine } from "lucide-react";
import { getSession, updateSession } from "@/lib/storage";
import { AuroraBackground } from "@/components/AuroraBackground";
import InvoiceDocument from "@/components/preview/InvoiceDocument";
import SignatureCanvas from "@/components/preview/SignatureCanvas";
import ExportButton from "@/components/preview/ExportButton";
import type { InvoiceData } from "@/lib/types";

export default function InvoicePreviewPage() {
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [invoiceNumber] = useState(`INV-${Date.now()}`);
  const [showSigModal, setShowSigModal] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session.invoice || !session.projectDetails) {
      router.push("/new");
      return;
    }
    setInvoice(session.invoice);
    setSignature(session.invoice_signature || null);
    setProjectTitle(session.projectDetails.project_title);
    setCurrency(session.pricing?.currency || session.projectDetails.payment_currency || "USD");
  }, [router]);

  const handleSignature = (dataUrl: string) => {
    setSignature(dataUrl);
    updateSession({ invoice_signature: dataUrl });
    setShowSigModal(false);
  };

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <AuroraBackground>
      <main className="min-h-screen px-6 py-10 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-10 animate-fade-in no-print">
            <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-light tracking-[-0.04em] mb-2 text-white">
              Invoice <span className="font-medium text-gradient-animate">Preview</span>
            </h1>
            <p className="text-white/50 text-[clamp(0.9rem,1.5vw,1.05rem)]">
              Review, sign, and export your invoice.
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8">
          {/* Document */}
          <div className="animate-fade-in">
            <InvoiceDocument
              invoice={invoice}
              signature={signature}
              invoiceNumber={invoiceNumber}
              currency={currency}
            />
          </div>

          {/* Action Panel */}
          <div className="lg:sticky lg:top-24 lg:self-start no-print">
            <div className="feature-card-glow p-8 space-y-6 relative overflow-hidden group" style={{background: 'linear-gradient(#0a0a10, #0a0a10) padding-box, linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05)) border-box'}}>
              <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-2xl" />
              
              <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 relative z-10" style={{fontFamily: "'Google Sans', 'DM Sans', sans-serif"}}>
                Actions
              </h3>

              {/* Sign */}
              <button
                onClick={() => setShowSigModal(true)}
                className={`relative z-10 flex items-center justify-center gap-3 w-full px-6 py-4 border rounded-xl font-medium transition-all duration-300 text-sm ${
                  signature
                    ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20"
                    : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                }`}
                style={{fontFamily: "'Google Sans', 'DM Sans', sans-serif"}}
              >
                <PenLine className="w-5 h-5" />
                {signature ? "Signed (Tap to redo)" : "Sign Invoice"}
              </button>

              {/* Export */}
              <div className="relative z-10">
                <ExportButton
                  targetId="invoice-document"
                  filename={`${projectTitle}-invoice`}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 relative z-10" />

              {/* Navigate back to contract */}
              <button
                onClick={() => router.push("/preview/contract")}
                className="relative z-10 flex items-center justify-center gap-3 w-full px-6 py-4 bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 text-sm font-medium"
                style={{fontFamily: "'Google Sans', 'DM Sans', sans-serif"}}
              >
                <ArrowLeft className="w-5 h-5 opacity-70" />
                Back to Contract
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureCanvas
        isOpen={showSigModal}
        onClose={() => setShowSigModal(false)}
        onConfirm={handleSignature}
      />
      </main>
    </AuroraBackground>
  );
}
