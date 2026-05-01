"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Loader2, Check, Shield } from "lucide-react";
import { getSession, updateSession } from "@/lib/storage";
import { callFlow } from "@/lib/lamatic";
import type { GoverningLawOption } from "@/lib/types";
import ErrorState from "@/components/ErrorState";

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

export default function Step3GoverningLaw({ onComplete, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<GoverningLawOption[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    setLoading(true);
    setError("");
    try {
      const session = getSession();
      const pd = session.projectDetails;
      const pricing = session.pricing;
      if (!pd) throw new Error("Project details not found. Please go back.");
      if (!pricing) throw new Error("Pricing not found. Please go back.");

      const flowId = process.env.NEXT_PUBLIC_FLOW_TRADEOFF;
      if (!flowId) throw new Error("Tradeoff flow not configured.");

      const response = await callFlow(flowId, {
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
        payment_currency: pd.payment_currency,
        payment_structure: pd.payment_structure,
        work_type: pd.work_type,
      });

      const optionsRaw = response.result.options;
      const parsed: GoverningLawOption[] = typeof optionsRaw === 'string' ? JSON.parse(optionsRaw) : optionsRaw;
      setOptions(parsed);

      // Auto-select the recommended one
      const recIdx = parsed.findIndex((o) => o.recommended);
      if (recIdx !== -1) setSelected(recIdx);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get options.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selected === null || !options[selected]) return;
    updateSession({ governing_law: options[selected] });
    onComplete();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-10 h-10 text-accent animate-spin relative z-10" />
        </div>
        <p className="text-white/70 animate-pulse text-lg font-light tracking-wide">
          Analysing governing law options for your contract...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={fetchOptions} 
      />
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-light tracking-[-0.04em] mb-3 text-white">
          <span className="font-medium text-gradient-animate">Governing</span> Law
        </h2>
        <p className="text-white/50 text-[clamp(0.9rem,1.5vw,1.1rem)]">
          Choose which jurisdiction's laws will govern your contract.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-5">
        {options.map((option, idx) => {
          const isSelected = selected === idx;
          const formattedName = option.option_name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelected(idx)}
              className={`
                w-full text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group
                ${isSelected
                  ? "bg-accent/10 border-accent/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                  : "bg-white/[0.02] border-white/10 hover:border-accent/30 hover:bg-white/[0.04]"
                }
              `}
            >
              <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl" />
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 relative z-10 gap-3">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isSelected ? "bg-accent/20 border border-accent/30 shadow-inner" : "bg-white/5 border border-white/10"}`}>
                    <svg viewBox="0 0 40 40" fill="none" className={`w-7 h-7 transition-colors duration-300 ${isSelected ? "text-accent" : "text-white/50"}`}>
                      <path d="M20 4L34 11V29L20 36L6 29V11L20 4Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="20" cy="20" r="8" fill="currentColor" fillOpacity={isSelected ? "1" : "0.5"} />
                      <circle cx="20" cy="20" r="3" fill="#ffffff" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-medium ${isSelected ? "text-white" : "text-white/90"}`}>{formattedName}</h3>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {option.recommended && (
                    <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-widest bg-accent/20 text-accent border border-accent/30 rounded-full">
                      Recommended
                    </span>
                  )}
                  {isSelected && (
                    <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[15px] text-white/60 mb-6 leading-relaxed relative z-10">
                {option.explanation}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10 pt-4 border-t border-white/10 mt-6">
                <div>
                  <p className="text-[11px] font-bold text-emerald-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400/20 border border-emerald-400/50 flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                    </span> 
                    Advantages
                  </p>
                  <ul className="space-y-3">
                    {option.pros.map((pro, i) => (
                      <li key={i} className="text-sm text-white/80 flex items-start gap-3 leading-relaxed">
                        <span className="text-emerald-400 font-bold text-lg leading-none mt-[-1px]">+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-rose-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400/20 border border-rose-400/50 flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-rose-400"></span>
                    </span> 
                    Drawbacks
                  </p>
                  <ul className="space-y-3">
                    {option.cons.map((con, i) => (
                      <li key={i} className="text-sm text-white/80 flex items-start gap-3 leading-relaxed">
                        <span className="text-rose-400 font-bold text-lg leading-none mt-[-2px]">-</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
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
          disabled={selected === null}
          className="flex-1 flex items-center justify-center gap-3 px-8 py-4 liquid-glass-pill hover:bg-white/10 text-white font-medium transition-all duration-300 hover:!translate-y-0 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          Confirm Selection
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
