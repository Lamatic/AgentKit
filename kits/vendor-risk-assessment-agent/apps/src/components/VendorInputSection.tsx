import React from 'react';
import { Sparkles, FileSearch, Trash2, ArrowRight } from 'lucide-react';

interface VendorInputSectionProps {
  inputText: string;
  setInputText: (text: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onLoadPreset: (key: 'cloudProvider' | 'fintechApp') => void;
  onClearText: () => void;
}

export const VendorInputSection: React.FC<VendorInputSectionProps> = ({
  inputText,
  setInputText,
  onAnalyze,
  isAnalyzing,
  onLoadPreset,
  onClearText,
}) => {
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSearch className="h-4.5 w-4.5 text-blue-600" />
            <span>Vendor Documentation & Security Inputs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Paste vendor questionnaires, SOC 2 executive summaries, security policies, or legal terms.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] hidden md:inline">
            Load Templates:
          </span>
          <button
            type="button"
            onClick={() => onLoadPreset('cloudProvider')}
            disabled={isAnalyzing}
            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-bold transition-colors cursor-pointer text-xs disabled:opacity-50"
          >
            ApexCloud (Cloud Infrastructure)
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset('fintechApp')}
            disabled={isAnalyzing}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold transition-colors cursor-pointer text-xs disabled:opacity-50"
          >
            NovaPay (Fintech Gateway)
          </button>
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          id="vendor-description-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste vendor security profile, SOC 2 compliance summary, encryption details, certifications, financial statements, operational SLAs, or legal disclaimers..."
          rows={6}
          disabled={isAnalyzing}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 focus:outline-none transition-all resize-y min-h-[140px]"
        />

        {inputText && !isAnalyzing && (
          <button
            type="button"
            onClick={onClearText}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Clear text"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Footer Controls & Analyze Button */}
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold">{wordCount} words</span>
          <span className="text-slate-300">•</span>
          <span>{charCount} chars</span>
          {inputText && !isAnalyzing && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Input Ready
              </span>
            </>
          )}
        </div>

        <button
          id="analyze-vendor-button"
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all cursor-pointer ${
            isAnalyzing
              ? 'bg-blue-400 cursor-not-allowed opacity-80'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/20 hover:shadow-lg'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing vendor...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Analyze Vendor Risk</span>
              <ArrowRight className="h-4 w-4 opacity-70" />
            </>
          )}
        </button>
      </div>
    </section>
  );
};
