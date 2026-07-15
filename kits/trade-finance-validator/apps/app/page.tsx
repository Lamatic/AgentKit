"use client";

import { useState, useRef } from "react";
import { validateDocument, type ValidationReport } from "@/actions/orchestrate";
import { extractDocumentText } from "@/actions/extract-text";

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconShield() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconSpinner() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type UploadState = "idle" | "uploading" | "validating" | "done" | "error";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusColor(status: string) {
  if (status === "pass") return "var(--success)";
  if (status === "fail") return "var(--danger)";
  return "var(--warning)";
}
function getStatusBg(status: string) {
  if (status === "pass") return "var(--success-bg)";
  if (status === "fail") return "var(--danger-bg)";
  return "var(--warning-bg)";
}
function getStatusIcon(status: string) {
  if (status === "pass") return <IconCheck />;
  if (status === "fail") return <IconX />;
  return <IconWarning />;
}
function getOverallBadge(status: string) {
  if (status === "passed") return { label: "PASSED", color: "var(--success)", bg: "var(--success-bg)" };
  if (status === "failed") return { label: "FAILED", color: "var(--danger)", bg: "var(--danger-bg)" };
  return { label: "PASSED WITH WARNINGS", color: "var(--warning)", bg: "var(--warning-bg)" };
}

