"use client";

import { FormEvent, useState } from "react";

type Observation = {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
};

type ProbeRun = { passed: boolean; observation: Observation };

type Investigation = {
  issue: { title: string; url: string; repositoryUrl: string; number: number };
  ref: string;
  hypothesis: string;
  outcome: "reproduced" | "not_reproduced_under_tested_conditions";
  gate: {
    repeatCount: number;
    allCandidateRunsPassed: boolean;
    controlRejected: boolean;
  };
  evidence: { candidateRuns: ProbeRun[]; controlRun: ProbeRun };
  report: { format: "markdown"; content: string };
};

const exampleIssue =
  "https://github.com/Dhruv2mars/isolate-cli-testbed/issues/1";

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function OutcomeMark({ passed }: { passed: boolean }) {
  return (
    <span className={passed ? "mark mark-pass" : "mark mark-fail"} aria-hidden>
      {passed ? "✓" : "×"}
    </span>
  );
}

function EvidenceRun({ label, run }: { label: string; run: ProbeRun }) {
  return (
    <details className="evidence-run">
      <summary>
        <OutcomeMark passed={run.passed} />
        <span>{label}</span>
        <code>exit {run.observation.exitCode}</code>
        <span className="duration">{run.observation.durationMs} ms</span>
      </summary>
      <div className="run-body">
        <p className="command-label">Command</p>
        <pre>{run.observation.command}</pre>
        <div className="output-grid">
          <section>
            <h4>stdout</h4>
            <pre>{run.observation.stdout || "(empty)"}</pre>
          </section>
          <section>
            <h4>stderr</h4>
            <pre>{run.observation.stderr || "(empty)"}</pre>
          </section>
        </div>
      </div>
    </details>
  );
}

export function InvestigationWorkbench() {
  const [issueUrl, setIssueUrl] = useState(exampleIssue);
  const [ref, setRef] = useState("main");
  const [result, setResult] = useState<Investigation | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch("/api/investigate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issueUrl, ref }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Investigation failed.");
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Investigation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="masthead">
        <a className="wordmark" href="#top" aria-label="Isolate home">
          <span className="wordmark-seal">I</span>
          <span>Isolate</span>
        </a>
        <p>AI investigates. Evidence decides.</p>
        <a className="source-link" href="https://github.com/Lamatic/AgentKit/pull/291">
          Source ↗
        </a>
      </header>

      <div className="workspace" id="top">
        <aside className="intake">
          <p className="docket-label">New evidence docket</p>
          <h1>Reproduce the issue, not the guess.</h1>
          <p className="lede">
            Give Isolate a vague public GitHub issue. Lamatic plans the probe;
            a disposable sandbox executes it; deterministic assertions certify
            the result.
          </p>

          <form onSubmit={submit}>
            <label htmlFor="issue">GitHub issue URL</label>
            <input
              id="issue"
              type="url"
              required
              value={issueUrl}
              onChange={(event) => setIssueUrl(event.target.value)}
              placeholder="https://github.com/owner/repo/issues/123"
              disabled={loading}
            />
            <label htmlFor="ref">Repository ref</label>
            <input
              id="ref"
              value={ref}
              onChange={(event) => setRef(event.target.value)}
              placeholder="main or full commit SHA"
              disabled={loading}
            />
            <button className="primary" disabled={loading} type="submit">
              {loading ? "Isolating repository…" : "Begin investigation"}
            </button>
            <p className="form-note">
              Public repositories only. No credentials, pushes, publishing, or
              fixes.
            </p>
          </form>

          {error ? (
            <div className="error-notice" role="alert">
              <strong>Investigation stopped</strong>
              <span>{error}</span>
              <button type="button" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          ) : null}
        </aside>

        <section className="record" aria-live="polite">
          {loading ? (
            <div className="loading-record">
              <div className="scan-line" />
              <p className="docket-label">Investigation active</p>
              <h2>Building a reproducible case</h2>
              <ol>
                <li className="active">Reading the public issue</li>
                <li>Inspecting repository context in Daytona</li>
                <li>Requesting a Lamatic probe plan</li>
                <li>Running candidate twice and negative control once</li>
                <li>Deleting the sandbox</li>
              </ol>
            </div>
          ) : result ? (
            <ResultRecord result={result} />
          ) : (
            <EmptyRecord />
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyRecord() {
  return (
    <div className="empty-record">
      <div className="empty-heading">
        <p className="docket-label">Certification standard</p>
        <h2>Three observations. One defensible outcome.</h2>
      </div>
      <div className="gate-diagram" aria-label="Reproduction evidence gate">
        <div><span>Candidate A</span><strong>same probe</strong></div>
        <div><span>Candidate B</span><strong>repeatability</strong></div>
        <div><span>Control</span><strong>specificity</strong></div>
        <b aria-hidden>→</b>
        <div className="cert-seal"><span>Runtime-owned</span><strong>verdict</strong></div>
      </div>
      <p className="empty-copy">
        The language model may form a hypothesis and choose commands. It cannot
        mark its own work reproduced. That outcome exists only when both
        candidate runs pass and the negative control rejects the hypothesis.
      </p>
      <div className="boundary-ledger">
        <div><span>Lamatic</span><strong>Plans</strong><p>Issue interpretation, hypothesis, probe selection.</p></div>
        <div><span>Daytona</span><strong>Isolates</strong><p>Private, expiring workspace with bounded commands.</p></div>
        <div><span>Isolate</span><strong>Certifies</strong><p>Assertions, repeat evidence, control rejection.</p></div>
      </div>
    </div>
  );
}

function ResultRecord({ result }: { result: Investigation }) {
  const reproduced = result.outcome === "reproduced";
  return (
    <article className="result-record">
      <div className="result-header">
        <div>
          <p className="docket-label">Issue #{result.issue.number} · {result.ref}</p>
          <h2>{result.issue.title}</h2>
          <a href={result.issue.url}>{result.issue.repositoryUrl.replace("https://github.com/", "")} ↗</a>
        </div>
        <div className={`verdict ${reproduced ? "verdict-pass" : "verdict-neutral"}`}>
          <span>Deterministic outcome</span>
          <strong>{reproduced ? "Reproduced" : "Not reproduced"}</strong>
        </div>
      </div>

      <section className="hypothesis">
        <p className="docket-label">Agent hypothesis</p>
        <p>{result.hypothesis}</p>
      </section>

      <section className="gate-result">
        <h3>Evidence gate</h3>
        <div className="gate-checks">
          <p><OutcomeMark passed={result.gate.allCandidateRunsPassed} />Two candidate runs passed</p>
          <p><OutcomeMark passed={result.gate.controlRejected} />Negative control rejected</p>
          <p><OutcomeMark passed={reproduced} />Runtime issued outcome</p>
        </div>
      </section>

      <section className="runs">
        <h3>Recorded runs</h3>
        {result.evidence.candidateRuns.map((run, index) => (
          <EvidenceRun key={index} label={`Candidate run ${index + 1}`} run={run} />
        ))}
        <EvidenceRun label="Negative control" run={result.evidence.controlRun} />
      </section>

      <footer className="report-actions">
        <div><strong>Portable evidence</strong><span>Sandbox deleted after collection.</span></div>
        <button onClick={() => download("isolate-report.md", result.report.content, "text/markdown")}>Download Markdown</button>
        <button onClick={() => download("isolate-report.json", JSON.stringify(result, null, 2), "application/json")}>Download JSON</button>
      </footer>
    </article>
  );
}
