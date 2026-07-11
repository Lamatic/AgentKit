import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Clipboard, Check } from "lucide-react";

interface RcaReportProps {
  reportMarkdown: string;
}

export default function RcaReport({ reportMarkdown }: RcaReportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy report text: ", err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden">
      {/* Report Header Banner */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white dark:bg-slate-950">
        <h3 className="font-bold text-sm uppercase tracking-wider">Root Cause Analysis Postmortem</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Clipboard className="w-4 h-4" />
              <span>Copy Markdown</span>
            </>
          )}
        </button>
      </div>

      {/* Markdown Body */}
      <div className="p-6 md:p-8 prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-200">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold text-slate-800 dark:text-white mt-4 mb-2">{children}</h3>,
            p: ({ children }) => <p className="text-sm leading-relaxed mb-4 text-slate-600 dark:text-slate-355">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-4 text-sm space-y-1.5 text-slate-600 dark:text-slate-355">{children}</ul>,
            li: ({ children }) => <li>{children}</li>,
            code: ({ children }) => <code className="bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800 dark:text-slate-200">{children}</code>,
            pre: ({ children }) => <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto text-xs font-mono text-slate-750 dark:text-slate-300 mb-4">{children}</pre>,
          }}
        >
          {reportMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
