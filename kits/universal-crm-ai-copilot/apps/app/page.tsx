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
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f1f5f9", fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      {/* Header */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 2rem auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "0.4rem 1rem", borderRadius: "9999px", color: "#818cf8", fontSize: "0.875rem", marginBottom: "1rem" }}>
          <Sparkles size={16} /> Lamatic.ai AgentKit Featured Kit
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "800", background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 0.5rem 0" }}>
          Universal Multi-CRM AI Copilot
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1.1rem", maxWidth: "700px", margin: "0 auto" }}>
          Normalize raw leads & conversation transcripts into <b>Salesforce</b>, <b>SAP C/4HANA</b>, <b>Zoho CRM</b>, and <b>MS Dynamics 365</b> schemas with AI Intent Scoring.
        </p>
      </div>

      {/* Main Grid */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2rem" }}>

        {/* Input Form */}
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#e2e8f0" }}>
            <Layers size={20} color="#6366f1" /> Unstructured Lead Input
          </h2>
          <form onSubmit={handleSubmit}>
            <textarea
              value={leadText}
              onChange={(e) => setLeadText(e.target.value)}
              rows={8}
              placeholder="Paste lead email, call transcript, or web form inquiry here..."
              style={{ width: "100%", background: "#0b0f19", border: "1px solid #334155", borderRadius: "0.75rem", padding: "1rem", color: "#f8fafc", fontSize: "0.95rem", resize: "vertical", outline: "none", marginBottom: "1rem" }}
            />
            {errorMessage && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "0.5rem", padding: "0.75rem", color: "#fca5a5", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} /> {errorMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "#ffffff", border: "none", borderRadius: "0.75rem", padding: "0.85rem", fontWeight: "700", fontSize: "1rem", cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "opacity 0.2s" }}
            >
              {loading ? <Zap size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? "Normalizing & Scoring with AI..." : "Process Across 4 CRMs"}
            </button>
          </form>

          {/* Preset Samples */}
          <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #1e293b" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>Quick Sample Presets:</span>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => setLeadText("Ashutosh Joshi, Head of AI Engineering at Swades / Enterprise AI. Email: ashutosh@example.com. Looking to purchase 500 licenses for multi-CRM automation ($50k-$100k budget) in the next 30 days.")}
                style={{ background: "#1e293b", border: "none", borderRadius: "0.5rem", padding: "0.4rem 0.75rem", color: "#94a3b8", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Sample 1: Enterprise Lead
              </button>
              <button
                onClick={() => setLeadText("Simeon Mark, CEO of Telentir AI. email: simeon@telentir.team. Wants AI phone agents integrated with Salesforce & Dynamics 365. Urgent requirement.")}
                style={{ background: "#1e293b", border: "none", borderRadius: "0.5rem", padding: "0.4rem 0.75rem", color: "#94a3b8", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Sample 2: Voice AI Startup
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
          {!result ? (
            <div style={{ margin: "auto", textAlign: "center", color: "#64748b" }}>
              <Building2 size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
              <p>Submit unstructured lead data to generate live CRM payloads & AI Intent Scores.</p>
            </div>
          ) : (
            <>
              {/* Lead Intent Badge */}
              <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "0.75rem", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: "700" }}>AI INTENT SCORE</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "900", color: "#10b981" }}>{result.leadScore} / 100</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ background: "#065f46", color: "#a7f3d0", padding: "0.3rem 0.75rem", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: "700" }}>
                    {result.leadTier}
                  </span>
                </div>
              </div>

              {/* CRM Tabs */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid #1e293b", paddingBottom: "0.5rem" }}>
                {(["salesforce", "sap", "zoho", "dynamics365"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: activeTab === tab ? "#4f46e5" : "#1e293b",
                      color: activeTab === tab ? "#ffffff" : "#94a3b8",
                      border: "none",
                      borderRadius: "0.5rem",
                      padding: "0.5rem 1rem",
                      fontWeight: "700",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {tab === "dynamics365" ? "MS Dynamics" : tab}
                  </button>
                ))}
              </div>

              {/* Active Payload Viewer */}
              {activePayload && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontFamily: "monospace" }}>Endpoint: {activePayload.endpoint}</span>
                    <button
                      onClick={handleCopy}
                      style={{ background: "transparent", border: "1px solid #334155", borderRadius: "0.4rem", padding: "0.25rem 0.5rem", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                    >
                      {copied ? <CheckCircle2 size={12} color="#10b981" /> : <Copy size={12} />}
                      {copied ? "Copied!" : "Copy JSON"}
                    </button>
                  </div>
                  <pre style={{ flex: 1, background: "#090d16", border: "1px solid #1e293b", borderRadius: "0.5rem", padding: "1rem", color: "#38bdf8", fontSize: "0.85rem", overflowX: "auto", margin: 0 }}>
                    {JSON.stringify(activePayload.payload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Outreach Generation Preview */}
              {result.outreach && (
                <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #1e293b" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#a5b4fc", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <PhoneCall size={14} /> AI Multi-Channel Outreach
                  </div>
                  <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.8rem", color: "#cbd5e1" }}>
                    <div><b>Email Subject:</b> {result.outreach.emailSubject}</div>
                    <div style={{ marginTop: "0.4rem" }}><b>Voice Script:</b> {result.outreach.voiceScript}</div>
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
