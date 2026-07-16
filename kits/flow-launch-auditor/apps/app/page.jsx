"use client";

import { useEffect, useRef, useState } from "react";
import {
  clientTimeoutMs,
  maxInputCharacters,
  requestAudit,
  sourceLabel,
  validateAuditInputs
} from "../lib/ui-state.js";

const sampleBrief = `A customer support team wants a Lamatic Flow that classifies inbound billing emails before they reach the human support queue.

The Flow is triggered by a webhook from the helpdesk. It receives the ticket subject, body, customer account tier, and ticket ID. The model classifies the ticket as refund-request, invoice-question, payment-failed, or other, then returns a JSON object with category, confidence, reason, suggestedQueue, and billingStatus.

The Flow calls one internal billing-status API using BILLING_API_KEY to check whether the customer has an unpaid invoice. The API step is read-only. If the API call times out, the Flow should classify from the email text and set billingStatus to unknown.

The README lists LAMATIC_API_KEY, LAMATIC_FLOW_ID, BILLING_API_KEY, and the webhook URL. .env.example contains placeholders only. The team has five sample ticket fixtures with expected categories and one malformed input test. Logs include ticket ID, category, confidence, and whether the billing API succeeded. Logs must not include the full email body.

Known launch-support gap: the current README has setup steps but does not explain how to replay a failed webhook from Studio, even though the launch checklist requires operators to reproduce failed webhook payloads during first-week support.`;

const sampleExport = `flow: billing-email-classifier
trigger: helpdesk-webhook
steps:
  - model: classify ticket into one of four billing categories
  - tool: billing-status-api, read-only, timeout fallback sets billingStatus=unknown
response: category, confidence, reason, suggestedQueue, billingStatus`;

const decisionLabels = {
  ready: "Ready",
  "needs-review": "Needs Review",
  "not-ready": "Not Ready",
  "not-enough-context": "Not Enough Context"
};

