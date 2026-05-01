"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Loader2, Info, Plus, Trash2 } from "lucide-react";
import { getSession, updateSession } from "@/lib/storage";
import { callFlow } from "@/lib/lamatic";
import type { PricingResult, PricingLineItem } from "@/lib/types";
import ErrorState from "@/components/ErrorState";

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

export default function Step2Pricing({ onComplete, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pricing, setPricing] = useState<PricingResult | null>(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    setError("");
    try {
      // SIMULATED ERROR FOR TESTING:
      throw new Error("Simulated connection error. The AI engine is currently under maintenance.");
      const session = getSession();
      const pd = session.projectDetails;
      if (!pd) throw new Error("Project details not found. Please go back.");

      const flowId = process.env.NEXT_PUBLIC_FLOW_PRICING;
      if (!flowId) throw new Error("Pricing flow not configured.");

      const response = await callFlow(flowId, {
        work_type: pd.work_type,
        field: pd.field,
        experience_level: pd.experience_level,
        years_of_experience: pd.years_of_experience,
        deliverables: pd.deliverables,
        payment_structure: pd.payment_structure,
        currency: pd.payment_currency,
        freelancer_country: pd.freelancer_country,
        client_country: pd.client_country,
      });

      const pricingRaw = response.result.pricing;
      const parsed: PricingResult = typeof pricingRaw === 'string' ? JSON.parse(pricingRaw) : pricingRaw;
      setPricing(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get pricing.");
    } finally {
      setLoading(false);
    }
  };

  const updateLineItem = (
    idx: number,
    key: keyof PricingLineItem,
    value: string
  ) => {
    if (!pricing) return;
    const updated = [...pricing.line_items];
    updated[idx] = { ...updated[idx], [key]: value };

    // Recalculate amount if quantity or rate changes
    if (key === "quantity" || key === "rate") {
      const qty = parseFloat(key === "quantity" ? value : updated[idx].quantity) || 0;
      const rate = parseFloat(key === "rate" ? value : updated[idx].rate) || 0;
      updated[idx].amount = (qty * rate).toFixed(2);
    }

    // Recalculate total
    const total = updated.reduce((sum, li) => sum + (parseFloat(li.amount) || 0), 0);

    setPricing({
      ...pricing,
      line_items: updated,
      total_amount: total.toFixed(2),
    });
  };

  const addLineItem = () => {
    if (!pricing) return;
    const newItem: PricingLineItem = {
      description: "New Item",
      quantity: "1",
      rate: "0",
      amount: "0.00",
      justification: ""
    };
    const updated = [...pricing.line_items, newItem];
    const total = updated.reduce((sum, li) => sum + (parseFloat(li.amount) || 0), 0);
    setPricing({
      ...pricing,
      line_items: updated,
      total_amount: total.toFixed(2),
    });
  };

  const removeLineItem = (idx: number) => {
    if (!pricing) return;
    const updated = pricing.line_items.filter((_, i) => i !== idx);
    const total = updated.reduce((sum, li) => sum + (parseFloat(li.amount) || 0), 0);
    setPricing({
      ...pricing,
      line_items: updated,
      total_amount: total.toFixed(2),
    });
  };

  const handleConfirm = () => {
    if (!pricing) return;
    updateSession({ pricing });
    onComplete();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-10 h-10 text-accent animate-spin relative z-10" />
        </div>
        <p className="text-white/70 animate-pulse text-lg font-light tracking-wide">
          Analysing your experience & market rates...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={fetchPricing} 
      />
    );
  }

  if (!pricing) return null;

  const inputClass =
    "w-full px-4 py-2.5 bg-[#050508]/40 backdrop-blur-md border border-white/10 rounded-lg text-white text-sm focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-300 outline-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]";

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-light tracking-[-0.04em] mb-3 text-white">
          <span className="font-medium text-gradient-animate">Suggested</span> Pricing
        </h2>
        <p className="text-white/50 text-[clamp(0.9rem,1.5vw,1.1rem)]">
          Review and adjust the AI-suggested rates for your project.
        </p>
      </div>

      {/* Context banner */}
      <div className="p-5 bg-accent/10 border border-accent/20 rounded-2xl backdrop-blur-md shadow-[inset_0_1px_10px_rgba(99,102,241,0.1)]">
        <div className="flex items-start gap-4">
          <Info className="w-6 h-6 text-accent flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-2 text-[15px] leading-relaxed">
            <p className="text-white/90">{pricing.experience_assessment}</p>
            <p className="text-white/60">{pricing.market_context}</p>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-4">
        {pricing.line_items.map((item, idx) => (
          <div
            key={idx}
            className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-5 hover:border-accent/40 transition-colors duration-300 relative overflow-hidden group"
          >
            {/* Ambient hover glow */}
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl" />

            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 relative z-10">
              <input
                className="w-full bg-transparent text-white font-medium text-lg focus:border-accent outline-none transition-colors"
                value={item.description}
                onChange={(e) => updateLineItem(idx, "description", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeLineItem(idx)}
                className="text-white/30 hover:text-rose-400 transition-colors p-2"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
              <div>
                <label className="text-[11px] text-white/50 mb-1.5 block uppercase tracking-wider font-semibold">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={inputClass}
                  value={item.quantity}
                  onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] text-white/50 mb-1.5 block uppercase tracking-wider font-semibold">Rate ({pricing.currency})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={inputClass}
                  value={item.rate}
                  onChange={(e) => updateLineItem(idx, "rate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] text-white/50 mb-1.5 block uppercase tracking-wider font-semibold">Amount</label>
                <div className="w-full px-4 py-2.5 bg-accent/10 border border-accent/20 rounded-lg text-accent text-sm font-semibold flex items-center shadow-[inset_0_2px_10px_rgba(99,102,241,0.1)]">
                  {pricing.currency} {item.amount}
                </div>
              </div>
            </div>

            {item.justification && (
              <p className="text-sm text-white/50 italic relative z-10 border-l-2 border-accent/30 pl-3">"{item.justification}"</p>
            )}
          </div>
        ))}
        
        <button
          type="button"
          onClick={addLineItem}
          className="w-full py-4 border-2 border-dashed border-white/10 hover:border-accent/30 rounded-2xl text-white/50 hover:text-accent flex items-center justify-center gap-2 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Item</span>
        </button>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between p-6 bg-[#14141a]/60 backdrop-blur-xl border border-accent/30 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/20 pointer-events-none" />
        <span className="text-white/60 font-medium uppercase tracking-widest text-sm relative z-10">Total Estimated</span>
        <span className="text-3xl font-light text-white relative z-10">
          <span className="text-accent font-medium mr-1">{pricing.currency}</span> 
          {pricing.total_amount}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 min-h-btn"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 flex items-center justify-center gap-3 px-8 py-4 liquid-glass-pill hover:bg-white/10 text-white font-medium transition-all duration-300 hover:!translate-y-0"
        >
          Confirm Pricing
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
