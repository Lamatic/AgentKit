"use client";

import { useState } from "react";
import { runSupplyChainScan, draftSupplierEmail } from "@/actions/orchestrate";
import type { ScanResult, SupplierRisk, EmailDraft } from "@/lib/types";

const SAMPLE_CSV = `name,location,lat,lng,components_supplied,tier
Apex Electronics,Shenzhen China,22.5431,114.0579,Microcontrollers,1
Pacific Textiles,Dhaka Bangladesh,23.8103,90.4125,Fabric,1
Euro Chemicals,Rotterdam Netherlands,51.9244,4.4777,Industrial Adhesives,2
Nippon Precision,Osaka Japan,34.6937,135.5023,Optical Sensors,1
Atlas Metals,Johannesburg South Africa,-26.2041,28.0473,Aluminum Alloy,2`;

function dotClass(level: string) {
  switch (level) {
    case "Critical": return "row-dot critical";
    case "High":     return "row-dot high";
    case "Elevated": return "row-dot elevated";
    default:         return "row-dot normal";
  }
}
function badgeClass(level: string) {
  switch (level) {
    case "Critical": return "badge badge-critical";
    case "High":     return "badge badge-high";
    case "Elevated": return "badge badge-elevated";
    default:         return "badge badge-normal";
  }
}
function scoreColor(score: number) {
  if (score >= 80) return "var(--critical)";
  if (score >= 60) return "var(--high)";
  if (score >= 40) return "var(--elevated)";
  return "var(--normal)";
}
function urgencyClass(level: string) {
  if (level === "critical") return "urgency-tag urgency-critical";
  if (level === "high")     return "urgency-tag urgency-high";
  return "urgency-tag urgency-elevated";
}

interface EmailModalProps {
  supplier: SupplierRisk;
  onClose: () => void;
}

