"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Check, FileText, Receipt, AlertTriangle } from "lucide-react";
import { getSession, updateSession } from "@/lib/storage";
import { callFlow } from "@/lib/lamatic";
import { GalaxyButton } from "@/components/GalaxyButton";
import ErrorState from "@/components/ErrorState";

interface Props {
  onBack: () => void;
}

export default function Step4Generate({ onBack }: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [contractDone, setContractDone] = useState(false);
  const [invoiceDone, setInvoiceDone] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setContractDone(false);
    setInvoiceDone(false);

    try {
      const session = getSession();
      const pd = session.projectDetails;
      const pricing = session.pricing;
      const gov = session.governing_law;

      if (!pd || !pricing || !gov) {
        throw new Error("Missing data. Please go back and complete all steps.");
      }

      const contractFlowId = process.env.NEXT_PUBLIC_FLOW_CONTRACT;
      const invoiceFlowId = process.env.NEXT_PUBLIC_FLOW_INVOICE;
      if (!contractFlowId || !invoiceFlowId) {
        throw new Error("Flow IDs not configured.");
      }

      // Single source of truth: user-selected currency from project details
      const currency = pd.payment_currency;

      // Build payloads
      const contractPayload = {
        freelancer_name: pd.freelancer_name,
        freelancer_country: pd.freelancer_country,
        freelancer_payment_method: pd.freelancer_payment_method,
        freelancer_primary_concern: pd.freelancer_primary_concern,
        client_name: pd.client_name,
        client_country: pd.client_country,
        client_type: pd.client_type,
        project_title: pd.project_title,
        project_description: pd.project_description,
        deliverables: pd.deliverables,
        timeline_start: pd.timeline_start,
        timeline_end: pd.timeline_end,
        payment_amount: pricing.total_amount,
        payment_currency: currency,
        payment_structure: pd.payment_structure,
        work_type: pd.work_type,
        chosen_governing_law: gov.option_name,
      };

      const invoicePayload = {
        freelancer_name: pd.freelancer_name,
        freelancer_address: pd.freelancer_address,
        freelancer_country: pd.freelancer_country,
        freelancer_email: pd.freelancer_email,
        freelancer_payment_details: pd.freelancer_payment_details,
        client_name: pd.client_name,
        client_address: pd.client_address,
        client_country: pd.client_country,
        client_email: pd.client_email,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: pd.timeline_start,
        project_title: pd.project_title,
        line_items: JSON.stringify(pricing.line_items),
        currency,
        total_amount: pricing.total_amount,
        payment_instructions: `Please send payment via ${pd.freelancer_payment_method} to: ${pd.freelancer_payment_details}`,
        notes: `This invoice relates to the services agreement dated ${new Date().toISOString().split("T")[0]}.`,
      };

      // Call both flows with Promise.allSettled
      const [contractResult, invoiceResult] = await Promise.allSettled([
        callFlow(contractFlowId, contractPayload),
        callFlow(invoiceFlowId, invoicePayload),
      ]);

      // Process contract
      if (contractResult.status === "fulfilled") {
        const contractRaw = contractResult.value.result.contract;
        const contract = typeof contractRaw === 'string' ? JSON.parse(contractRaw) : contractRaw;
        updateSession({ contract });
        setContractDone(true);
      }

      // Process invoice
      if (invoiceResult.status === "fulfilled") {
        const invoiceRaw = invoiceResult.value.result.invoice;
        const invoice = typeof invoiceRaw === 'string' ? JSON.parse(invoiceRaw) : invoiceRaw;
        updateSession({ invoice });
        setInvoiceDone(true);
      }

      // Navigate if contract succeeded; otherwise reset loading state so error UI can render
      if (contractResult.status === "fulfilled") {
        if (invoiceResult.status === "rejected") {
          setError("Contract generated, but invoice failed. You can regenerate it later.");
          setGenerating(false);
          setTimeout(() => router.push("/preview/contract"), 2000);
        } else {
          // Keep generating true while navigating to the preview
          router.push("/preview/contract");
        }
      } else if (invoiceResult.status === "fulfilled") {
        setError("Invoice generated, but contract failed. Please try again.");
        setGenerating(false);
      } else {
        setGenerating(false);
        throw new Error("Both document generations failed. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-light tracking-[-0.04em] mb-3 text-white">
          <span className="font-medium text-gradient-animate">Generate</span> Documents
        </h2>
        <p className="text-white/50 text-[clamp(0.9rem,1.5vw,1.1rem)]">
          Everything is ready. Generate your contract and invoice in seconds.
        </p>
      </div>

      {/* Status */}
      {generating && (
        <div className="space-y-4 py-8 max-w-md mx-auto">
          <div className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/10 rounded-2xl relative overflow-hidden group transition-all duration-300">
            {contractDone && <div className="absolute inset-0 bg-emerald-400/5 pointer-events-none" />}
            <div className={`p-2.5 rounded-xl border ${contractDone ? 'bg-emerald-400/20 border-emerald-400/30' : 'bg-white/5 border-white/10'}`}>
              {contractDone ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${contractDone ? 'text-white' : 'text-white/70 animate-pulse'}`}>
                {contractDone ? "Contract Drafted" : "Drafting Contract..."}
              </p>
              <p className="text-xs text-white/40 mt-1">AI is processing your governing law choice</p>
            </div>
            <FileText className={`w-5 h-5 ${contractDone ? 'text-emerald-400/50' : 'text-white/20'}`} />
          </div>

          <div className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/10 rounded-2xl relative overflow-hidden group transition-all duration-300">
            {invoiceDone && <div className="absolute inset-0 bg-emerald-400/5 pointer-events-none" />}
            <div className={`p-2.5 rounded-xl border ${invoiceDone ? 'bg-emerald-400/20 border-emerald-400/30' : 'bg-white/5 border-white/10'}`}>
              {invoiceDone ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${invoiceDone ? 'text-white' : 'text-white/70 animate-pulse'}`}>
                {invoiceDone ? "Invoice Prepared" : "Preparing Invoice..."}
              </p>
              <p className="text-xs text-white/40 mt-1">Calculating final line items</p>
            </div>
            <Receipt className={`w-5 h-5 ${invoiceDone ? 'text-emerald-400/50' : 'text-white/20'}`} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && !generating && (
        <ErrorState 
          message={error} 
          onRetry={handleGenerate} 
        />
      )}

      {/* Actions */}
      {!generating && !error && (
        <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center items-center">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white/70 rounded-full hover:bg-white/10 hover:text-white transition-all duration-300 min-h-btn w-full sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="w-full sm:w-auto flex justify-center">
            <GalaxyButton onClick={handleGenerate} text="Forge Documents" />
          </div>
        </div>
      )}
    </div>
  );
}
