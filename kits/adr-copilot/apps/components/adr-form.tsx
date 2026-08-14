"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Sparkles, FileText, Settings2, Loader2, ArrowRight } from "lucide-react";
import { PresetPicker, PRESETS, Preset } from "./preset-picker";

const adrSchema = z.object({
  instructions: z.string().trim().min(5, "Please provide at least 5 characters describing the architectural decision."),
  constraints: z.string().optional(),
});

interface ADRFormProps {
  onSubmit: (instructions: string, constraints: string) => Promise<void>;
  isLoading: boolean;
}

export function ADRForm({ onSubmit, isLoading }: ADRFormProps) {
  const [instructions, setInstructions] = useState(PRESETS[0].instructions);
  const [constraints, setConstraints] = useState(PRESETS[0].constraints);
  const [touched, setTouched] = useState(false);

  const handlePresetSelect = (preset: Preset) => {
    setInstructions(preset.instructions);
    setConstraints(preset.constraints);
    setTouched(false);
  };

  const parsed = adrSchema.safeParse({ instructions, constraints });
  const isValid = parsed.success;
  const instructionError = !isValid && touched
    ? parsed.error.issues.find(i => i.path[0] === "instructions")?.message
    : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (isValid) {
      onSubmit(instructions, constraints);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-5">
      <PresetPicker onSelect={handlePresetSelect} />

      <hr className="border-slate-800" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="instructions" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span>Technical Proposal / Design Notes</span>
            <span className="text-rose-400">*</span>
          </label>
          <textarea
            id="instructions"
            rows={8}
            value={instructions}
            onChange={(e) => { setInstructions(e.target.value); setTouched(true); }}
            onBlur={() => setTouched(true)}
            placeholder="Describe the architectural decision, options being evaluated, current infrastructure, and technical context..."
            className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono resize-y ${
              instructionError
                ? "border-rose-500 focus:ring-rose-500/50"
                : "border-slate-800 focus:ring-cyan-500/50 focus:border-cyan-500"
            }`}
            required
          />
          {instructionError && (
            <p className="mt-1.5 text-xs" style={{ color: "hsl(var(--color-danger-fg))" }}>{instructionError}</p>
          )}
        </div>

        <div>
          <label htmlFor="constraints" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-purple-400" />
            <span>Operational Constraints & Decision Drivers (Optional)</span>
          </label>
          <textarea
            id="constraints"
            rows={3}
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="e.g., Sub-50ms latency budget, team size 4, $500/mo cloud ceiling, SOC2 compliance"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="w-full py-3 px-5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all duration-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Analyzing Architecture & Generating MADR 3.0...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-cyan-200" />
              <span>Generate Architecture Decision Record</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
