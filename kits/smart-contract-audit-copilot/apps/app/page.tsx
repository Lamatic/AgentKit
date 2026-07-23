"use client";

import { type FormEvent, useState } from "react";
import { runSmartContractAudit } from "@/actions/orchestrate";
import type { AuditFinding, AuditMode, AuditReport, Severity } from "@/lib/types";

const sampleContract = `pragma solidity ^0.8.20;

contract Vault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        balances[msg.sender] = 0;
    }
}`;

const auditModes: Array<{ value: AuditMode; label: string; description: string }> = [
  { value: "comprehensive", label: "Comprehensive", description: "Security, gas, and best practices" },
  { value: "security", label: "Security", description: "Exploitability and fund-loss risks" },
  { value: "gas", label: "Gas", description: "Optimization opportunities" },
  { value: "best-practices", label: "Best practices", description: "Maintainability and correctness hygiene" },
];

function severityRank(severity: Severity): number {
  return {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1,
  }[severity];
}

function severityLabel(severity: Severity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function countFindings(report: AuditReport): number {
  return report.securityFindings.length + report.gasFindings.length + report.bestPracticeFindings.length;
}

function FindingList({ title, findings, empty }: { title: string; findings: AuditFinding[]; empty: string }) {
  const sorted = [...findings].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  return (
    <section className="result-card">
      <div className="result-card-head">
        <h3>{title}</h3>
        <span>{findings.length}</span>
      </div>
      {sorted.length ? (
        <div className="finding-stack">
          {sorted.map((finding, index) => (
            <article className="finding" key={`${title}-${finding.title}-${index}`}>
              <div className="finding-topline">
                <strong>{finding.title}</strong>
                <span className={`badge severity-${finding.severity}`}>{severityLabel(finding.severity)}</span>
              </div>
              <div className="finding-meta">
                <span>Confidence: {finding.confidence}</span>
                <span>
                  Lines: {finding.lineNumbers.length ? finding.lineNumbers.join(", ") : "not pinned"}
                </span>
              </div>
              <p>{finding.evidence}</p>
              <dl>
                <dt>Impact</dt>
                <dd>{finding.impact}</dd>
                <dt>Recommendation</dt>
                <dd>{finding.recommendation}</dd>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">{empty}</p>
      )}
    </section>
  );
}

export default function Home() {
  const [contractName, setContractName] = useState("Vault");
  const [auditMode, setAuditMode] = useState<AuditMode>("comprehensive");
  const [focusAreas, setFocusAreas] = useState("reentrancy, access control, gas");
  const [contractCode, setContractCode] = useState(sampleContract);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const result = await runSmartContractAudit({
        contractCode,
        contractName,
        auditMode,
        focusAreas,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "The audit flow did not return a report.");
      }

      setReport(result.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown audit error.");
    } finally {
      setLoading(false);
    }
  }

  const totalFindings = report ? countFindings(report) : 0;

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Lamatic AgentKit</span>
          <h1>Smart Contract Audit Copilot</h1>
          <p>
            Paste Solidity code and run a Lamatic-powered first-pass audit for security risks, gas issues,
            best-practice gaps, and prioritized remediation steps.
          </p>
        </div>
        <div className="hero-card" aria-label="Audit score preview">
          <span>Mode</span>
          <strong>{auditMode}</strong>
          <small>Structured JSON report for developer triage</small>
        </div>
      </section>

      <section className="workspace">
        <form className="audit-panel" onSubmit={handleSubmit}>
          <div className="panel-head">
            <div>
              <span className="section-label">Input</span>
              <h2>Contract under review</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => setContractCode(sampleContract)}>
              Load sample
            </button>
          </div>

          <label className="field">
            <span>Contract name</span>
            <input value={contractName} onChange={(event) => setContractName(event.target.value)} placeholder="Vault" />
          </label>

          <div className="mode-grid">
            {auditModes.map((mode) => (
              <label className={auditMode === mode.value ? "mode-card active" : "mode-card"} key={mode.value}>
                <input
                  checked={auditMode === mode.value}
                  name="auditMode"
                  onChange={() => setAuditMode(mode.value)}
                  type="radio"
                  value={mode.value}
                />
                <strong>{mode.label}</strong>
                <small>{mode.description}</small>
              </label>
            ))}
          </div>

          <label className="field">
            <span>Focus areas</span>
            <input
              value={focusAreas}
              onChange={(event) => setFocusAreas(event.target.value)}
              placeholder="reentrancy, oracle assumptions, upgradeability"
            />
          </label>

          <label className="field code-field">
            <span>Solidity source</span>
            <textarea value={contractCode} onChange={(event) => setContractCode(event.target.value)} spellCheck={false} />
          </label>

          <button className="primary-button" disabled={loading || contractCode.trim().length < 40} type="submit">
            {loading ? "Auditing contract..." : "Run audit"}
          </button>
        </form>

        <section className="report-panel">
          <div className="panel-head">
            <div>
              <span className="section-label">Output</span>
              <h2>Audit report</h2>
            </div>
            {report ? <span className={`badge severity-${report.overallRisk}`}>{severityLabel(report.overallRisk)} risk</span> : null}
          </div>

          {error ? (
            <div className="error-box" role="alert">
              <strong>Audit failed</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {!report && !error ? (
            <div className="placeholder">
              <span>Awaiting audit</span>
              <p>Run the Lamatic flow to see categorized findings, severity, confidence, and fixes.</p>
            </div>
          ) : null}

          {report ? (
            <div className="report-stack">
              <div className="summary-card">
                <div className="summary-stats">
                  <span>{totalFindings} findings</span>
                  <span>{report.confidence} confidence</span>
                </div>
                <p>{report.summary}</p>
              </div>

              <FindingList
                title="Security findings"
                findings={report.securityFindings}
                empty="No security findings were returned for this run."
              />
              <FindingList title="Gas findings" findings={report.gasFindings} empty="No gas findings were returned for this run." />
              <FindingList
                title="Best-practice findings"
                findings={report.bestPracticeFindings}
                empty="No best-practice findings were returned for this run."
              />

              <section className="result-card">
                <div className="result-card-head">
                  <h3>Remediation plan</h3>
                  <span>{report.remediations.length}</span>
                </div>
                {report.remediations.length ? (
                  <ol className="remediation-list">
                    {report.remediations.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="empty-state">The flow did not return prioritized remediations.</p>
                )}
              </section>

              <p className="disclaimer">{report.disclaimer}</p>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
