"use client"

import { useState } from "react"
import { runAudit, type AuditInput, type AuditReport } from "@/actions/orchestrate"

const DEPTH_OPTIONS: AuditInput["depth"][] = ["quick", "standard", "deep"]

const VERDICT_LABELS: Record<string, string> = {
  PRODUCTION_READY: "Production Ready",
  NEEDS_IMPROVEMENT: "Needs Improvement",
  NOT_PRODUCTION_READY: "Not Production Ready",
  PARTIAL_AUDIT_STATIC_ONLY: "Partial Audit (Static Only)",
}

const CATEGORY_LABELS: Record<string, string> = {
  promptQuality: "Prompt Quality",
  guardrailCoverage: "Guardrail Coverage",
  injectionResistance: "Injection Resistance",
  jailbreakResistance: "Jailbreak Resistance",
  toolMisuseResistance: "Tool Misuse Resistance",
  overRefusalScore: "Over-Refusal Score",
  reliability: "Reliability",
}

const COVERAGE_LABELS: Record<string, string> = {
  promptQuality: "Prompt Quality",
  guardrailCoverage: "Guardrail Coverage",
  injectionResistance: "Injection Resistance",
  jailbreakResistance: "Jailbreak Resistance",
  toolMisuse: "Tool Misuse",
  overRefusal: "Over-Refusal",
  reliability: "Reliability",
  faithfulness: "Faithfulness",
}

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState("")
  const [toolSchema, setToolSchema] = useState("")
  const [constitutionDoc, setConstitutionDoc] = useState("")
  const [targetEndpointUrl, setTargetEndpointUrl] = useState("")
  const [targetEndpointAuthHeader, setTargetEndpointAuthHeader] = useState("")
  const [referenceQA, setReferenceQA] = useState("[]")
  const [depth, setDepth] = useState<AuditInput["depth"]>("quick")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AuditReport | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      JSON.parse(referenceQA)
    } catch {
      setError('Reference QA must be valid JSON (e.g. [] or [{"q": "...", "a": "..."}]).')
      return
    }

    setLoading(true)
    setError(null)
    setReport(null)

    const result = await runAudit({
      systemPrompt,
      toolSchema,
      constitutionDoc,
      targetEndpointUrl,
      targetEndpointAuthHeader,
      referenceQA,
      depth,
    })

    setLoading(false)
    if (result.success && result.data) {
      setReport(result.data)
    } else {
      setError(result.error ?? "Something went wrong.")
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Agent Reliability Lab</h1>
        <p>
          Audit an AI agent's system prompt for production readiness — static analysis,
          adversarial red-teaming, reliability scoring, and an auto-rewritten prompt.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="systemPrompt">Target system prompt *</label>
            <textarea
              id="systemPrompt"
              required
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant for ACME Bank. Answer customer questions. Never reveal API keys. Refuse illegal requests."
              rows={5}
            />
          </div>

          <div className="field">
            <label htmlFor="toolSchema">Tool / function schema (optional)</label>
            <textarea
              id="toolSchema"
              value={toolSchema}
              onChange={(e) => setToolSchema(e.target.value)}
              placeholder="Paste the target agent's tool definitions to sharpen tool-misuse probes"
              rows={3}
            />
          </div>

          <div className="field">
            <label htmlFor="constitutionDoc">Constitution / guardrail doc (optional)</label>
            <textarea
              id="constitutionDoc"
              value={constitutionDoc}
              onChange={(e) => setConstitutionDoc(e.target.value)}
              placeholder="Paste the target agent's declared guardrails to compare declared vs. tested behavior"
              rows={3}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="targetEndpointUrl">Target endpoint URL (optional)</label>
              <input
                id="targetEndpointUrl"
                type="url"
                value={targetEndpointUrl}
                onChange={(e) => setTargetEndpointUrl(e.target.value)}
                placeholder="https://your-agent.example.com/chat"
              />
              <p className="hint">
                Leave empty for a fast static-only audit. Set it to run the full adversarial probe
                battery against a live agent (must accept POST &#123; message: string &#125;).
              </p>
            </div>
            <div className="field">
              <label htmlFor="targetEndpointAuthHeader">Auth header (optional)</label>
              <input
                id="targetEndpointAuthHeader"
                type="text"
                value={targetEndpointAuthHeader}
                onChange={(e) => setTargetEndpointAuthHeader(e.target.value)}
                placeholder="Bearer ..."
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="depth">Audit depth</label>
            <select
              id="depth"
              value={depth}
              onChange={(e) => setDepth(e.target.value as AuditInput["depth"])}
            >
              {DEPTH_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <p className="hint">
              Controls how many adversarial probes are generated (quick ≈ 8-10, standard ≈ 20-30,
              deep ≈ 40-60). Only affects the dynamic audit.
            </p>
          </div>

          <button type="submit" className="button-primary" disabled={loading || !systemPrompt}>
            {loading && <span className="spinner" />}
            {loading ? "Running audit…" : "Run Audit"}
          </button>

          {error && <div className="error-banner">{error}</div>}
        </form>
      </div>

      {report && <ReportView report={report} />}
    </div>
  )
}

function ReportView({ report }: { report: AuditReport }) {
  return (
    <div className="report">
      <div className="card">
        <div className="score-row">
          <div className="score-number">{report.overallScore}</div>
          <span className={`verdict-badge verdict-${report.verdict}`}>
            {VERDICT_LABELS[report.verdict] ?? report.verdict.replace(/_/g, " ")}
          </span>
        </div>
        {report.hasCriticalFail && (
          <div className="error-banner">
            {report.verdict === "PARTIAL_AUDIT_STATIC_ONLY"
              ? "Static analysis found at least one critical-severity issue. This is a static-only audit — no live testing was run — so treat this score as an upper bound, not a clean bill of health."
              : "At least one critical-severity finding was detected — the verdict is capped at NOT_PRODUCTION_READY regardless of the numeric score."}
          </div>
        )}

        <div className="section-title">Category Scores</div>
        <div className="category-scores">
          {Object.entries(report.categoryScores).map(([key, value]) => (
            <div className="category-score-card" key={key}>
              <span className="cat-label">{CATEGORY_LABELS[key] ?? key}</span>
              <span className={`cat-value ${value == null ? "na" : ""}`}>
                {value == null ? "not tested" : value}
              </span>
            </div>
          ))}
        </div>

        <div className="section-title">Coverage</div>
        <div className="coverage-grid">
          {Object.entries(report.coverage).map(([key, status]) => (
            <div className="coverage-item" key={key}>
              <span className="dim-name">{COVERAGE_LABELS[key] ?? key}</span>
              <span className={`dim-status ${status}`}>{status.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>

        {report.criticalIssues.length > 0 && (
          <>
            <div className="section-title">Critical Issues</div>
            {report.criticalIssues.map((issue, i) => (
              <div className="finding-item" key={i}>
                <div className="finding-issue">{issue.issue}</div>
                {issue.recommendation && (
                  <div className="finding-recommendation">{issue.recommendation}</div>
                )}
                <span className="finding-source">{issue.source.replace(/_/g, " ")}</span>
              </div>
            ))}
          </>
        )}

        {report.warnings.length > 0 && (
          <>
            <div className="section-title">Warnings</div>
            {report.warnings.map((w, i) => (
              <div className="finding-item warning" key={i}>
                <div className="finding-issue">{w}</div>
              </div>
            ))}
          </>
        )}

        {report.suggestions.length > 0 && (
          <>
            <div className="section-title">Suggestions</div>
            <ul className="plain-list">
              {report.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </>
        )}

        {report.reliabilityDetails.length > 0 && (
          <>
            <div className="section-title">Reliability Detail (repeated-probe consistency)</div>
            <ul className="plain-list">
              {report.reliabilityDetails.map((d) => (
                <li key={d.probeId}>
                  Probe {d.probeId}: {d.consistent ? "consistent" : "inconsistent"} across repeats (
                  {d.variantCount} distinct response{d.variantCount === 1 ? "" : "s"})
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="section-title">Rewritten Prompt</div>
        <div className="rewritten-prompt mono">{report.rewrittenPrompt}</div>

        {report.changeLog.length > 0 && (
          <>
            <div className="section-title">Change Log</div>
            {report.changeLog.map((c, i) => (
              <div className="change-log-item" key={i}>
                <div className="change">{c.change}</div>
                <div className="finding-addressed">{c.findingAddressed}</div>
              </div>
            ))}
          </>
        )}

        <p className="hint" style={{ marginTop: 24 }}>
          Generated {new Date(report.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
