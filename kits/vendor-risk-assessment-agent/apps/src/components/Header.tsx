import React from 'react';
import { ShieldCheck, Sparkles, FileText, Download, RotateCcw, Activity } from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  onClear: () => void;
  onExport: () => void;
  hasData: boolean;
  isAnalyzing: boolean;
  onAnalyze?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onClear,
  onExport,
  hasData,
  isAnalyzing,
  onAnalyze,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Vendor Risk Assessment Platform
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Sparkles className="h-3 w-3 text-blue-400" />
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Automated AI Vendor Risk Analysis & Governance Platform
            </p>
          </div>
        </div>

        {/* Action Toolbar Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          {/* Sample Data Loader */}
          <button
            type="button"
            onClick={onLoadSample}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 rounded-xl transition-colors border border-slate-700 disabled:opacity-50 cursor-pointer"
            title="Load sample vendor security packet"
          >
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span>Sample Packet</span>
          </button>

          {/* Top Analyze CTA button if requested */}
          {onAnalyze && (
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/30 border border-blue-500 disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Activity className="h-3.5 w-3.5" />
                  <span>Run Analysis</span>
                </>
              )}
            </button>
          )}

          {hasData && (
            <>
              <button
                type="button"
                onClick={onClear}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                title="Reset active assessment"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={onExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Report</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
