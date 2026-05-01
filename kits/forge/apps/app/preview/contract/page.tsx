"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, PenLine } from "lucide-react";
import { getSession, updateSession } from "@/lib/storage";
import { AuroraBackground } from "@/components/AuroraBackground";
import ContractDocument from "@/components/preview/ContractDocument";
import SignatureCanvas from "@/components/preview/SignatureCanvas";
import ExportButton from "@/components/preview/ExportButton";

export default function ContractPreviewPage() {
  const router = useRouter();
  const [contract, setContract] = useState<Record<string, { heading: string; body: string }> | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [freelancerName, setFreelancerName] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [showSigModal, setShowSigModal] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session.contract || !session.projectDetails) {
      router.push("/new");
      return;
    }
    setContract(session.contract);
    setSignature(session.contract_signature || null);
    setFreelancerName(session.projectDetails.freelancer_name);
    setClientName(session.projectDetails.client_name);
    setProjectTitle(session.projectDetails.project_title);
  }, [router]);

  const handleSignature = (dataUrl: string) => {
    setSignature(dataUrl);
    updateSession({ contract_signature: dataUrl });
    setShowSigModal(false);
  };

  if (!contract) {
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
          <div className="mb-10 animate-fade-in">
            <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-light tracking-[-0.04em] mb-2 text-white">
              Contract <span className="font-medium text-gradient-animate">Preview</span>
            </h1>
            <p className="text-white/50 text-[clamp(0.9rem,1.5vw,1.05rem)]">
              Review, sign, and export your contract.
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8">
          {/* Document */}
          <div className="animate-fade-in">
            <ContractDocument
              contract={contract}
              signature={signature}
              freelancerName={freelancerName}
              clientName={clientName}
            />
          </div>

          {/* Action Panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
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
                {signature ? "Signed (Tap to redo)" : "Sign Contract"}
              </button>

              {/* Export */}
              <div className="relative z-10">
                <ExportButton
                  targetId="contract-document"
                  filename={`${projectTitle}-contract`}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 relative z-10" />

              {/* Navigate to invoice */}
              <button
                onClick={() => router.push("/preview/invoice")}
                className="relative z-10 flex items-center justify-center gap-3 w-full px-6 py-4 bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 text-sm font-medium"
                style={{fontFamily: "'Google Sans', 'DM Sans', sans-serif"}}
              >
                View Invoice
                <ArrowRight className="w-5 h-5 opacity-70" />
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
