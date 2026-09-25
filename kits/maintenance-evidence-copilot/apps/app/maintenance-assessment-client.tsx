"use client";

import { useState } from "react";
import { runMaintenanceAssessment } from "@/actions/orchestrate";
import type { Assessment } from "@/lib/assessment";
import { scenarios, type ScenarioId } from "@/lib/scenarios";

function sourceText(sourceIds: string[]): string {
  return sourceIds.length > 0 ? sourceIds.join(", ") : "No source ID returned";
}

function CmmsDraft({ assessment }: { assessment: Assessment }) {
  const observedConditions = [
    `Vibration status: ${assessment.observations.vibrationStatus}`,
    `Temperature status: ${assessment.observations.temperatureStatus}`
  ];

  return (
    <section className="cmms-draft" aria-labelledby="cmms-draft-title">
      <p className="eyebrow">Local formatting only</p>
      <h2 id="cmms-draft-title">CMMS-style inspection draft</h2>
      <dl className="draft-grid">
        <div><dt>Status</dt><dd>DRAFT</dd></div>
        <div><dt>Asset</dt><dd>{assessment.asset.name} ({assessment.asset.assetId})</dd></div>
        <div><dt>Event ID</dt><dd>{assessment.eventId}</dd></div>
        <div><dt>Inspection priority</dt><dd>{assessment.priority.code}</dd></div>
        <div><dt>Observed conditions</dt><dd>{observedConditions.join("; ")}</dd></div>
        <div><dt>Requested checks</dt><dd>{assessment.recommendedChecks.map((item) => item.action).join("; ") || "None returned"}</dd></div>
        <div><dt>Unresolved unknowns</dt><dd>{assessment.unknowns.map((item) => item.description).join("; ") || "None returned"}</dd></div>
        <div><dt>Source IDs</dt><dd>{assessment.sources.map((source) => source.id).join(", ") || "None returned"}</dd></div>
        <div><dt>Root cause</dt><dd>Not confirmed</dd></div>
      </dl>
    </section>
  );
}

function EvidenceList({ items, emptyMessage }: { items: { statement: string; sourceIds: string[] }[]; emptyMessage: string }) {
  if (items.length === 0) return <p className="empty-state">{emptyMessage}</p>;

  return (
    <ul className="evidence-list">
      {items.map((item, index) => (
        <li key={`${item.statement}-${index}`}>
          <p>{item.statement}</p>
          <small>Sources: {sourceText(item.sourceIds)}</small>
        </li>
      ))}
    </ul>
  );
}

