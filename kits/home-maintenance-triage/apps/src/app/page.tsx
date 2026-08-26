"use client";

import { useState, useRef } from "react";

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
}

const EXAMPLES = [
  "My ceiling has a brown water stain that has been slowly growing for a week",
  "A wall outlet sparked when I plugged something in and I can smell burning",
  "There is a strong smell of rotten eggs near the stove",
  "My AC unit is making a loud grinding noise and blowing warm air",
  "I noticed black mold spots in the bathroom corner behind the toilet",
  "My toilet keeps running and does not stop after flushing",
];

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  emergency: { label: "Emergency", className: "urgency-emergency" },
  high:      { label: "Urgent",    className: "urgency-high" },
  moderate:  { label: "Soon",      className: "urgency-moderate" },
  low:       { label: "Low",       className: "urgency-low" },
};

export default function HomePage() {
  const [issueDescription, setIssueDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [homeType, setHomeType] = useState("");
  const [issueLocation, setIssueLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TriageResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setTimeout(() =>
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
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

  function handleModeSwitch(mode: "url" | "upload") {
    setImageMode(mode);
    setImageUrl("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setImageUrl(dataUri);
      setImagePreview(dataUri);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  const severityCfg = result?.severity ? SEVERITY_CONFIG[result.severity] : null;

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <span className="header-title">Home Maintenance Triage</span>
          <span className="header-badge">Powered by Lamatic</span>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1>What is going wrong at home?</h1>
          <p>
            Describe any household issue and get a structured assessment — how serious it is,
            whether you need a professional, and what to do right now.
          </p>
        </section>

        <div className="examples-section">
          <span className="examples-label">Try an example</span>
          <div className="examples-grid">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="example-chip"
                onClick={() => fillExample(ex)}
              >
                {ex.length > 52 ? ex.slice(0, 52) + "..." : ex}
              </button>
            ))}
          </div>
        </div>

        <div className="input-card">
          <form onSubmit={handleSubmit} id="triage-form">
            <div className="form-group">
              <label className="form-label" htmlFor="issueDescription">
                Describe the issue <span>(required)</span>
              </label>
              <textarea
                id="issueDescription"
                className="form-input"
                placeholder="For example: my bathroom ceiling has a wet brown stain that keeps growing. It started about a week ago and now there is a faint dripping sound when it rains..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                required
                rows={5}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Photo <span>(optional)</span>
              </label>
              <div className="image-mode-toggle">
                <button
                  type="button"
                  className={`mode-btn${imageMode === "url" ? " active" : ""}`}
                  onClick={() => handleModeSwitch("url")}
                >
                  Paste URL
                </button>
                <button
                  type="button"
                  className={`mode-btn${imageMode === "upload" ? " active" : ""}`}
                  onClick={() => handleModeSwitch("upload")}
                >
                  Upload from device
                </button>
              </div>

              {imageMode === "url" ? (
                <input
                  id="imageUrl"
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/photo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              ) : (
                <div className="upload-area">
                  <input
                    ref={fileInputRef}
                    id="imageFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                    className="file-input"
                    onChange={handleFileChange}
                  />
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Selected photo preview" className="preview-img" />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => {
                          setImageUrl("");
                          setImagePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                  <option value="">Select...</option>
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
                  placeholder="e.g. master bathroom, kitchen"
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
                  Analyzing...
                </>
              ) : (
                "Assess this issue"
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="error-box" role="alert">
            <span>{error}</span>
          </div>
        )}

        {result && (
          <section className="result-section" ref={resultRef} id="triage-result">
            <div className="result-header">
              <h2>Assessment</h2>
              {severityCfg && (
                <span className={`urgency-badge ${severityCfg.className}`}>
                  {severityCfg.label}
                </span>
              )}
              {result.category && (
                <span className="category-tag">
                  {result.category}
                </span>
              )}
            </div>

            {result.urgency && (
              <p className="urgency-text">{result.urgency}</p>
            )}

            <div className="info-grid">
              <div className="info-card">
                <div className="info-card-label">Professional needed</div>
                <div className={`info-card-value ${result.professionalNeeded ? "diy-no" : "diy-yes"}`}>
                  {result.professionalNeeded ? "Yes" : "No — DIY may be possible"}
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-label">Who to contact</div>
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
                  <div className="info-card-label">Severity</div>
                  <div className="info-card-value" style={{ textTransform: "capitalize" }}>
                    {result.severity}
                  </div>
                </div>
              )}

              {result.category && (
                <div className="info-card">
                  <div className="info-card-label">Issue type</div>
                  <div className="info-card-value" style={{ textTransform: "capitalize" }}>
                    {result.category}
                  </div>
                </div>
              )}
            </div>

            {result.safeNextSteps && result.safeNextSteps.length > 0 && (
              <div className="list-card">
                <div className="list-card-header">
                  <span className="list-card-title">What to do right now</span>
                </div>
                <ul>
                  {result.safeNextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.doNotDo && result.doNotDo.length > 0 && (
              <div className="list-card danger">
                <div className="list-card-header">
                  <span className="list-card-title">Do not do these</span>
                </div>
                <ul>
                  {result.doNotDo.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.reasoning && (
              <div className="reasoning-box">
                <div className="reasoning-label">Why this assessment</div>
                <div className="reasoning-text">{result.reasoning}</div>
              </div>
            )}

            {result.disclaimer && (
              <div className="disclaimer-box">
                <p className="disclaimer-text">{result.disclaimer}</p>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          Built with{" "}
          <a href="https://lamatic.ai" target="_blank" rel="noopener noreferrer">
            Lamatic.ai
          </a>{" "}
          as part of{" "}
          <a href="https://github.com/Lamatic/AgentKit" target="_blank" rel="noopener noreferrer">
            AgentKit
          </a>
          . For informational use only — not a substitute for a professional inspection.
        </p>
      </footer>
    </div>
  );
}
