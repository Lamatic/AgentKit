"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  DatabaseZap,
  FlaskConical,
  Gauge,
  Network,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { analyzeWebhookScenario } from "@/actions/orchestrate";
import type {
  AnalysisResult,
  BusinessEffect,
  DeliverySemantics,
  ReliabilityReport,
  WebhookScenario,
} from "@/lib/types";

const SAMPLE_SCENARIO: WebhookScenario = {
  systemName: "Checkout payment events",
  eventType: "payment.succeeded",
  businessEffect: "financial",
  deliverySemantics: "at-least-once",
  orderingRequired: true,
  maxAttempts: 6,
  timeoutSeconds: 10,
  maxDeliveryAgeMinutes: 1_440,
  currentSafeguards:
    "HMAC signature verification and request logs. Retries currently use a fixed 10-second delay. There is no durable idempotency record or dead-letter queue.",
  samplePayload: `{
  "event_id": "evt_01J8Z8K7G2",
  "type": "payment.succeeded",
  "occurred_at": "2026-08-08T08:30:00Z",
  "data": { "order_id": "ord_4831", "amount": 4999, "currency": "INR" }
}`,
  failureContext:
    "The receiver occasionally times out after committing the order update, so the provider retries and duplicate confirmation emails are sent.",
};

const EFFECT_OPTIONS: Array<{ value: BusinessEffect; label: string }> = [
  { value: "read-only", label: "Read-only" },
  { value: "reversible-write", label: "Reversible write" },
  { value: "notification", label: "Notification" },
  { value: "inventory", label: "Inventory / entitlement" },
  { value: "financial", label: "Financial" },
];

const DELIVERY_OPTIONS: Array<{ value: DeliverySemantics; label: string }> = [
  { value: "at-least-once", label: "At least once" },
  { value: "at-most-once", label: "At most once" },
  { value: "best-effort", label: "Best effort" },
  { value: "unknown", label: "Unknown" },
];