const severityRank = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};
export default function Home() {
  const [flowBrief, setFlowBrief] = useState("");
  const [optionalFlowExport, setOptionalFlowExport] = useState("");
  const [audit, setAudit] = useState(null);
  const [source, setSource] = useState("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const activeControllerRef = useRef(null);
  const mountedRef = useRef(false);
  const reportRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!audit || window.innerWidth > 900) {
      return;
    }
    reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [audit]);

  const sortedFindings = audit?.findings
    ? [...audit.findings].sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
    : [];

  async function runAudit() {
    const inputError = validateAuditInputs(flowBrief, optionalFlowExport);
    if (inputError) {
      setAudit(null);
      setSource("idle");
      setError(inputError);
      return;
    }
    setLoading(true);
    setError("");
    setAudit(null);
    setSource("idle");
    const controller = new AbortController();
    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), clientTimeoutMs);
    const canUpdate = () => mountedRef.current && activeControllerRef.current === controller;

    try {
      const body = await requestAudit(flowBrief, optionalFlowExport, { signal: controller.signal });
      if (!canUpdate()) {
        return;
      }
      setAudit(body.audit);
      setSource(body.source);
    } catch (requestError) {
      if (!canUpdate()) {
        return;
      }
      const message =
        requestError?.name === "AbortError"
          ? "The audit timed out. Check the Flow connection and try again."
          : requestError.message || "The audit could not complete. Check the flow brief and try again.";
      setError(message);
    } finally {
      clearTimeout(timeout);
      if (canUpdate()) {
        activeControllerRef.current = null;
        setLoading(false);
      }
    }
  }

  function useSample() {
    if (loading) {
      return;
    }
    setFlowBrief(sampleBrief);
    setOptionalFlowExport(sampleExport);
    clearReport();
  }

  function updateFlowBrief(value) {
    setFlowBrief(value);
    clearReport();
  }

  function updateOptionalFlowExport(value) {
    setOptionalFlowExport(value);
    clearReport();
  }

  function clearReport() {
    setAudit(null);
    setError("");
    setSource("idle");
  }

  return (
    <main className="shell">
      <section className="workspace">
        <div className="inputPane">
          <div className="brandRow">
            <div>
              <p className="eyebrow">Lamatic AgentKit</p>
              <h1>Flow Launch Auditor</h1>
            </div>
          </div>

          <label className="fieldLabel" htmlFor="flowBrief">
            <span>Flow Brief</span>
            <span className="characterCount">{flowBrief.length} / {maxInputCharacters}</span>
          </label>
          <textarea
            id="flowBrief"
            className="briefInput"
            value={flowBrief}
            maxLength={maxInputCharacters}
            onChange={(event) => updateFlowBrief(event.target.value)}
            disabled={loading}
            placeholder="Paste the customer problem, trigger, model/tool steps, expected output, evals, failure paths, setup notes, and launch constraints. Use env var names only; do not paste secret values."
          />

          <label className="fieldLabel" htmlFor="flowExport">
            <span>Optional Flow Export</span>
            <span className="characterCount">{optionalFlowExport.length} / {maxInputCharacters}</span>
          </label>
          <textarea
            id="flowExport"
            className="exportInput"
            value={optionalFlowExport}
            maxLength={maxInputCharacters}
            onChange={(event) => updateOptionalFlowExport(event.target.value)}
            disabled={loading}
            placeholder="Paste sanitized Lamatic Flow/config text if available. Remove secret values before auditing."
          />

          <p className="inputHint">Use placeholder names such as BILLING_API_KEY; do not paste real keys, tokens, passwords, or private customer data.</p>

          <div className="actionRow">
            <button className="primaryButton" type="button" onClick={runAudit} disabled={loading}>
              {loading ? "Auditing..." : "Audit Launch Readiness"}
            </button>
            <button className="secondaryButton" type="button" onClick={useSample} disabled={loading}>
              Sample Input
            </button>
          </div>
          {loading && (
            <p className="srOnly" role="status">
              Audit in progress.
            </p>
          )}
        </div>

        <div className="reportPane" aria-busy={loading} aria-live="polite" ref={reportRef}>
          <div className="reportHeader">
            <div>
              <p className="eyebrow">Launch Readiness</p>
              <h2>{audit ? decisionLabels[audit.launchDecision] : "Ready for input"}</h2>
            </div>
            {audit && <DecisionPill decision={audit.launchDecision} />}
          </div>

          {error && <div className="errorState">{error}</div>}

          {!audit && !error && (
            <div className="emptyState">
              <p>Paste a Flow brief or load the sample to run the local readiness path.</p>
            </div>
          )}

          {audit && (
            <div className="reportStack">
              <div className="summaryGrid">
                <div>
                  <span className="metricLabel">Confidence</span>
                  <strong>{audit.confidence}</strong>
                </div>
                <div>
                  <span className="metricLabel">Source</span>
                  <strong>{sourceLabel(source)}</strong>
                </div>
              </div>

              <p className="summaryText">{audit.summary}</p>

              {audit.questionsToContinue.length > 0 && (
                <section className="reportSection">
                  <h3>Questions to continue</h3>
                  <ol className="stackList">
                    {audit.questionsToContinue.map((question, index) => (
                      <li key={`${index}-${question}`}>{question}</li>
                    ))}
                  </ol>
                </section>
              )}

              {audit.topRisks.length > 0 && (
                <section className="reportSection">
                  <h3>Top risks</h3>
                  <ol className="stackList riskList">
                    {audit.topRisks.map((risk, index) => (
                      <li key={`${index}-${risk}`}>{risk}</li>
                    ))}
                  </ol>
                </section>
              )}

              {audit.recommendedFixes.length > 0 && (
                <section className="reportSection">
                  <h3>Ranked fixes</h3>
                  <div className="fixGrid">
                    {audit.recommendedFixes.map((fix, index) => (
                      <article className="fixItem" key={`${index}-${fix.priority}-${fix.fix}`}>
                        <span className="priority">P{fix.priority}</span>
                        <div>
                          <h4>{fix.fix}</h4>
                          <p>{fix.estimatedEffort} effort / {fix.launchImpact} impact</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {sortedFindings.length > 0 && (
                <section className="reportSection">
                  <h3>Findings</h3>
                  <div className="findingList">
                    {sortedFindings.map((finding, index) => (
                      <article className="findingItem" key={`${index}-${finding.category}-${finding.title}`}>
                        <div className="findingTopline">
                          <span>{finding.category}</span>
                          <span className={`severity severity-${finding.severity}`}>{finding.severity}</span>
                        </div>
                        <h4>{finding.title}</h4>
                        <p>{finding.evidence}</p>
                        <p>{finding.whyItMatters}</p>
                        <p className="recommendedFixText">{finding.recommendedFix}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <details className="signalsBox">
                <summary>detectedSignals</summary>
                <pre>{JSON.stringify(audit.detectedSignals, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function DecisionPill({ decision }) {
  return <span className={`decisionPill decision-${decision}`}>{decisionLabels[decision]}</span>;
}
