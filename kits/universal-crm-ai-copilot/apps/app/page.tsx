"use client";

import React, { useState } from "react";
import { processCrmLead } from "@/actions/orchestrate";
import { Sparkles, Building2, Zap, Send, CheckCircle2, Copy, Layers, PhoneCall, AlertCircle } from "lucide-react";

export default function Page() {
  const [leadText, setLeadText] = useState(
    "Ashutosh Joshi, Head of AI Engineering at Swades / Enterprise AI. Email: ashutosh@example.com. Looking to purchase 500 licenses for multi-CRM automation ($50k-$100k budget) in the next 30 days."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"salesforce" | "sap" | "zoho" | "dynamics365">("salesforce");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await processCrmLead(leadText);
      if (res.success) {
        setResult(res.data);
      } else {
        setErrorMessage(res.error || "Failed to process lead.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const activePayload = result?.crmPayloads?.[activeTab];

  const handleCopy = async () => {
    if (activePayload) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(activePayload.payload, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)", color: "var(--text-main)", padding: "2.5rem 1.5rem" }}>
      {/* Header */}
      <div style={{ maxWidth: "1240px", margin: "0 auto 2.5rem auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)", border: "1px solid rgba(99, 102, 241, 0.4)", padding: "0.45rem 1.2rem", borderRadius: "9999px", color: "#a5b4fc", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.03em", marginBottom: "1.2rem" }}>
          <Sparkles size={16} /> Lamatic.ai AgentKit Featured Intelligence Kit
        </div>
        <h1 style={{ fontSize: "2.8rem", fontWeight: 800, background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 0.75rem 0", letterSpacing: "-0.02em" }}>
          Universal Multi-CRM AI Copilot
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.15rem", maxWidth: "760px", margin: "0 auto", lineHeight: 1.6 }}>
          Normalize raw leads & call transcripts into <b>Salesforce SObject</b>, <b>SAP C/4HANA OData</b>, <b>Zoho CRM v2</b>, and <b>MS Dynamics Web API</b> with AI Intent Scoring (0–100).
        </p>
      </div>

      {/* Main Grid */}
      <div style={{ maxWidth: "1240px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: "2rem" }}>

        {/* Input Form */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 20px 40px -15px rgba(0,0,0,0.7)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "#f1f5f9" }}>
            <Layers size={20} color="#6366f1" /> Unstructured Prospect Data
          </h2>
          <form onSubmit={handleSubmit}>
            <textarea
              value={leadText}
              onChange={(e) => setLeadText(e.target.value)}
              rows={9}
              placeholder="Paste prospect lead email, call transcript, or web inquiry here..."
              style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "0.85rem", padding: "1.1rem", color: "#f8fafc", fontSize: "0.95rem", lineHeight: 1.5, resize: "vertical", outline: "none", marginBottom: "1.2rem" }}
            />
            {errorMessage && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "0.5rem", padding: "0.75rem", color: "#fca5a5", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} /> {errorMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "#ffffff", border: "none", borderRadius: "0.85rem", padding: "0.95rem", fontWeight: 700, fontSize: "1rem", cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", boxShadow: "0 8px 20px -4px rgba(79, 70, 229, 0.5)" }}
            >
              {loading ? <Zap size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? "Normalizing & Scoring with AI..." : "Process Across 4 Enterprise CRMs"}
            </button>
          </form>

          {/* Preset Samples */}
          <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>⚡ Preset Sample Leads:</span>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
              <button
                onClick={() => setLeadText("Ashutosh Joshi, Head of AI Engineering at Swades / Enterprise AI. Email: ashutosh@example.com. Looking to purchase 500 licenses for multi-CRM automation ($50k-$100k budget) in the next 30 days.")}
                style={{ background: "#161e31", border: "1px solid #283553", borderRadius: "0.6rem", padding: "0.5rem 0.85rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
              >
                Sample 1: Enterprise Lead
              </button>
              <button
                onClick={() => setLeadText("Simeon Mark, CEO of Telentir AI. email: simeon@telentir.team. Wants AI phone agents integrated with Salesforce & Dynamics 365. Urgent requirement.")}
                style={{ background: "#161e31", border: "1px solid #283553", borderRadius: "0.6rem", padding: "0.5rem 0.85rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
              >
                Sample 2: Voice AI Startup
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 20px 40px -15px rgba(0,0,0,0.7)", display: "flex", flexDirection: "column" }}>
          {!result ? (
            <div style={{ margin: "auto", textAlign: "center", color: "#64748b" }}>
              <Building2 size={52} style={{ opacity: 0.3, marginBottom: "1rem" }} />
              <p style={{ fontSize: "1.05rem" }}>Submit unstructured lead data to generate live CRM payloads & AI Intent Scores.</p>
            </div>
          ) : (
            <>
              {/* Lead Intent Badge */}
              <div style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 800, textTransform: "uppercase" }}>AI INTENT SCORE</div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--success-color)", letterSpacing: "-0.03em" }}>{result.leadScore} / 100</div>
                  </div>
                  <div>
                    <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.4)", padding: "0.35rem 0.85rem", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 700 }}>
                      {result.leadTier}
                    </span>
                  </div>
                </div>
                <div style={{ width: "100%", height: "8px", background: "rgba(15, 23, 42, 0.8)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${result.leadScore || 92}%`, background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)", borderRadius: "9999px" }} />
                </div>
              </div>

              {/* CRM Tabs */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
                {(["salesforce", "sap", "zoho", "dynamics365"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: activeTab === tab ? "var(--accent-primary)" : "#161e31",
                      color: activeTab === tab ? "#ffffff" : "var(--text-muted)",
                      border: "1px solid transparent",
                      borderRadius: "0.65rem",
                      padding: "0.55rem 1.1rem",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {tab === "dynamics365" ? "MS Dynamics 365" : tab === "sap" ? "SAP C/4HANA" : tab}
                  </button>
                ))}
              </div>

              {/* Active Payload Viewer */}
              {activePayload && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "0.35rem 0.75rem", borderRadius: "0.4rem", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                      Endpoint: {activePayload.endpoint}
                    </span>
                    <button
                      onClick={handleCopy}
                      style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "0.45rem", padding: "0.35rem 0.75rem", color: "#cbd5e1", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      {copied ? <CheckCircle2 size={13} color="var(--success-color)" /> : <Copy size={13} />}
                      {copied ? "Copied!" : "Copy JSON"}
                    </button>
                  </div>
                  <pre style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "0.85rem", padding: "1.25rem", color: "#e2e8f0", fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.6, overflowX: "auto", margin: 0 }}>
                    {JSON.stringify(activePayload.payload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Outreach Generation Preview */}
              {result.outreach && (
                <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#a5b4fc", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <PhoneCall size={16} /> AI Multi-Channel Outreach Generation
                  </div>
                  <div style={{ background: "#080c17", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "1rem", fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                    <div><b>Email Subject:</b> {result.outreach.emailSubject}</div>
                    <div style={{ marginTop: "0.5rem" }}><b>Voice Script:</b> {result.outreach.voiceScript}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
