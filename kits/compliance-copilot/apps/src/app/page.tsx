"use client";

import { useState } from "react";
import { checkCompliance } from "../actions/orchestrate";
import { CheckCircle, AlertTriangle, XCircle, ShieldCheck, FileText, Settings, Loader2 } from "lucide-react";

const SAMPLE_POLICY = `Privacy Policy for Globex Inc.

Last Updated: January 1, 2024

1. Data Collection
We collect your name, email, and browsing history. We store this data indefinitely on our servers in the United States to improve our services.

2. Data Sharing
We may share your personal data with third-party marketing partners. Users cannot opt-out of this sharing as it is required for our free service.

3. User Rights
You can request to see the data we have collected by emailing privacy@globex.com. We do not currently support deleting your account data.`;

const SAMPLE_GUIDELINES = `GDPR Compliance Checklist:
1. Data Retention: Must specify a clear, finite data retention period. Storing data indefinitely is non-compliant.
2. Data Sharing Opt-Out: Users must be able to opt-out of sharing their data with third parties for marketing purposes.
3. Right to Erasure (Right to be Forgotten): Users must have the ability to request the deletion of their personal data.`;

/**
 * Main Home page component for the Compliance Copilot dashboard.
 * Provides the UI for users to paste documents and guidelines, and displays the structured audit results.
 */
export default function Home() {
  const [documentText, setDocumentText] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pre-fills the input textareas with realistic sample data
   * to allow reviewers to quickly test the application without typing manually.
   */
  const handleLoadExample = () => {
    setDocumentText(SAMPLE_POLICY);
    setGuidelines(SAMPLE_GUIDELINES);
    setResult(null);
    setError(null);
  };

  /**
   * Submits the current document and guidelines to the backend Lamatic orchestration flow.
   * Normalizes the response and updates the UI state with the structured audit results.
   */
  const handleAudit = async () => {
    if (!documentText || !guidelines) {
      setError("Please provide both the document and the guidelines.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    const res = await checkCompliance(documentText, guidelines);

    setLoading(false);
    if (res.success) {
      let rawResult = (res.data as any)?.output || res.data?.result || res.data;

      if (typeof rawResult === 'string') {
        try {
          rawResult = JSON.parse(rawResult);
        } catch (e) {
          console.error("Failed to parse JSON string:", rawResult);
        }
      }

      if (rawResult && typeof rawResult === 'object' && !Array.isArray(rawResult) && rawResult.output) {
        rawResult = rawResult.output;
      }

      if (rawResult && typeof rawResult === 'object' && !Array.isArray(rawResult)) {
        if (rawResult._meta) {
          delete rawResult._meta;
        }
        if (rawResult.requirement || rawResult.status) {
          rawResult = [rawResult];
        }
      }

      setResult(rawResult);
    } else {
      setError(res.error || "Failed to run compliance audit.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center space-x-3 pb-6 border-b border-slate-200">
          <ShieldCheck className="w-10 h-10 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance Copilot</h1>
            <p className="text-slate-500">AI-powered regulatory compliance checker</p>
          </div>
        </div>

        {/* Inputs Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="flex items-center space-x-2 font-semibold text-lg">
              <FileText className="w-5 h-5 text-slate-600" />
              <span>Document to Check</span>
            </label>
            <textarea
              className="w-full h-80 p-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              placeholder="Paste your privacy policy, terms of service, or codebase here..."
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2 font-semibold text-lg">
              <Settings className="w-5 h-5 text-slate-600" />
              <span>Compliance Guidelines</span>
            </label>
            <textarea
              className="w-full h-80 p-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-indigo-50/30"
              placeholder="Paste the regulation requirements, specific rules, or GDPR checklist here..."
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-center space-x-4 pt-4">
          <button
            onClick={handleLoadExample}
            disabled={loading}
            className="flex items-center space-x-2 bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 px-6 py-4 rounded-full font-bold text-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <FileText className="w-6 h-6" />
            <span>Load Example</span>
          </button>

          <button
            onClick={handleAudit}
            disabled={loading}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
            <span>{loading ? "Auditing Document..." : "Run Compliance Audit"}</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center font-medium">
            {error}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Audit Results</h2>
            </div>

            <div className="space-y-4">
              {Array.isArray(result) ? (
                result.map((item: any, idx: number) => {
                  const isCompliant = item.status === "Compliant";
                  const isPartial = item.status === "Partial";
                  const isFailed = item.status === "Non-Compliant" || item.status === "Failed";

                  let statusBadge = null;

                  if (isCompliant) {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200/60">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Compliant</span>
                      </span>
                    );
                  } else if (isPartial) {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold border border-amber-200/60">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Partial Match</span>
                      </span>
                    );
                  } else if (isFailed) {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold border border-rose-200/60">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Failed</span>
                      </span>
                    );
                  }

                  return (
                    <div key={idx} className="space-y-3">
                      {/* Main Finding Card */}
                      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg text-slate-800">{item.requirement || "Requirement"}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{item.analysis || "No analysis provided."}</p>
                          </div>
                          <div className="flex-shrink-0">{statusBadge}</div>
                        </div>
                      </div>

                      {/* Separate Recommendation Box */}
                      {item.remediation && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-start space-x-2.5">
                          <div className="mt-0.5 text-slate-500 flex-shrink-0">
                            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold text-slate-800 block mb-0.5">Recommended Remediation Action</span>
                            <p className="text-slate-600 leading-relaxed">{item.remediation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-900 text-slate-100 p-6 rounded-xl overflow-x-auto border border-slate-800">
                  <pre><code className="text-sm">{JSON.stringify(result, null, 2)}</code></pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
