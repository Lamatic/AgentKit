"use client";

import { useState } from "react";
import { analyzeDecision } from "@/actions/orchestrate";
import type { PremortemInput, PremortemResult } from "@/lib/types";

const sampleInput: PremortemInput = {
  decision: "Launch a paid team plan for our project-management app next month.",
  context:
    "Thirty-four free teams use the product weekly. Six asked for shared permissions, but no one has committed to a price. Support volume is manageable.",
  constraints:
    "Two engineers, no dedicated salesperson, and four weeks before the planned launch.",
  timeHorizon: "Validate willingness to pay within 30 days.",
};

const sampleResult: PremortemResult = {
  decisionSummary:
    "A full paid-plan launch is premature; run a narrow pricing and permissions pilot with the six interested teams first.",
  assumptions: [
    {
      assumption: "Requests for shared permissions indicate willingness to pay.",
      evidenceStatus: "uncertain",
      rationale: "Feature demand is observed, but price commitment has not been tested.",
      fastestTest: "Offer the six teams a paid 30-day design-partner pilot.",
    },
    {
      assumption: "Two engineers can support billing and permissions in four weeks.",
      evidenceStatus: "unsupported",
      rationale: "No delivery estimate or security review is included.",
      fastestTest: "Time-box a two-day technical spike and dependency map.",
    },
  ],
  failureModes: [
    {
      failureMode: "Teams like the feature but reject the proposed price.",
      likelihood: "high",
      impact: "high",
      warningSignals: ["Pilot invitations are accepted only when free", "Price questions go unanswered"],
      mitigation: "Test three price anchors before building the complete billing path.",
      ownerRole: "Product lead",
    },
    {
      failureMode: "Permissions work expands beyond the four-week window.",
      likelihood: "medium",
      impact: "high",
      warningSignals: ["Role definitions keep changing", "Authorization edge cases remain unresolved"],
      mitigation: "Limit the pilot to owner and member roles with documented exclusions.",
      ownerRole: "Engineering lead",
    },
  ],
  experiments: [
    {
      hypothesis: "At least three of six interested teams will pay for shared permissions.",
      method: "Offer a clearly priced, concierge-supported design-partner pilot.",
      successMetric: "Three signed pilot agreements at the target price.",
      stopCondition: "Fewer than two teams commit after all six receive the offer.",
      estimatedEffort: "One day",
      timebox: "Seven days",
    },
  ],
  recommendation: {
    status: "pilot",
    rationale: "Demand exists, but willingness to pay and delivery scope remain unproven.",
    confidence: "high",
  },
  nextActions: [
    "Define the minimum owner/member permission model.",
    "Send a priced pilot offer to the six interested teams.",
    "Run a two-day engineering spike before announcing a launch date.",
  ],
};

const blankInput: PremortemInput = {
  decision: "",
  context: "",
  constraints: "",
  timeHorizon: "",
};

export default function Home() {
  const [input, setInput] = useState<PremortemInput>(blankInput);
  const [result, setResult] = useState<PremortemResult | null>(null);
  const [exampleMode, setExampleMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof PremortemInput, value: string) =>
    setInput((current) => ({ ...current, [key]: value }));

  async function submit() {
    setLoading(true);
    setError("");
    setExampleMode(false);
    const response = await analyzeDecision(input);
    if (response.success) setResult(response.data);
    else setError(response.error);
    setLoading(false);
  }

  function showExample() {
    setInput(sampleInput);
    setResult(sampleResult);
    setExampleMode(true);
    setError("");
  }

  const unsupported = result?.assumptions.filter((item) => item.evidenceStatus !== "supported").length ?? 0;
  const highRisks = result?.failureModes.filter((item) => item.likelihood === "high" || item.impact === "high").length ?? 0;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Decision Pre-Mortem Lab home">
          <span className="brand-mark">PM</span>
          <span>Decision Pre-Mortem Lab</span>
        </a>
        <span className="status"><i /> Built with Lamatic AgentKit</span>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">DECIDE WITH EVIDENCE</p>
          <h1>Find the failure<br />before the launch.</h1>
          <p className="hero-copy">
            Turn a proposed decision into an assumption ledger, early-warning system,
            and a set of small experiments you can run before the expensive commitment.
          </p>
        </div>
        <div className="principle">
          <span>PRE-MORTEM PRINCIPLE</span>
          <strong>Imagine it failed. Work backward. Test what matters.</strong>
        </div>
      </section>

      <section className="workspace">
        <div className="input-panel">
          <div className="section-heading">
            <span>01</span><div><h2>Frame the decision</h2><p>Specific inputs produce useful tests.</p></div>
          </div>
          <label>
            Proposed decision <b>required</b>
            <textarea value={input.decision} onChange={(e) => update("decision", e.target.value)} placeholder="What are you considering, and what commitment would it require?" />
          </label>
          <label>
            Context and evidence
            <textarea value={input.context} onChange={(e) => update("context", e.target.value)} placeholder="Known facts, customer signals, previous tests, stakeholder views…" />
          </label>
          <div className="field-grid">
            <label>
              Constraints
              <textarea value={input.constraints} onChange={(e) => update("constraints", e.target.value)} placeholder="Budget, people, policy…" />
            </label>
            <label>
              Time horizon
              <textarea value={input.timeHorizon} onChange={(e) => update("timeHorizon", e.target.value)} placeholder="When must this work?" />
            </label>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="actions">
            <button className="primary" onClick={submit} disabled={loading}>
              {loading ? "Running pre-mortem…" : "Run pre-mortem →"}
            </button>
            <button className="secondary" onClick={showExample}>View worked example</button>
          </div>
          <p className="privacy">No decision is executed. Inputs are used only to generate this report.</p>
        </div>

        <div className="report-panel" aria-live="polite">
          {!result ? (
            <div className="empty">
              <div className="empty-orbit"><span>?</span></div>
              <h2>Your pre-mortem will appear here</h2>
              <p>See unsupported assumptions, ranked failure modes, and the smallest useful validation experiments.</p>
              <div className="empty-steps"><span>ASSUMPTIONS</span><span>FAILURE MODES</span><span>EXPERIMENTS</span></div>
            </div>
          ) : (
            <Report result={result} unsupported={unsupported} highRisks={highRisks} exampleMode={exampleMode} />
          )}
        </div>
      </section>
    </main>
  );
}

