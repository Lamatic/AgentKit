"use client";

import { FormEvent, useState } from "react";
import { generateThreatModel } from "@/actions/orchestrate";
import type { ThreatModelReport } from "@/lib/types";

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
  const [running, setRunning] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setRunning(true);
    setError("");
    setReport(null);
    const result = await generateThreatModel({ systemDescription: description });
    if (result.success) setReport(result.report);
    else setError(result.error);
    setRunning(false);
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
          <form onSubmit={submit}>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe your architecture…" rows={15} disabled={running} />
            <div className="actions">
              <button type="submit" disabled={running || !description.trim()}>{running ? "Running five-flow analysis…" : "Generate threat model"}</button>
              <button type="button" className="secondary" disabled={running} onClick={() => setDescription(sample)}>Load sample</button>
            </div>
          </form>
          <ol className="pipeline">
            <li>Architecture intake</li><li>Decomposition</li><li>STRIDE</li><li>Research</li><li>DREAD</li><li>Local roadmap</li>
          </ol>
        </section>

        <section className="results">
          {error && <p className="error">{error}</p>}
          {!report && !running && !error && <div className="empty">Your completed threat-model report will appear here.</div>}
          {running && <div className="empty">Executing five Lamatic flows and deriving a remediation roadmap. This can take a few minutes.</div>}
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
