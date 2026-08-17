"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TriageResult {
  category?: string;
  severity?: "low" | "moderate" | "high" | "emergency";
  urgency?: string;
  professionalNeeded?: boolean;
  professionalType?: string | null;
  safeNextSteps?: string[];
  doNotDo?: string[];
  reasoning?: string;
  disclaimer?: string;
  raw?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAMPLES = [
  "My ceiling has a brown water stain that's been slowly growing for a week",
  "Wall outlet sparked and I can smell something burning",
  "There's a strong smell of rotten eggs near the stove",
  "My AC unit is making a loud grinding noise and blowing warm air",
  "I noticed black mold spots in the bathroom corner behind the toilet",
  "My toilet keeps running and doesn't stop after flushing",
];

const SEVERITY_CONFIG = {
  emergency: {
    label: "🚨 Emergency",
    className: "urgency-emergency",
  },
  high: {
    label: "🔴 Urgent",
    className: "urgency-high",
  },
  moderate: {
    label: "🟡 Soon",
    className: "urgency-moderate",
  },
  low: {
    label: "🟢 Low",
    className: "urgency-low",
  },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [issueDescription, setIssueDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [homeType, setHomeType] = useState("");
  const [issueLocation, setIssueLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TriageResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issueDescription.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueDescription: issueDescription.trim(),
          imageUrl: imageUrl.trim() || undefined,
          homeType: homeType || undefined,
          issueLocation: issueLocation.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setResult(data.result);
        setTimeout(
          () =>
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          100
        );
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillExample(example: string) {
    setIssueDescription(example);
    setResult(null);
    setError(null);
  }

  const severityCfg = result?.severity
    ? SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.low
    : null;

  return (
    <div className="page">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <span className="header-icon">🏠</span>
          <span className="header-title">Home Maintenance Triage</span>
          <span className="header-badge">Powered by Lamatic AI</span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main">
        {/* Hero */}
        <section className="hero">
          <h1>Diagnose Any Home Issue Instantly</h1>
          <p>
            Describe what&apos;s wrong and our AI tells you if it&apos;s an
            emergency, who to call, and exactly what to do right now.
          </p>
        </section>

        {/* Example chips */}
        <div className="examples-section">
          <span className="examples-label">Try an example</span>
          <div className="examples-grid">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="example-chip"
                onClick={() => fillExample(ex)}
              >
                {ex.length > 48 ? ex.slice(0, 48) + "…" : ex}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="input-card">
          <form onSubmit={handleSubmit} id="triage-form">
            <div className="form-group">
              <label className="form-label" htmlFor="issueDescription">
                Describe the issue <span>(required)</span>
              </label>
              <textarea
                id="issueDescription"
                className="form-input"
                placeholder="e.g. My bathroom ceiling has a wet brown stain that keeps growing. Started about a week ago and now there's a slight dripping sound..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                required
                rows={5}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="imageUrl">
                Image URL <span>(optional — link to a photo of the issue)</span>
              </label>
              <input
                id="imageUrl"
                type="url"
                className="form-input"
                placeholder="https://example.com/my-issue-photo.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="homeType">
                  Home type <span>(optional)</span>
                </label>
                <select
                  id="homeType"
                  className="form-input"
                  value={homeType}
                  onChange={(e) => setHomeType(e.target.value)}
                  style={{ appearance: "auto" }}
                >
                  <option value="">Select…</option>
                  <option value="apartment">Apartment / Flat</option>
                  <option value="house">House</option>
                  <option value="condo">Condo / Townhouse</option>
                  <option value="rental">Rental Property</option>
                  <option value="office">Office / Commercial</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="issueLocation">
                  Location in home <span>(optional)</span>
                </label>
                <input
                  id="issueLocation"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Master bathroom, kitchen"
                  value={issueLocation}
                  onChange={(e) => setIssueLocation(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              id="triage-submit-btn"
              className="submit-btn"
              disabled={loading || !issueDescription.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Analyzing your issue…
                </>
              ) : (
                <>🔍 Analyze Issue</>
              )}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="error-box" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <section className="result-section" ref={resultRef} id="triage-result">
            {/* Result header */}
            <div className="result-header">
              <h2>Triage Report</h2>
              {severityCfg && (
                <span className={`urgency-badge ${severityCfg.className}`}>
                  {severityCfg.label}
                </span>
              )}
              {result.category && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >
                  {result.category}
                </span>
              )}
            </div>

            {/* Urgency text */}
            {result.urgency && (
              <p
                style={{
                  fontSize: "1.05rem",
                  color: "var(--text-secondary)",
                  marginBottom: "1.5rem",
                  lineHeight: 1.6,
                }}
              >
                {result.urgency}
              </p>
            )}

            {/* Info Grid */}
            <div className="info-grid">
              <div className="info-card">
                <div className="info-card-icon">🔧</div>
                <div className="info-card-label">DIY Feasibility</div>
                <div
                  className={`info-card-value ${
                    result.professionalNeeded ? "diy-no" : "diy-yes"
                  }`}
                >
                  {result.professionalNeeded
                    ? "❌ Needs Professional"
                    : "✅ DIY Possible"}
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-icon">👷</div>
                <div className="info-card-label">Professional Needed</div>
                <div className="info-card-value">
                  {result.professionalType
                    ? result.professionalType
                    : result.professionalNeeded
                    ? "Contact a professional"
                    : "Not required"}
                </div>
              </div>

              {result.severity && (
                <div className="info-card">
                  <div className="info-card-icon">📊</div>
                  <div className="info-card-label">Severity Level</div>
                  <div
                    className="info-card-value"
                    style={{ textTransform: "capitalize" }}
                  >
                    {result.severity}
                  </div>
                </div>
              )}

              {result.category && (
                <div className="info-card">
                  <div className="info-card-icon">🏷️</div>
                  <div className="info-card-label">Issue Category</div>
                  <div
                    className="info-card-value"
                    style={{ textTransform: "capitalize" }}
                  >
                    {result.category}
                  </div>
                </div>
              )}
            </div>

            {/* Safe Next Steps */}
            {result.safeNextSteps && result.safeNextSteps.length > 0 && (
              <div className="list-card">
                <div className="list-card-header">
                  <span className="list-card-icon">✅</span>
                  <span className="list-card-title">Immediate Action Steps</span>
                </div>
                <ul>
                  {result.safeNextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Do Not Do */}
            {result.doNotDo && result.doNotDo.length > 0 && (
              <div className="list-card danger">
                <div className="list-card-header">
                  <span className="list-card-icon">🚫</span>
                  <span className="list-card-title">Do NOT Do These</span>
                </div>
                <ul>
                  {result.doNotDo.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reasoning */}
            {result.reasoning && (
              <div className="reasoning-box">
                <div className="reasoning-label">AI Reasoning</div>
                <div className="reasoning-text">{result.reasoning}</div>
              </div>
            )}

            {/* Raw fallback */}
            {result.raw && (
              <div className="reasoning-box">
                <div className="reasoning-label">Raw Response</div>
                <div className="reasoning-text" style={{ whiteSpace: "pre-wrap" }}>
                  {result.raw}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            {result.disclaimer && (
              <div className="disclaimer-box">
                <span className="disclaimer-icon">ℹ️</span>
                <p className="disclaimer-text">{result.disclaimer}</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>
          Built with{" "}
          <a
            href="https://lamatic.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            Lamatic.ai
          </a>{" "}
          · Part of{" "}
          <a
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
          >
            AgentKit
          </a>{" "}
          · For informational use only, not a professional inspection
        </p>
      </footer>
    </div>
  );
}