function Pill({ value }: { value: string }) {
  return <span className={`pill ${value}`}>{value}</span>;
}

function Report({ result, unsupported, highRisks, exampleMode }: { result: PremortemResult; unsupported: number; highRisks: number; exampleMode: boolean }) {
  return (
    <div className="report">
      <div className="report-title">
        <div><p className="eyebrow">02 · ANALYSIS</p><h2>Decision brief</h2></div>
        <Pill value={result.recommendation.status} />
      </div>
      {exampleMode && <p className="example-note">Illustrative report — run the Lamatic flow for a live analysis.</p>}
      <p className="summary">{result.decisionSummary}</p>
      <div className="metrics">
        <div><strong>{unsupported}</strong><span>open assumptions</span></div>
        <div><strong>{highRisks}</strong><span>material risks</span></div>
        <div><strong>{result.experiments.length}</strong><span>fast tests</span></div>
        <div><strong>{result.recommendation.confidence}</strong><span>confidence</span></div>
      </div>

      <h3>Assumption ledger</h3>
      <div className="stack">
        {result.assumptions.map((item, index) => (
          <article className="card" key={`${item.assumption}-${index}`}>
            <div className="card-head"><strong>A{index + 1}</strong><Pill value={item.evidenceStatus} /></div>
            <h4>{item.assumption}</h4><p>{item.rationale}</p>
            <div className="test"><span>FASTEST TEST</span>{item.fastestTest}</div>
          </article>
        ))}
      </div>

      <h3>Failure modes</h3>
      <div className="stack">
        {result.failureModes.map((item, index) => (
          <article className="card risk" key={`${item.failureMode}-${index}`}>
            <div className="card-head"><strong>R{index + 1}</strong><div><Pill value={item.likelihood} /><Pill value={item.impact} /></div></div>
            <h4>{item.failureMode}</h4><p>{item.mitigation}</p>
            <div className="signals"><span>Watch:</span> {item.warningSignals.join(" · ")}</div>
            <small>Owner: {item.ownerRole}</small>
          </article>
        ))}
      </div>

      <h3>Validation experiments</h3>
      <div className="stack">
        {result.experiments.map((item, index) => (
          <article className="experiment" key={`${item.hypothesis}-${index}`}>
            <span className="experiment-number">0{index + 1}</span>
            <div><h4>{item.hypothesis}</h4><p>{item.method}</p>
              <dl><div><dt>Success</dt><dd>{item.successMetric}</dd></div><div><dt>Stop</dt><dd>{item.stopCondition}</dd></div></dl>
              <small>{item.estimatedEffort} · {item.timebox}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="recommendation">
        <p className="eyebrow">RECOMMENDATION · {result.recommendation.confidence} CONFIDENCE</p>
        <h3>{result.recommendation.status}</h3><p>{result.recommendation.rationale}</p>
        <ol>{result.nextActions.map((action) => <li key={action}>{action}</li>)}</ol>
      </div>
    </div>
  );
}