export function MaintenanceAssessmentClient() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("A");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [approved, setApproved] = useState(false);

  const scenario = scenarios[scenarioId];

  async function handleRun() {
    setIsRunning(true);
    setError(null);
    setAssessment(null);
    setApproved(false);

    try {
      const result = await runMaintenanceAssessment(scenarioId);
      if (result.success) {
        setAssessment(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Unable to run the maintenance assessment. Try again.");
    } finally {
      setIsRunning(false);
    }
  }

  function handleScenarioChange(nextScenarioId: ScenarioId) {
    setScenarioId(nextScenarioId);
    setAssessment(null);
    setError(null);
    setApproved(false);
  }

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Synthetic decision support</p>
        <h1>Maintenance Evidence Copilot</h1>
        <p>Review deterministic telemetry status, evidence, and bounded inspection guidance for MTR-101.</p>
      </section>

      <section className="panel scenario-panel" aria-labelledby="scenario-title">
        <div>
          <p className="eyebrow">Select a demonstration event</p>
          <h2 id="scenario-title">Scenario</h2>
        </div>
        <div className="scenario-options" role="radiogroup" aria-label="Maintenance assessment scenario">
          {(Object.keys(scenarios) as ScenarioId[]).map((id) => (
            <label className={scenarioId === id ? "scenario-option selected" : "scenario-option"} key={id}>
              <input
                checked={scenarioId === id}
                disabled={isRunning}
                name="scenario"
                onChange={() => handleScenarioChange(id)}
                type="radio"
                value={id}
              />
              <span>{scenarios[id].label}</span>
            </label>
          ))}
        </div>
        <p className="scenario-summary">{scenario.summary}</p>
        <button className="primary-button" disabled={isRunning} onClick={handleRun} type="button">
          {isRunning ? "Running assessment…" : "Run Maintenance Assessment"}
        </button>
      </section>

      {error ? <p className="error-message" role="alert">{error}</p> : null}

      {assessment ? (
        <section className="assessment" aria-live="polite">
          <div className="assessment-heading">
            <div>
              <p className="eyebrow">Read-only assessment</p>
              <h2>{assessment.asset.name}</h2>
              <p>{assessment.asset.component} · Event {assessment.eventId}</p>
            </div>
            <div className={assessment.priority.code === "UNKNOWN" ? "priority unknown" : "priority"}>
              <span>Inspection priority</span>
              <strong>{assessment.priority.code}</strong>
            </div>
          </div>

          {assessment.priority.code === "UNKNOWN" ? (
            <p className="unknown-callout"><strong>Insufficient evidence for telemetry evaluation.</strong> The event is outside the operating envelope; do not infer condition from these readings.</p>
          ) : null}

          <div className="status-grid">
            <div><span>Vibration status</span><strong>{assessment.observations.vibrationStatus}</strong></div>
            <div><span>Temperature status</span><strong>{assessment.observations.temperatureStatus}</strong></div>
          </div>

          <div className="assessment-grid">
            <section><h3>Supporting evidence</h3><EvidenceList emptyMessage="No supporting evidence returned." items={assessment.supportingEvidence} /></section>
            <section><h3>Contradictory evidence</h3><EvidenceList emptyMessage="No contradictory evidence returned." items={assessment.contradictoryEvidence} /></section>
            <section>
              <h3>Possible explanations</h3>
              {assessment.possibleExplanations.length === 0 ? <p className="empty-state">No explanations returned.</p> : (
                <ul className="explanation-list">
                  {assessment.possibleExplanations.map((item, index) => (
                    <li key={`${item.label}-${index}`}>
                      <p>{item.label}</p>
                      <strong className="unconfirmed">UNCONFIRMED</strong>
                      <small>Supporting: {sourceText(item.supportingSourceIds)} · Contradictory: {sourceText(item.contradictorySourceIds)}</small>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3>Unknowns</h3>
              {assessment.unknowns.length === 0 ? <p className="empty-state">No unresolved unknowns returned.</p> : (
                <ul className="plain-list">
                  {assessment.unknowns.map((item, index) => <li key={`${item.description}-${index}`}><strong>{item.description}</strong><span>Needed: {item.neededToResolve}</span></li>)}
                </ul>
              )}
            </section>
            <section>
              <h3>Recommended checks</h3>
              {assessment.recommendedChecks.length === 0 ? <p className="empty-state">No recommended checks returned.</p> : (
                <ul className="plain-list">
                  {assessment.recommendedChecks.map((item, index) => <li key={`${item.action}-${index}`}><strong>{item.action}</strong><span>{item.rationale} Sources: {sourceText(item.sourceIds)}</span></li>)}
                </ul>
              )}
            </section>
            <section><h3>Source IDs</h3><p className="source-list">{assessment.sources.map((source) => source.id).join(", ") || "No source IDs returned."}</p></section>
          </div>

          <aside className="disclaimer"><strong>Safety disclaimer:</strong> {assessment.disclaimer}</aside>

          {!approved ? (
            <div className="approval-row">
              <p>Assessment is read-only. Approval creates a local draft only; no handoff is sent.</p>
              <button className="approval-button" onClick={() => setApproved(true)} type="button">Approve Assessment</button>
            </div>
          ) : <CmmsDraft assessment={assessment} />}
        </section>
      ) : null}
    </main>
  );
}