const SAMPLE_DOCS = [
  {
    label: "Letter of Credit",
    icon: "🏦",
    text: `LETTER OF CREDIT\nLC Reference: LC-2026-00123\nIssuing Bank: XYZ International Bank\nApplicant: ABC Trading LLC\nBeneficiary: Global Exports Ltd\nAmount: USD 500,000\nCurrency: USD\nIssue Date: 10 January 2026\nExpiry Date: 10 July 2027\nPayment Terms: At Sight\nSignature: [Authorized Signatory - John Smith]`,
    file: "sample_lc.txt",
  },
  {
    label: "Trade License",
    icon: "📋",
    text: `TRADE LICENSE\nLicense Number: TL-AE-2024-88412\nBusiness Name: Al Noor General Trading LLC\nOwner: Mohammed Al Rashidi\nBusiness Activity: General Trading\nIssuing Authority: Department of Economic Development, Dubai\nIssue Date: 15 March 2024\nExpiry Date: 14 March 2026\nStamp: [Official DED Stamp]`,
    file: "sample_trade_license.txt",
  },
  {
    label: "Commercial Invoice",
    icon: "🧾",
    text: `COMMERCIAL INVOICE\nInvoice Number: INV-2026-5521\nSeller: Sunrise Electronics Pvt Ltd\nBuyer: Gulf Tech Distributors LLC\nDate: 01 June 2026\nGoods: 500 units Industrial Grade Sensors Model XR-900\nUnit Price: USD 240\nTotal Amount: USD 120,000\nCurrency: USD\nPayment Terms: Net 30 days`,
    file: "sample_invoice.txt",
  },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [docText, setDocText] = useState<string>("");
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleValidate(text: string, name: string) {
    if (!text.trim()) return;
    setDocText(text);
    setFileName(name);
    setState("validating");
    setReport(null);
    setError("");

    const res = await validateDocument(text, name);
    if (res.success && res.data) {
      setReport(res.data);
      setState("done");
    } else {
      setError(res.error ?? "Validation failed.");
      setState("error");
    }
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setState("uploading");
    setFileName(file.name);

    const isPdf = file.type === "application/pdf";
    const isDocx =
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (isPdf || isDocx) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((acc, byte) => acc + String.fromCharCode(byte), "")
      );
      const res = await extractDocumentText(base64, file.type);
      if (!res.success || !res.text) {
        setError(res.error ?? "Failed to extract text from document.");
        setState("error");
        return;
      }
      handleValidate(res.text, file.name);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleValidate(text, file.name);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }

  function reset() {
    setState("idle");
    setReport(null);
    setError("");
    setFileName("");
    setDocText("");
  }

  const passCount = report?.validation_results.filter((r) => r.status === "pass").length ?? 0;
  const failCount = report?.validation_results.filter((r) => r.status === "fail").length ?? 0;
  const warnCount = report?.validation_results.filter((r) => r.status === "warning").length ?? 0;
  const badge = report ? getOverallBadge(report.overall_status) : null;

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 0 rgba(15,23,42,0.06)",
      }}>
        <span style={{
          color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "36px", height: "36px", borderRadius: "10px",
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          boxShadow: "0 3px 10px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}><IconShield /></span>
        <div>
          <h1 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.01em" }}>
            Trade Finance Validator
          </h1>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
            AI-powered compliance document review
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          {["LC", "Trade License", "Invoice"].map((t) => (
            <span key={t} style={{
              fontSize: "10px", padding: "5px 11px", borderRadius: "99px", fontWeight: 600,
              background: "var(--surface-2)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", letterSpacing: "0.02em",
            }}>{t}</span>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Upload Area */}
        {state === "idle" && (
          <div className="animate-fade-in">
            {/* Hero */}
            <div style={{ position: "relative", textAlign: "center", marginBottom: "48px", paddingTop: "8px" }}>
              <div className="hero-mesh" />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div className="icon-badge" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "72px", height: "72px", borderRadius: "20px",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  boxShadow: "0 12px 28px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.25)",
                  color: "#fff", marginBottom: "26px",
                }}>
                  <IconShield />
                </div>
                <h2 style={{
                  fontSize: "38px", fontWeight: 800, marginBottom: "14px", letterSpacing: "-0.03em",
                  color: "var(--text-primary)", lineHeight: 1.1,
                }}>
                  Trade Finance Document{" "}
                  <span style={{
                    background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>Validator</span>
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "520px", margin: "0 auto", lineHeight: 1.65 }}>
                  Upload a trade license, Letter of Credit, or commercial invoice.
                  Our AI extracts key fields and runs a compliance validation in seconds.
                </p>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className="dropzone"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border-light)"}`,
                borderRadius: "18px",
                padding: "56px 32px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver
                  ? "linear-gradient(180deg, rgba(29,78,216,0.05), rgba(29,78,216,0.02))"
                  : "var(--surface)",
                boxShadow: dragOver ? "0 0 0 6px rgba(29,78,216,0.06)" : "0 1px 2px rgba(15,23,42,0.04)",
                marginBottom: "32px",
              }}
            >
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "56px", height: "56px", borderRadius: "16px", marginBottom: "16px",
                background: dragOver ? "rgba(29,78,216,0.1)" : "var(--surface-2)",
                color: dragOver ? "var(--accent)" : "var(--text-muted)",
                transition: "background 0.2s ease, color 0.2s ease",
              }}>
                <IconFile />
              </div>
              <p style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "6px", fontSize: "16px" }}>
                Drop your document here
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>
                PDF, TXT, or Word (.docx) — or click to browse
              </p>
              <button className="btn-primary" style={{
                color: "#fff", border: "none",
                padding: "11px 24px", borderRadius: "10px", cursor: "pointer",
                fontSize: "14px", fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: "8px",
              }}>
                <IconUpload /> Browse File
              </button>
              <input ref={fileRef} type="file" accept=".txt,.pdf,.docx"
                style={{ display: "none" }} onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
            </div>

            {/* Paste Area */}
            <div style={{ marginBottom: "32px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "10px", fontWeight: 500 }}>
                Or paste document text:
              </p>
              <textarea
                placeholder="Paste your document content here..."
                rows={6}
                style={{
                  width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "12px", color: "var(--text-primary)", padding: "14px 16px",
                  fontSize: "13px", resize: "vertical", outline: "none",
                  fontFamily: "monospace", lineHeight: 1.6,
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                onChange={(e) => setDocText(e.target.value)}
              />
              <div style={{ textAlign: "right", marginTop: "12px" }}>
                <button
                  className={docText.trim() ? "btn-primary" : undefined}
                  onClick={() => handleValidate(docText, "pasted-document.txt")}
                  disabled={!docText.trim()}
                  style={{
                    background: docText.trim() ? undefined : "var(--surface-2)",
                    color: docText.trim() ? "#fff" : "var(--text-muted)",
                    border: docText.trim() ? "1px solid transparent" : "1px solid var(--border)",
                    padding: "11px 26px",
                    borderRadius: "10px", cursor: docText.trim() ? "pointer" : "not-allowed",
                    fontSize: "14px", fontWeight: 600,
                  }}
                >
                  Validate Document →
                </button>
              </div>
            </div>

            {/* Sample Docs */}
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "12px", fontWeight: 500 }}>
                Try a sample document:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {SAMPLE_DOCS.map((doc) => (
                  <button
                    key={doc.label}
                    className="sample-card"
                    onClick={() => handleValidate(doc.text, doc.file)}
                    style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: "14px", padding: "18px", cursor: "pointer",
                      textAlign: "left", color: "var(--text-primary)",
                      boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div style={{
                      position: "relative", zIndex: 1,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: "42px", height: "42px", borderRadius: "12px", fontSize: "20px",
                      background: "var(--surface-2)", marginBottom: "12px",
                    }}>{doc.icon}</div>
                    <p style={{ position: "relative", zIndex: 1, fontWeight: 700, fontSize: "13px" }}>{doc.label}</p>
                    <p style={{ position: "relative", zIndex: 1, color: "var(--text-muted)", fontSize: "11px", marginTop: "5px" }}>
                      Click to validate sample
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {(state === "uploading" || state === "validating") && (
          <div className="animate-fade-in" style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ color: "var(--accent)", marginBottom: "20px", display: "inline-block" }}>
              <IconSpinner />
            </div>
            <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "18px", marginBottom: "8px" }}>
              {state === "uploading" ? "Reading document..." : "Validating document..."}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              {fileName && `Processing: ${fileName}`}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
              {["Extracting fields", "Running compliance checks", "Generating report"].map((step, i) => (
                <span key={i} style={{
                  fontSize: "11px", padding: "4px 12px", borderRadius: "99px",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}>{step}</span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="animate-fade-in" style={{
            background: "var(--surface)", border: "1px solid var(--danger)",
            borderRadius: "16px", padding: "36px 24px", textAlign: "center",
            boxShadow: "0 16px 32px -16px rgba(185,28,28,0.15)",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "48px", height: "48px", borderRadius: "14px",
              background: "var(--danger-bg)", color: "var(--danger)", marginBottom: "14px",
            }}>
              <IconX />
            </div>
            <p style={{ color: "var(--danger)", fontWeight: 700, marginBottom: "8px", fontSize: "16px" }}>Validation Error</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>{error}</p>
            <button className="btn-ghost" onClick={reset} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text-primary)", padding: "9px 22px", borderRadius: "9px",
              cursor: "pointer", fontSize: "13px", fontWeight: 600,
            }}>← Try Again</button>
          </div>
        )}

        {/* Results */}
        {state === "done" && report && badge && (
          <div className="animate-fade-in">
            {/* Top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>
                  {fileName}
                </p>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {report.document_type}
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="status-badge" style={{
                  padding: "7px 18px", borderRadius: "99px", fontWeight: 700,
                  fontSize: "12px", letterSpacing: "0.05em",
                  background: badge.color, color: "#fff",
                  boxShadow: `0 4px 14px ${badge.color}40`,
                }}>
                  {badge.label}
                </span>
                <button className="btn-ghost" onClick={reset} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  color: "var(--text-secondary)", padding: "8px 16px", borderRadius: "8px",
                  cursor: "pointer", fontSize: "13px", fontWeight: 500,
                }}>← New Document</button>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
              {[
                { label: "Confidence", value: `${Math.round(report.confidence_score * 100)}%`, color: "var(--accent)" },
                { label: "Passed", value: passCount, color: "var(--success)" },
                { label: "Failed", value: failCount, color: "var(--danger)" },
                { label: "Warnings", value: warnCount, color: "var(--warning)" },
              ].map((stat) => (
                <div key={stat.label} className="card card-hover" style={{
                  borderRadius: "14px", padding: "20px", textAlign: "center", position: "relative",
                }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%", background: stat.color,
                    margin: "0 auto 10px",
                  }} />
                  <p style={{ fontSize: "28px", fontWeight: 800, color: stat.color, letterSpacing: "-0.02em" }}>{stat.value}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "5px", fontWeight: 500 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="card" style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "22px", marginBottom: "24px",
            }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Summary
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7 }}>
                {report.summary}
              </p>
            </div>

            {/* Two column: fields + validation */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Extracted Fields */}
              <div className="card" style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "12px", padding: "22px",
              }}>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Extracted Fields
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {Object.entries(report.extracted_fields).map(([key, value]) => (
                    <div key={key} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      paddingBottom: "10px", borderBottom: "1px solid var(--border)",
                    }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "capitalize", flexShrink: 0, marginRight: "12px" }}>
                        {key.replace(/_/g, " ")}
                      </span>
                      <span style={{
                        fontSize: "12px", color: value != null ? "var(--text-primary)" : "var(--danger)",
                        fontWeight: value != null ? 500 : 400, textAlign: "right",
                        fontStyle: value == null ? "italic" : "normal",
                      }}>
                        {value == null ? "— missing —" : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Results */}
              <div className="card" style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "12px", padding: "22px",
              }}>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Validation Checks
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {report.validation_results.map((r, i) => (
                    <div key={i} className="check-row" style={{
                      background: getStatusBg(r.status),
                      border: `1px solid ${getStatusColor(r.status)}30`,
                      borderLeft: `3px solid ${getStatusColor(r.status)}`,
                      borderRadius: "8px", padding: "10px 12px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: getStatusColor(r.status), flexShrink: 0 }}>
                          {getStatusIcon(r.status)}
                        </span>
                        <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>
                          {r.check}
                        </span>
                        <span style={{
                          marginLeft: "auto", fontSize: "10px", fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          color: getStatusColor(r.status),
                        }}>
                          {r.status}
                        </span>
                      </div>
                      {r.note && (
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", paddingLeft: "22px" }}>
                          {r.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
