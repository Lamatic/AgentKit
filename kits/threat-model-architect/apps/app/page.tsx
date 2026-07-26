"use client";

import { FormEvent, useState } from "react";
import { generateThreatModel } from "@/actions/orchestrate";
import type { IntakeInput, ThreatModelReport } from "@/lib/types";

const sample = `We operate AcmeLedger, a multi-tenant B2B invoicing SaaS. Customers use a Next.js browser app that calls a Node.js API. Clerk provides authentication, PostgreSQL stores tenant data and invoices, Stripe sends payment webhooks, and customers upload receipts to S3 through pre-signed URLs. Internal support staff use an admin dashboard.`;

function Section({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </section>
  );
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [report, setReport] = useState<ThreatModelReport | null>(null);
  const [error, setError] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [sessionState, setSessionState] = useState<IntakeInput["sessionState"]>();
  const [accessToken, setAccessToken] = useState("");
  const [running, setRunning] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setRunning(true);
    setError("");
    setReport(null);
    try {
      const result = await generateThreatModel({
        systemDescription: description,
        sessionState,
        accessToken: accessToken || undefined,
      });
      if (result.status === "complete") {
        setReport(result.report);
        setAssistantMessage("");
        setMissingInfo([]);
        setSessionState(undefined);
      } else if (result.status === "needs_input") {
        setAssistantMessage(result.assistantMessage);
        setMissingInfo(result.missingInfo);
        setSessionState(result.sessionState);
        setDescription("");
      } else {
        setError(result.error);
      }
    } catch {
      setError("The request could not be completed. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  function resetIntake() {
    setDescription("");
    setAssistantMessage("");
    setMissingInfo([]);
    setSessionState(undefined);
    setReport(null);
    setError("");
  }

  return (
    <main>
      <header>
        <span className="eyebrow">LAMATIC AGENTKIT · SECURITY</span>
        <h1>Threat Model Architect</h1>
        <p>Turn a system description into a structured architecture model, STRIDE threat register, DREAD ranking, and remediation roadmap.</p>
      </header>
      <div className="layout">
        <section className="card intake">
          <h2>System intake</h2>
          <p className="muted">Include components, data, integrations, user roles, and trust boundaries where known.</p>
          {assistantMessage && (
            <div className="follow-up" role="status" aria-live="polite">
              <strong>Intake follow-up</strong>
              <p>{assistantMessage}</p>
              {missingInfo.length > 0 && (
                <ul>{missingInfo.map((item) => <li key={item}>{item}</li>)}</ul>
              )}
            </div>
          )}
          <form onSubmit={submit}>
            <label htmlFor="system-description" className="muted">
              {sessionState ? "Your response" : "System description"}
            </label>
            <textarea id="system-description" value={description} maxLength={6000} onChange={(event) => setDescription(event.target.value)} placeholder={sessionState ? "Answer the follow-up or confirm the summary…" : "Describe your architecture…"} rows={15} disabled={running} />
            <label htmlFor="access-token" className="muted">Deployment access token (if required)</label>
            <input id="access-token" type="password" autoComplete="current-password" value={accessToken} maxLength={512} onChange={(event) => setAccessToken(event.target.value)} disabled={running} />
            <div className="actions">
              <button type="submit" disabled={running || !description.trim()}>{running ? "Processing…" : sessionState ? "Continue intake" : "Start threat model"}</button>
              <button type="button" className="secondary" disabled={running} onClick={() => setDescription(sample)}>Load sample</button>
              {sessionState && <button type="button" className="secondary" disabled={running} onClick={resetIntake}>Start over</button>}
            </div>
          </form>
          <ol className="pipeline">
            <li>Architecture intake</li><li>Decomposition</li><li>STRIDE</li><li>Research</li><li>DREAD</li><li>Local roadmap</li>
          </ol>
        </section>

        <section className="results">
          {error && <p className="error" role="alert">{error}</p>}
          {!report && !running && !error && <div className="empty">Your completed threat-model report will appear here after intake is confirmed.</div>}
          {running && <div className="empty" role="status" aria-live="polite">Validating intake and generating the report. This can take a few minutes.</div>}
          {report && <>
            <Section title="Architecture model" value={report.architecture} />
            <Section title="STRIDE threat register" value={report.stride} />
            <Section title="Research context" value={report.research} />
            <Section title="DREAD prioritization" value={report.prioritization} />
            <Section title="7 / 30 / 60 / 90-day roadmap" value={report.roadmap} />
          </>}
        </section>
      </div>
    </main>
  );
}
