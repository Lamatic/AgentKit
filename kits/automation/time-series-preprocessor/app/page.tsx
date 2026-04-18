"use client";

import { useState } from "react";
import { preprocessTimeSeries } from "@/actions/orchestrate";

const EXAMPLE_INPUT = `{
  "dataset_name": "sensor_readings",
  "frequency": "1min",
  "columns": [
    {"name": "timestamp", "type": "datetime"},
    {"name": "temperature", "type": "float", "missing_pct": 5},
    {"name": "pressure", "type": "float", "missing_pct": 2},
    {"name": "status", "type": "categorical", "missing_pct": 0}
  ],
  "rows": 50000,
  "target_column": "temperature"
}`;

const FEATURES = [
  { title: "Missing value imputation", desc: "Forward-fill, mean, and median strategies selected based on column type" },
  { title: "Feature scaling", desc: "MinMaxScaler or StandardScaler applied appropriately" },
  { title: "Datetime parsing and index management", desc: "Automatic timestamp detection and alignment" },
  { title: "Categorical encoding", desc: "Label or one-hot encoding based on cardinality" },
  { title: "Standardized implementation", desc: "Clean, readable pandas + scikit-learn code ready to run" },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit() {
    if (!input.trim()) { setError("Please enter a dataset summary."); return; }
    setLoading(true); setError(""); setOutput("");
    const result = await preprocessTimeSeries(input);
    if (result.success) {
      setOutput(result.result);
      setTimeout(() => {
        document.getElementById("output")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      setError(result.result);
    }
    setLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f5f5f5",
      color: "#111",
      fontFamily: "'Inter', sans-serif",
      backgroundImage: "linear-gradient(#e0e0e0 1px, transparent 1px), linear-gradient(90deg, #e0e0e0 1px, transparent 1px)",
      backgroundSize: "60px 60px"
    }}>

      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", background: "#e63946", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: "14px" }}>L</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: "1rem", color: "#111" }}>Lamatic.ai</span>
          <span style={{ color: "#ccc", margin: "0 4px" }}>/</span>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#444" }}>Time-Series Preprocessor</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a href="https://github.com/baggasiddhant/AgentKit" target="_blank" rel="noreferrer"
            style={{ fontSize: "0.8rem", color: "#444", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
          <a href="https://lamatic.ai" target="_blank" rel="noreferrer"
            style={{ fontSize: "0.8rem", color: "#fff", background: "#e63946", textDecoration: "none", borderRadius: "6px", padding: "7px 16px", fontWeight: 600 }}>
            Lamatic.ai →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "rgba(255,255,255,0.9)", borderBottom: "1px solid #e5e5e5", padding: "5rem 2rem 4rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "99px", padding: "5px 14px", fontSize: "0.75rem", color: "#e63946", marginBottom: "1.5rem", fontWeight: 600 }}>
          AgentKit — Automation Kit
        </div>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.2rem", color: "#111", letterSpacing: "-0.03em" }}>
          Turn Dataset Schemas into<br />
          <span style={{ color: "#e63946" }}>Python Pipelines</span> Instantly
        </h1>
        <p style={{ color: "#666", fontSize: "1.05rem", maxWidth: "520px", margin: "0 auto 2rem", lineHeight: 1.75 }}>
          Paste a JSON summary of your time-series dataset and receive a production-ready preprocessing script using <strong>pandas</strong> and <strong>scikit-learn</strong>.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
          {["Saves Hours of Boilerplate", "Preprocessing Pipelines", "Ready-to-Run Python Scripts"].map(tag => (
            <span key={tag} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "99px", padding: "6px 16px", fontSize: "0.8rem", color: "#444", fontWeight: 500 }}>{tag}</span>
          ))}
        </div>
        <a href="#try-it"
          style={{ display: "inline-block", background: "#e63946", color: "#fff", textDecoration: "none", borderRadius: "10px", padding: "0.85rem 2.5rem", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.01em" }}>
          Try It Now ↓
        </a>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        {/* What It Does */}
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "16px", padding: "2rem", marginBottom: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
            What It Does
          </h2>
          <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
            By providing a JSON summary of your dataset, the agent generates a complete Python script that handles:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {FEATURES.map(item => (
              <div key={item.title} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "0.8rem 1rem", background: "#f9f9f9", borderRadius: "10px", border: "1px solid #f0f0f0" }}>
                <span style={{ fontSize: "1.1rem", marginTop: "1px" }}>{item.icon}</span>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111" }}>{item.title}</span>
                  <span style={{ color: "#777", fontSize: "0.85rem" }}> — {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Card */}
        <div id="try-it" style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: "1.5rem", scrollMarginTop: "80px" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e63946" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111" }}>Dataset Summary</span>
              <span style={{ fontSize: "0.72rem", background: "#f3f4f6", color: "#666", padding: "2px 8px", borderRadius: "4px" }}>JSON</span>
            </div>
            <button onClick={() => setInput(EXAMPLE_INPUT)}
              style={{ fontSize: "0.78rem", color: "#e63946", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}>
              Load Example →
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            placeholder={'{\n  "dataset_name": "your_dataset",\n  "columns": [...]\n}'}
            style={{ width: "100%", background: "#fafafa", border: "none", outline: "none", padding: "1.25rem 1.5rem", fontSize: "0.85rem", fontFamily: "'Fira Code', monospace", color: "#333", resize: "none", boxSizing: "border-box", lineHeight: 1.75 }}
          />
          {error && (
            <div style={{ margin: "0 1.5rem 1rem", padding: "0.75rem 1rem", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "8px", color: "#e63946", fontSize: "0.85rem" }}>
               {error}
            </div>
          )}
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #f0f0f0" }}>
            <button onClick={handleSubmit} disabled={loading}
              style={{ width: "100%", background: loading ? "#f87171" : "#e63946", color: "#fff", border: "none", borderRadius: "10px", padding: "0.9rem", fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
              {loading ? "⏳ Generating Pipeline..." : " Generate Python Pipeline"}
            </button>
          </div>
        </div>

        {/* Output Card */}
        {output && (
          <div id="output" style={{ background: "#e63946", border: "1px solid #44475a", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", scrollMarginTop: "80px" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111" }}>Generated Python Script</span>
                <span style={{ fontSize: "0.72rem", background: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: "4px", border: "1px solid #bbf7d0" }}>Ready to Run</span>
              </div>
              <button onClick={handleCopy}
                style={{ fontSize: "0.78rem", color: copied ? "#16a34a" : "#000000", background: "transparent", border: `1px solid ${copied ? "#bbf7d0" : "#000000"}`, borderRadius: "6px", padding: "4px 12px", cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}>
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <pre style={{ padding: "1.5rem", fontSize: "0.82rem", fontFamily: "'Fira Code', 'Courier New', monospace", color: "#f8f8f2", overflowX: "auto", whiteSpace: "pre-wrap", lineHeight: 1.85, margin: 0, background: "#1e1e2e" }}>
              {output.split('\n').map((line, i) => {
                let color = "#f8f8f2";
                if (line.trim().startsWith('#')) color = "#6272a4";
                else if (line.includes('import ') || line.includes('from ')) color = "#ff79c6";
                else if (line.includes('def ') || line.includes('class ')) color = "#50fa7b";
                else if (line.includes('=') && !line.includes('==')) color = "#f8f8f2";
                else if (line.trim().startsWith('df') || line.trim().startsWith('scaler') || line.trim().startsWith('encoder')) color = "#8be9fd";
                return (
                  <span key={i} style={{ display: "block", color }}>
                    <span style={{ color: "#44475a", userSelect: "none", marginRight: "1.5rem", fontSize: "0.75rem" }}>
                      {String(i + 1).padStart(3, ' ')}
                    </span>
                    {line}
                  </span>
                );
              })}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid #e5e5e5" }}>
          <p style={{ color: "#aaa", fontSize: "0.8rem", marginBottom: "1rem" }}>
            Built by <strong style={{ color: "#111" }}>Siddhant Bagga</strong> · Lamatic AgentKit Challenge
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
            <a target="_blank" rel="noreferrer" style={{ color: "#e63946", fontSize: "0.8rem", textDecoration: "none", fontWeight: 600 }}>
              To Contact
            </a>
            <a href="https://github.com/baggasiddhant" target="_blank" rel="noreferrer" style={{ color: "#666", fontSize: "0.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
            <a href="https://linkedin.com/in/baggasiddhant" target="_blank" rel="noreferrer" style={{ color: "#666", fontSize: "0.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#0077b5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}