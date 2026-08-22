"use client";

import React, { useState } from "react";
import { processCrmLead } from "@/actions/orchestrate";
import { Sparkles, Building2, Zap, Send, CheckCircle2, Copy, Layers, PhoneCall, AlertCircle, ArrowRight, ShieldCheck, Terminal, Code2 } from "lucide-react";

export default function Page() {
  const [leadText, setLeadText] = useState(
    "Ashutosh Joshi, Head of AI Engineering at Swades / Enterprise AI. Email: ashutosh@example.com. Looking to purchase 500 licenses for multi-CRM automation ($50k-$100k budget) in the next 30 days."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"salesforce" | "sap" | "zoho" | "dynamics365">("salesforce");
  const [viewMode, setViewMode] = useState<"json" | "curl">("json");
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

  const getCurlCommand = () => {
    if (!activePayload) return "";
    const domainMap: Record<string, string> = {
      salesforce: "https://your-instance.salesforce.com",
      sap: "https://your-s4hana.sap.com",
      zoho: "https://www.zohoapis.com",
      dynamics365: "https://your-org.crm.dynamics.com"
    };
    const domain = domainMap[activeTab] || "https://api.crm.com";
    const payloadStr = JSON.stringify(activePayload.payload).replace(/'/g, "'\\''");
    return `curl -X POST "${domain}${activePayload.endpoint}" \\\n  -H "Authorization: Bearer YOUR_CRM_ACCESS_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '${payloadStr}'`;
  };

  const handleCopy = async () => {
    if (activePayload) {
      try {
        const textToCopy = viewMode === "json" ? JSON.stringify(activePayload.payload, null, 2) : getCurlCommand();
        await navigator.clipboard.writeText(textToCopy);
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
      <div style={{ maxWidth: "1280px", margin: "0 auto 2.5rem auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)", border: "1px solid rgba(99, 102, 241, 0.4)", padding: "0.45rem 1.2rem", borderRadius: "9999px", color: "#a5b4fc", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.03em", marginBottom: "1.2rem" }}>
          <Sparkles size={16} /> Lamatic.ai AgentKit Enterprise Intelligence Engine
        </div>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 0.75rem 0", letterSpacing: "-0.02em" }}>
          Universal Multi-CRM AI Copilot
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.15rem", maxWidth: "800px", margin: "0 auto", lineHeight: 1.6 }}>
          Transform raw prospect communications into validated API payloads for <b>Salesforce SObject</b>, <b>SAP C/4HANA OData</b>, <b>Zoho CRM v2</b>, and <b>MS Dynamics 365 Web API</b>.
        </p>
      </div>

      {/* Architecture Visualizer Ribbon */}
      <div style={{ maxWidth: "1280px", margin: "0 auto 2rem auto", background: "rgba(13, 19, 34, 0.8)", border: "1px solid var(--border-color)", borderRadius: "1rem", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#cbd5e1" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(99, 102, 241, 0.2)", border: "1px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a5b4fc" }}>1</div>
          <div>Unstructured Input<br /><span style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem" }}>Email / Call Transcript</span></div>
        </div>
        <ArrowRight size={18} color="#475569" />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#cbd5e1" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(99, 102, 241, 0.2)", border: "1px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a5b4fc" }}>2</div>
          <div>gpt-4o Intent Scoring<br /><span style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem" }}>Velocity & Authority (0-100)</span></div>
        </div>
        <ArrowRight size={18} color="#475569" />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#cbd5e1" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(99, 102, 241, 0.2)", border: "1px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a5b4fc" }}>3</div>
          <div>Schema Normalizer<br /><span style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem" }}>4 Enterprise Standards</span></div>
        </div>
        <ArrowRight size={18} color="#475569" />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#cbd5e1" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", border: "1px solid var(--success-color)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>4</div>
          <div>CRM API Payload<br /><span style={{ color: "#34d399", fontWeight: 700, fontSize: "0.75rem" }}>✓ Validated REST/OData</span></div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "2rem" }}>

        {/* Input Form */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 20px 40px -15px rgba(0,0,0,0.7)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "#f1f5f9" }}>
            <Layers size={20} color="#6366f1" /> Real-time Prospect Intelligence Input
          </h2>
          <form onSubmit={handleSubmit}>
            <textarea
              value={leadText}
              onChange={(e) => setLeadText(e.target.value)}
              rows={10}
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
              style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "#ffffff", border: "none", borderRadius: "0.85rem", padding: "1rem", fontWeight: 700, fontSize: "1rem", cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", boxShadow: "0 8px 25px -4px rgba(79, 70, 229, 0.6)" }}
            >
              {loading ? <Zap size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? "Normalizing & Scoring with AI..." : "Normalize & Generate Enterprise Payloads"}
            </button>
          </form>

          {/* Matrix + Presets */}
          <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.75rem" }}>📊 Real-time Entity Analysis Matrix:</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ background: "#080c17", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#38bdf8" }}>{result?.extractedLead?.authority || "98%"}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginTop: "0.2rem" }}>Authority</div>
              </div>
              <div style={{ background: "#080c17", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#38bdf8" }}>{result?.extractedLead?.budget || "$100k+"}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginTop: "0.2rem" }}>Budget Tier</div>
              </div>
              <div style={{ background: "#080c17", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#38bdf8" }}>{result?.extractedLead?.urgency || "30 Days"}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginTop: "0.2rem" }}>Buying Window</div>
              </div>
            </div>

            <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>⚡ Preset Prospect Presets:</span>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
              <button
                onClick={() => setLeadText("Ashutosh Joshi, Head of AI Engineering at Swades / Enterprise AI. Email: ashutosh@example.com. Looking to purchase 500 licenses for multi-CRM automation ($50k-$100k budget) in the next 30 days.")}
                style={{ background: "#161e31", border: "1px solid #283553", borderRadius: "0.6rem", padding: "0.55rem 0.9rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
              >
                Sample 1: Enterprise AI VP
              </button>
              <button
                onClick={() => setLeadText("Simeon Mark, CEO of Telentir AI. email: simeon@telentir.team. Wants AI phone agents integrated with Salesforce & Dynamics 365. Urgent requirement.")}
                style={{ background: "#161e31", border: "1px solid #283553", borderRadius: "0.6rem", padding: "0.55rem 0.9rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
              >
                Sample 2: Voice AI CEO
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
              <div style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)", border: "1px solid rgba(16, 185, 129, 0.35)", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 800, textTransform: "uppercase" }}>AI INTENT SCORE</div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "var(--success-color)", letterSpacing: "-0.03em" }}>{result.leadScore} / 100</div>
                  </div>
                  <div>
                    <span style={{ background: "rgba(16, 185, 129, 0.25)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.4)", padding: "0.4rem 0.9rem", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 800 }}>
                      {result.leadTier}
                    </span>
                  </div>
                </div>
                <div style={{ width: "100%", height: "10px", background: "rgba(15, 23, 42, 0.8)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${result.leadScore || 95}%`, background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)", borderRadius: "9999px" }} />
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {(["salesforce", "sap", "zoho", "dynamics365"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        background: activeTab === tab ? "var(--accent-primary)" : "#161e31",
                        color: activeTab === tab ? "#ffffff" : "var(--text-muted)",
                        border: "1px solid transparent",
                        borderRadius: "0.65rem",
                        padding: "0.55rem 0.95rem",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        textTransform: "capitalize"
                      }}
                    >
                      {tab === "dynamics365" ? "MS Dynamics 365" : tab === "sap" ? "SAP C/4HANA" : tab}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", background: "#161e31", border: "1px solid var(--border-color)", borderRadius: "0.5rem", padding: "0.2rem" }}>
                  <button onClick={() => setViewMode("json")} style={{ background: viewMode === "json" ? "#334155" : "transparent", border: "none", color: viewMode === "json" ? "#ffffff" : "#94a3b8", padding: "0.3rem 0.6rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "0.35rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Code2 size={12} /> JSON
                  </button>
                  <button onClick={() => setViewMode("curl")} style={{ background: viewMode === "curl" ? "#334155" : "transparent", border: "none", color: viewMode === "curl" ? "#ffffff" : "#94a3b8", padding: "0.3rem 0.6rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "0.35rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Terminal size={12} /> cURL
                  </button>
                </div>
              </div>

              {/* Active Payload Viewer */}
              {activePayload && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "0.35rem 0.75rem", borderRadius: "0.4rem", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                        Endpoint: {activePayload.endpoint}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#34d399", background: "rgba(16, 185, 129, 0.15)", padding: "0.25rem 0.6rem", borderRadius: "0.4rem", fontWeight: 700 }}>
                        <ShieldCheck size={13} /> Schema Compliant
                      </span>
                    </div>
                    <button
                      onClick={handleCopy}
                      style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "0.45rem", padding: "0.35rem 0.75rem", color: "#cbd5e1", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      {copied ? <CheckCircle2 size={13} color="var(--success-color)" /> : <Copy size={13} />}
                      {copied ? "Copied!" : "Copy Output"}
                    </button>
                  </div>
                  <pre style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "0.85rem", padding: "1.25rem", color: "#e2e8f0", fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.6, overflowX: "auto", margin: 0 }}>
                    {viewMode === "json" ? JSON.stringify(activePayload.payload, null, 2) : getCurlCommand()}
                  </pre>
                </div>
              )}

              {/* Outreach Generation Preview */}
              {result.outreach && (
                <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a5b4fc", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <PhoneCall size={15} /> AI Multi-Channel Outreach Playbook
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                    <div style={{ background: "#080c17", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "1rem", fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                      <div><b>Email Subject:</b></div>
                      <div style={{ marginTop: "0.3rem", color: "#f1f5f9" }}>{result.outreach.emailSubject}</div>
                    </div>
                    <div style={{ background: "#080c17", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "1rem", fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                      <div><b>AI Voice Agent Script:</b></div>
                      <div style={{ marginTop: "0.3rem", color: "#f1f5f9" }}>{result.outreach.voiceScript}</div>
                    </div>
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