function formatDelay(seconds: number): string {
  if (seconds === 0) return "Immediate";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3_600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3_600)}h`;
}

function riskTone(level: ReliabilityReport["riskLevel"]): string {
  return `risk-${level}`;
}

export default function HomePage() {
  const [scenario, setScenario] = useState<WebhookScenario>(SAMPLE_SCENARIO);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateScenario<Key extends keyof WebhookScenario>(
    key: Key,
    value: WebhookScenario[Key],
  ) {
    setScenario((current) => ({ ...current, [key]: value }));
  }

  function submitScenario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);
    startTransition(async () => {
      const nextResult = await analyzeWebhookScenario(scenario);
      setResult(nextResult);
      if (nextResult.success) {
        window.requestAnimationFrame(() => {
          document.getElementById("report")?.scrollIntoView({ behavior: "smooth" });
        });
      }
    });
  }

  async function copyReport() {
    if (!result?.report) return;
    await navigator.clipboard.writeText(JSON.stringify(result.report, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  const report = result?.report;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Webhook Reliability Architect home">
          <span className="brand-mark" aria-hidden="true">
            <Network size={20} />
          </span>
          <span>Webhook Reliability Architect</span>
        </a>
        <span className="studio-chip">
          <span className="pulse" aria-hidden="true" /> Built for Lamatic AgentKit
        </span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Failure-aware architecture, in one reviewable brief</p>
          <h1>Stop duplicate webhooks before they duplicate the business effect.</h1>
          <p className="hero-lede">
            Describe a delivery contract. Get an idempotency design, bounded retry schedule,
            dead-letter replay procedure, observability SLO, and failure-injection test matrix.
          </p>
          <div className="hero-signals" aria-label="Report coverage">
            <span><ShieldCheck size={16} /> Idempotency</span>
            <span><RefreshCw size={16} /> Retries</span>
            <span><DatabaseZap size={16} /> Dead letters</span>
            <span><Activity size={16} /> SLOs</span>
          </div>
        </div>
        <div className="signal-card" aria-label="Reliability principle">
          <p className="signal-label">Core invariant</p>
          <p className="signal-value">One event → one business mutation</p>
          <div className="signal-flow" aria-hidden="true">
            <span>Receive</span><ArrowRight size={14} /><span>Claim</span><ArrowRight size={14} />
            <span>Commit</span><ArrowRight size={14} /><span>Remember</span>
          </div>
          <p className="signal-note">Redelivery returns the remembered result, not a second side effect.</p>
        </div>
      </section>

      <section className="workspace" aria-label="Webhook architecture workspace">
        <form className="scenario-panel" onSubmit={submitScenario}>
          <div className="section-heading">
            <div>
              <p className="step">01 · Delivery contract</p>
              <h2>Describe the webhook</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setScenario(SAMPLE_SCENARIO);
                setResult(null);
              }}
            >
              Load sample
            </button>
          </div>

          <div className="field-grid two-columns">
            <label>
              System name
              <input
                required
                value={scenario.systemName}
                onChange={(event) => updateScenario("systemName", event.target.value)}
                placeholder="Checkout payment events"
              />
            </label>
            <label>
              Event type
              <input
                required
                value={scenario.eventType}
                onChange={(event) => updateScenario("eventType", event.target.value)}
                placeholder="payment.succeeded"
              />
            </label>
            <label>
              Business effect
              <select
                value={scenario.businessEffect}
                onChange={(event) =>
                  updateScenario("businessEffect", event.target.value as BusinessEffect)
                }
              >
                {EFFECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Sender semantics
              <select
                value={scenario.deliverySemantics}
                onChange={(event) =>
                  updateScenario("deliverySemantics", event.target.value as DeliverySemantics)
                }
              >
                {DELIVERY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={scenario.orderingRequired}
              onChange={(event) => updateScenario("orderingRequired", event.target.checked)}
            />
            <span>
              <strong>Ordering matters</strong>
              <small>Older events must not overwrite newer aggregate state.</small>
            </span>
          </label>

          <div className="field-grid three-columns">
            <label>
              Max attempts
              <input
                type="number"
                min={1}
                max={12}
                required
                value={scenario.maxAttempts}
                onChange={(event) => updateScenario("maxAttempts", Number(event.target.value))}
              />
            </label>
            <label>
              Timeout (seconds)
              <input
                type="number"
                min={1}
                max={300}
                required
                value={scenario.timeoutSeconds}
                onChange={(event) => updateScenario("timeoutSeconds", Number(event.target.value))}
              />
            </label>
            <label>
              Delivery age (minutes)
              <input
                type="number"
                min={1}
                max={10_080}
                required
                value={scenario.maxDeliveryAgeMinutes}
                onChange={(event) =>
                  updateScenario("maxDeliveryAgeMinutes", Number(event.target.value))
                }
              />
            </label>
          </div>

          <label>
            Existing safeguards
            <textarea
              rows={4}
              value={scenario.currentSafeguards}
              onChange={(event) => updateScenario("currentSafeguards", event.target.value)}
              placeholder="Signature checks, retry logic, deduplication, logs, queues…"
            />
          </label>

          <label>
            Sample payload
            <textarea
              className="code-input"
              rows={8}
              value={scenario.samplePayload}
              onChange={(event) => updateScenario("samplePayload", event.target.value)}
              spellCheck={false}
              placeholder={'{ "event_id": "evt_123", "type": "order.created" }'}
            />
          </label>

          <label>
            Failure context
            <textarea
              rows={4}
              value={scenario.failureContext}
              onChange={(event) => updateScenario("failureContext", event.target.value)}
              placeholder="What already fails, or what are you most worried about?"
            />
          </label>

          {result && !result.success ? (
            <div className="error-banner" role="alert">
              <AlertTriangle size={18} /> {result.error}
            </div>
          ) : null}

          <button className="primary-button" type="submit" disabled={isPending}>
            {isPending ? <RefreshCw className="spin" size={18} /> : <Send size={18} />}
            {isPending ? "Modeling failure paths…" : "Generate reliability blueprint"}
          </button>
          <p className="privacy-note">
            Avoid real secrets or personal data. Demo mode is deterministic and stays local to the app.
          </p>
        </form>

        <aside className="principles-panel">
          <p className="step">Reliability lens</p>
          <h2>What the architect checks</h2>
          <ol className="principle-list">
            <li><span>1</span><div><strong>Identity</strong><p>Can every event claim one durable key?</p></div></li>
            <li><span>2</span><div><strong>Atomicity</strong><p>Can the side effect and receipt commit together?</p></div></li>
            <li><span>3</span><div><strong>Bounded retry</strong><p>Which failures deserve another attempt—and for how long?</p></div></li>
            <li><span>4</span><div><strong>Safe replay</strong><p>Can an operator recover poison or exhausted events deliberately?</p></div></li>
            <li><span>5</span><div><strong>Evidence</strong><p>Will metrics and chaos tests prove the invariant?</p></div></li>
          </ol>
          <div className="anti-pattern">
            <AlertTriangle size={18} />
            <div><strong>Retry is not recovery by itself.</strong><p>Without idempotency, faster retries can multiply the damage.</p></div>
          </div>
        </aside>
      </section>

      {report ? (
        <section className="report" id="report" aria-live="polite">
          <div className="report-header">
            <div>
              <p className="step">02 · Architecture brief</p>
              <h2>{scenario.systemName}</h2>
              <p>{report.executiveSummary}</p>
            </div>
            <div className="report-actions">
              <span className="mode-chip">{result?.mode === "live" ? "Live flow" : "Demo engine"}</span>
              <button className="secondary-button" type="button" onClick={copyReport}>
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy JSON"}
              </button>
            </div>
          </div>

          <div className="score-grid">
            <article className={`risk-card ${riskTone(report.riskLevel)}`}>
              <div><Gauge size={20} /><span>Delivery risk</span></div>
              <strong>{report.riskScore}<small>/10</small></strong>
              <p>{report.riskLevel}</p>
            </article>
            <article className="metric-card"><Clock3 size={20} /><div><span>Delivery budget</span><strong>{report.retryPlan.maxDeliveryAgeMinutes} min</strong></div></article>
            <article className="metric-card"><RefreshCw size={20} /><div><span>Bounded attempts</span><strong>{report.retryPlan.maxAttempts}</strong></div></article>
            <article className="metric-card"><FlaskConical size={20} /><div><span>Failure tests</span><strong>{report.testMatrix.length}</strong></div></article>
          </div>

          <div className="report-grid">
            <article className="report-card wide-card">
              <div className="card-title"><ShieldCheck size={20} /><div><p className="step">Control 01</p><h3>Idempotency contract</h3></div></div>
              <p>{report.idempotencyPlan.keyStrategy}</p>
              <div className="contract-key"><span>Example key</span><code>{report.idempotencyPlan.keyExample}</code></div>
              <dl className="detail-list">
                <div><dt>Storage</dt><dd>{report.idempotencyPlan.storage}</dd></div>
                <div><dt>First delivery</dt><dd>{report.idempotencyPlan.firstSeenBehavior}</dd></div>
                <div><dt>Duplicate</dt><dd>{report.idempotencyPlan.duplicateBehavior}</dd></div>
                <div><dt>Key conflict</dt><dd>{report.idempotencyPlan.conflictBehavior}</dd></div>
                <div><dt>Retention</dt><dd>{report.idempotencyPlan.ttlHours} hours</dd></div>
              </dl>
            </article>

            <article className="report-card wide-card">
              <div className="card-title"><RefreshCw size={20} /><div><p className="step">Control 02</p><h3>Retry schedule</h3></div></div>
              <p>{report.retryPlan.policy}</p>
              <div className="retry-track">
                {report.retryPlan.schedule.map((item) => (
                  <div className="retry-step" key={item.attempt}>
                    <span>{item.attempt}</span><strong>{formatDelay(item.delaySeconds)}</strong><small>{item.purpose}</small>
                  </div>
                ))}
              </div>
              <div className="condition-grid">
                <div><h4>Retry</h4><ul>{report.retryPlan.retryableConditions.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><h4>Do not retry</h4><ul>{report.retryPlan.nonRetryableConditions.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>
            </article>

            <article className="report-card">
              <div className="card-title"><DatabaseZap size={20} /><div><p className="step">Control 03</p><h3>Dead-letter & replay</h3></div></div>
              <p>{report.deadLetterPlan.trigger}</p>
              <h4>Replay gate</h4>
              <ol className="check-list">{report.deadLetterPlan.replayChecklist.map((item) => <li key={item}>{item}</li>)}</ol>
            </article>

            <article className="report-card">
              <div className="card-title"><Activity size={20} /><div><p className="step">Control 04</p><h3>Observability</h3></div></div>
              <div className="slo"><span>SLO</span><p>{report.observability.slo}</p></div>
              <h4>Page when</h4>
              <ul>{report.observability.alerts.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          </div>

          <article className="table-card">
            <div className="card-title"><AlertTriangle size={20} /><div><p className="step">Failure analysis</p><h3>What breaks, how you know, what contains it</h3></div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Failure mode</th><th>Impact</th><th>Signal</th><th>Mitigation</th></tr></thead>
                <tbody>{report.failureModes.map((item) => <tr key={item.scenario}><td>{item.scenario}</td><td>{item.impact}</td><td>{item.signal}</td><td>{item.mitigation}</td></tr>)}</tbody>
              </table>
            </div>
          </article>

          <article className="table-card">
            <div className="card-title"><FlaskConical size={20} /><div><p className="step">Evidence plan</p><h3>Failure-injection matrix</h3></div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Test</th><th>Setup</th><th>Expected evidence</th></tr></thead>
                <tbody>{report.testMatrix.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.setup}</td><td>{item.expected}</td></tr>)}</tbody>
              </table>
            </div>
          </article>

          <article className="rollout-card">
            <div><p className="step">Safe rollout</p><h3>Move from advice to production evidence</h3></div>
            <ol>{report.rolloutSteps.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol>
          </article>
        </section>
      ) : null}

      <footer>
        <span>Webhook Reliability Architect</span>
        <p>Architecture guidance, not an automatic production change. Validate every recommendation in your environment.</p>
      </footer>
    </main>
  );
}
