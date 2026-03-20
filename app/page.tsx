"use client";

import { useState } from "react";

interface ThreatReport {
  indicator: string;
  risk_score: number;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  recommended_action: string;
}

interface ExecuteWorkflowResult {
  result: {
    threat_report: ThreatReport | string;
  };
  status: string;
}

interface ApiResponse {
  data: {
    executeWorkflow: ExecuteWorkflowResult;
  };
}

const RISK_COLORS = {
  CRITICAL: "bg-red-500/20 text-red-400 border-red-500/50",
  HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/50",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  LOW: "bg-green-500/20 text-green-400 border-green-500/50",
};

const RISK_BADGE_COLORS = {
  CRITICAL: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-black",
  LOW: "bg-green-500 text-white",
};

export default function Home() {
  const [ipAddress, setIpAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threatReport, setThreatReport] = useState<ThreatReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setThreatReport(null);

    try {
      const response = await fetch(
        "https://rohitsorganization575-threatintelligenceagent474.lamatic.dev/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_LAMATIC_API_KEY}`,
            "x-project-id": "ea95b410-c3e5-45a4-8c34-1de5712e14e5",
          },
          body: JSON.stringify({
            query: `query ExecuteWorkflow($workflowId: String, $payload: JSON!) {
              executeWorkflow(workflowId: $workflowId, payload: $payload) {
                result
                status
              }
            }`,
            variables: {
              workflowId: "3f12c56e-b37f-4f3b-aa6f-5567a5910db0",
              payload: { sampleInput: ipAddress },
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      // Navigate through the response structure - result might be stringified
      let rawReport: ThreatReport | string | null = null;
      
      if (data.data?.executeWorkflow?.result) {
        const result = data.data.executeWorkflow.result;
        // Check if result itself is the threat report (string or object)
        if (typeof result === "string") {
          rawReport = result;
        } else if (typeof result === "object") {
          // Check for threat_report nested inside
          rawReport = (result as any).threat_report || result;
        }
      }

      if (!rawReport) {
        throw new Error("No threat report returned from API");
      }

      // Defensive JSON parsing: handle both string and object formats
      let parsedReport: ThreatReport;
      try {
        if (typeof rawReport === "string") {
          // Strip markdown code blocks if present (e.g., ```json ... ```)
          let cleanJson = rawReport.trim();
          const jsonMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            cleanJson = jsonMatch[1];
          }
          parsedReport = JSON.parse(cleanJson);
        } else {
          parsedReport = rawReport as ThreatReport;
        }
      } catch (parseError) {
        console.error("Failed to parse threat report:", parseError);
        throw new Error("Failed to parse threat intelligence data");
      }

      setThreatReport(parsedReport);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg
              className="w-8 h-8 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h1 className="text-4xl font-bold text-neutral-100">
              Threat Intelligence Agent
            </h1>
          </div>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            Advanced IP threat analysis powered by VirusTotal, AbuseIPDB, and
            Shodan. Enter an IP address to scan for potential security threats
            and receive actionable intelligence.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="Enter IP address (e.g., 192.168.1.1)"
              className="flex-1 px-6 py-4 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Scanning...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Scan IP
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-red-400 font-semibold mb-1">
                  Scan Failed
                </h3>
                <p className="text-red-300/80 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Card */}
        {threatReport && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              {/* Card Header */}
              <div className="bg-neutral-800/50 px-6 py-4 border-b border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                    <h2 className="text-xl font-semibold text-neutral-100">
                      Threat Analysis Report
                    </h2>
                  </div>
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-bold ${RISK_BADGE_COLORS[threatReport.risk_level]}`}
                  >
                    {threatReport.risk_level}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-6">
                {/* Risk Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-400 text-sm font-medium">
                      Risk Score
                    </span>
                    <span className="text-neutral-200 font-mono text-lg">
                      {threatReport.risk_score}/100
                    </span>
                  </div>
                  <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        threatReport.risk_score >= 75
                          ? "bg-red-500"
                          : threatReport.risk_score >= 50
                          ? "bg-orange-500"
                          : threatReport.risk_score >= 25
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${threatReport.risk_score}%` }}
                    />
                  </div>
                </div>

                {/* Indicator */}
                <div
                  className={`p-4 rounded-lg border ${RISK_COLORS[threatReport.risk_level]}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="font-semibold">Indicator</span>
                  </div>
                  <p className="font-mono text-sm">{threatReport.indicator}</p>
                </div>

                {/* Summary */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="font-semibold text-neutral-300">
                      Summary
                    </span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed">
                    {threatReport.summary}
                  </p>
                </div>

                {/* Recommended Action */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    <span className="font-semibold text-neutral-300">
                      Recommended Action
                    </span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed">
                    {threatReport.recommended_action}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