function EmailModal({ supplier, onClose }: EmailModalProps) {
  const [loading, setLoading]   = useState(false);
  const [draft, setDraft]       = useState<EmailDraft | null>(null);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    const res = await draftSupplierEmail(
      supplier.name, supplier.location, supplier.risk_score,
      supplier.risk_factors, supplier.components_supplied
    );
    setLoading(false);
    if (res.success) setDraft(res.data);
    else setError(res.error);
  }

  function copy() {
    if (!draft) return;
    navigator.clipboard.writeText(`Subject: ${draft.email_subject}\n\n${draft.email_body}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-head">
          <h2>Draft Supplier Email</h2>
          <div className="modal-subtitle">
            <span className={badgeClass(supplier.risk_level)}>{supplier.risk_level}</span>
            <span>{supplier.name}</span>
            <span style={{ color: "var(--border)" }}>·</span>
            <span>{supplier.location}</span>
          </div>
        </div>

        <div className="modal-body">
          {!draft && !loading && (
            <>
              <div style={{
                background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "16px", marginBottom: 20
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Risk Score</span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: scoreColor(supplier.risk_score), lineHeight: 1 }}>{supplier.risk_score}</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>/100</span>
                </div>
                <div style={{ background: "var(--border)", borderRadius: 999, height: 5, overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: `${supplier.risk_score}%`, background: scoreColor(supplier.risk_score), borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Risk Factors</div>
                <ul className="risk-factor-list">
                  {supplier.risk_factors.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={generate}>
                ✦ Generate email
              </button>
            </>
          )}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", padding: "8px 0" }}>
              <span className="spinner" /> Drafting professional inquiry…
            </div>
          )}

          {error && <div className="error">{error}</div>}

          {draft && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span className={urgencyClass(draft.urgency_level)}>
                  {draft.urgency_level === "critical" ? "🔴" : draft.urgency_level === "high" ? "🟠" : "🟡"}
                  &nbsp;{draft.urgency_level} priority
                </span>
              </div>
              <div className="field-row">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 7 }}>Subject</div>
                <div className="email-subject-box">{draft.email_subject}</div>
              </div>
              <div className="field-row">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 7 }}>Body</div>
                <div className="email-body-box">{draft.email_body}</div>
              </div>
            </>
          )}
        </div>

        <div className="modal-foot">
          {draft && (
            <button className="btn btn-primary" onClick={copy}>
              {copied ? "✓ Copied" : "Copy email"}
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function SupplierAccordion({ supplier, index, onDraft }: {
  supplier: SupplierRisk;
  index: number;
  onDraft: (s: SupplierRisk) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`supplier-row ${open ? "expanded" : ""}`}>
      <div className="supplier-row-head" onClick={() => setOpen(!open)}>
        <div className={dotClass(supplier.risk_level)} />
        <div className="row-meta">
          <div className="row-id">
            SUP-{String(index + 1).padStart(3, "0")} · Tier {supplier.tier} · {supplier.location}
          </div>
          <div className="row-name">{supplier.name}</div>
        </div>
        <div className="row-right">
          <span className={badgeClass(supplier.risk_level)}>{supplier.risk_level}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor(supplier.risk_score), minWidth: 30, textAlign: "right" }}>
            {supplier.risk_score}
          </span>
          <span className={`chevron ${open ? "open" : ""}`}>▼</span>
        </div>
      </div>

      {open && (
        <div className="supplier-detail">
          <div className="detail-main">
            <div className="detail-section">
              <div className="detail-section-label">Components Supplied</div>
              <div className="detail-section-value">{supplier.components_supplied}</div>
            </div>
            <div className="detail-section">
              <div className="detail-section-label">Disruption Signals</div>
              <ul className="risk-factor-list">
                {supplier.risk_factors.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            <div className="detail-section">
              <div className="detail-section-label">Recommended Action</div>
              <div className="detail-section-value">{supplier.recommended_action}</div>
            </div>
          </div>

          <div className="detail-side">
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 4 }}>
              Disruption Score
            </div>
            <div className="score-big" style={{ color: scoreColor(supplier.risk_score) }}>
              {supplier.risk_score}<span style={{ fontSize: 16, color: "var(--muted)", fontWeight: 400 }}>/100</span>
            </div>
            <div className="score-bar-wrap">
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${supplier.risk_score}%`, background: scoreColor(supplier.risk_score) }} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Data Confidence</div>
            <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 16, textTransform: "capitalize" }}>{supplier.data_confidence}</div>

            {supplier.risk_score >= 60 ? (
              <button className="draft-btn" onClick={() => onDraft(supplier)}>
                ✉ Draft inquiry email
              </button>
            ) : (
              <div style={{
                textAlign: "center", padding: "10px 14px", marginTop: 12,
                background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)",
                borderRadius: 9, fontSize: 12, fontWeight: 700, color: "var(--normal)"
              }}>
                ✓ Normal monitoring
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [suppliersInput, setSuppliersInput]     = useState("");
  const [scanFocus, setScanFocus]               = useState("");
  const [scanning, setScanning]                 = useState(false);
  const [result, setResult]                     = useState<ScanResult | null>(null);
  const [error, setError]                       = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRisk | null>(null);
  const [activeTab, setActiveTab]               = useState<"csv" | "json">("csv");

  async function onScan() {
    if (!suppliersInput.trim()) return;
    setScanning(true);
    setError("");
    setResult(null);
    const res = await runSupplyChainScan(suppliersInput, scanFocus);
    setScanning(false);
    if (res.success) setResult(res.data);
    else setError(res.error);
  }

  function loadSample() {
    setActiveTab("csv");
    setSuppliersInput(SAMPLE_CSV);
    setResult(null);
    setError("");
  }

  const sorted = result?.risk_matrix.slice().sort((a, b) => b.risk_score - a.risk_score) ?? [];
  const counts = result ? {
    critical: sorted.filter(s => s.risk_level === "Critical").length,
    high:     sorted.filter(s => s.risk_level === "High").length,
    elevated: sorted.filter(s => s.risk_level === "Elevated").length,
    normal:   sorted.filter(s => s.risk_level === "Normal").length,
  } : null;

  return (
    <>
      {/* Nav */}
      <nav className="nav">
        <a className="nav-brand" href="/">
          <div className="nav-icon">🌐</div>
          Supply Chain Risk Oracle
        </a>
        <div className="nav-links">
          <a href="https://lamatic.ai/docs" target="_blank" rel="noopener noreferrer">Docs</a>
          <a href="https://github.com/Lamatic/AgentKit/tree/main/kits/supply-chain-risk-oracle" target="_blank" rel="noopener noreferrer" className="nav-badge">
            ↗ AgentKit
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero">
        <div className="hero-pill">✦ Lamatic AgentKit</div>
        <h1>Supply chain risks your team can act on.</h1>
        <p>Paste your supplier list and get live disruption scores backed by NewsAPI and OpenWeatherMap — with auto-drafted mitigation emails for at-risk nodes.</p>
        <div className="hero-checks">
          <span>Live news grounded</span>
          <span>Weather aware</span>
          <span>Email ready</span>
        </div>
      </div>

      {/* Input card */}
      <div style={{ padding: "0 24px" }}>
        <div className="input-card">
          <div className="card-header">
            <div>
              <div className="card-label">Start a scan</div>
              <div className="card-title">Give the Oracle your supplier data</div>
            </div>
            <span className="server-badge">⚡ Edge deployed</span>
          </div>

          <div className="tabs">
            <button className={`tab ${activeTab === "csv" ? "active" : ""}`} onClick={() => setActiveTab("csv")}>
              📋 CSV format
            </button>
            <button className={`tab ${activeTab === "json" ? "active" : ""}`} onClick={() => setActiveTab("json")}>
              {"{ }"} JSON format
            </button>
          </div>

          <div className="field-row">
            <label className="field-label">
              Supplier data
              <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 6 }}>
                {activeTab === "csv" ? "— name, location, lat, lng, components_supplied, tier" : "— array of supplier objects"}
              </span>
            </label>
            <textarea
              rows={6}
              placeholder={SAMPLE_CSV}
              value={suppliersInput}
              onChange={(e) => setSuppliersInput(e.target.value)}
            />
          </div>

          <div className="two-col">
            <div>
              <label className="field-label">Scan focus <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. semiconductor shortage, typhoon season"
                value={scanFocus}
                onChange={(e) => setScanFocus(e.target.value)}
              />
            </div>
          </div>

          <button className="run-btn" onClick={onScan} disabled={scanning || !suppliersInput.trim()}>
            {scanning ? <><span className="spinner" />&nbsp;Scanning global signals…</> : <>✦ Run risk scan →</>}
          </button>

          <button className="sample-link" onClick={loadSample} disabled={scanning}>
            Load sample supplier data
          </button>

          {error && <div className="error" role="alert">{error}</div>}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="results">
          <div className="audit-label">Scan complete</div>
          <div className="results-header">
            <div className="results-title">
              {result.risk_matrix.length} suppliers analysed
            </div>
            <span className="timestamp">{new Date(result.scan_timestamp).toLocaleString()}</span>
          </div>

          {result.summary && (
            <p className="results-meta">{result.summary}</p>
          )}

          {counts && (
            <div className="stats-row">
              <div className="stat-card stat-total">
                <div className="stat-top">Total</div>
                <div className="stat-num">{result.risk_matrix.length}</div>
              </div>
              <div className="stat-card stat-critical">
                <div className="stat-top">Critical</div>
                <div className="stat-num">{counts.critical}</div>
              </div>
              <div className="stat-card stat-high">
                <div className="stat-top">High</div>
                <div className="stat-num">{counts.high}</div>
              </div>
              <div className="stat-card stat-elevated">
                <div className="stat-top">Elevated</div>
                <div className="stat-num">{counts.elevated}</div>
              </div>
              <div className="stat-card stat-normal">
                <div className="stat-top">Normal</div>
                <div className="stat-num">{counts.normal}</div>
              </div>
            </div>
          )}

          <div className="findings-header">
            <div className="findings-title">
              Supplier findings
              <span className="findings-count">{sorted.length}</span>
            </div>
          </div>

          <div className="supplier-list">
            {sorted.map((s, i) => (
              <SupplierAccordion
                key={s.id ?? i}
                supplier={s}
                index={i}
                onDraft={setSelectedSupplier}
              />
            ))}
          </div>

          {result.high_risk_suppliers.length > 0 && (
            <div className="footer-note">
              ⚠
              <span>
                <strong>{result.high_risk_suppliers.length}</strong> supplier{result.high_risk_suppliers.length > 1 ? "s" : ""} flagged for immediate outreach (score ≥ 60).
                Expand a row and click <strong>Draft inquiry email</strong>.
              </span>
            </div>
          )}
        </div>
      )}

      {selectedSupplier && (
        <EmailModal supplier={selectedSupplier} onClose={() => setSelectedSupplier(null)} />
      )}
    </>
  );
}
