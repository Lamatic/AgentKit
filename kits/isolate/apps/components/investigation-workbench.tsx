"use client";

import { FormEvent, useId, useState } from "react";

import {
  githubIssueUrlPattern,
  investigationRequest,
} from "../lib/investigation-request";

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
  hypothesisSource?: "planner" | "evidence_review";
  outcome: "reproduced" | "not_reproduced_under_tested_conditions" | "likely_reproduced" | "not_reproduced" | "inconclusive";
  verdictOwner?: "lamatic";
  gate: {
    repeatCount: number;
    allCandidateRunsPassed: boolean;
    controlRejected: boolean;
  } | null;
  evidence: { candidateRuns: ProbeRun[]; controlRun: ProbeRun };
  report: { format: "markdown"; content: string };
  analysis?: {
    summary: string;
    expectedBehavior: string;
    actualBehavior: string;
    reproductionSteps: string[];
    evidence: string[];
    limitations: string[];
  };
};

/** Public evaluation fixture — offered, never prefilled. */
const EVALUATION_ISSUE =
  "https://github.com/Dhruv2mars/isolate-cli-testbed/issues/1";

const EXPECTED_STEPS = [
  "Read the public issue",
  "Open a disposable Daytona sandbox",
  "Ask Lamatic for a probe plan",
  "Run the candidate twice and a negative control once",
  "Delete the sandbox",
] as const;

/**
 * Trigger a client-side download of an exported report.
 */
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Pass/fail/observed marker shown beside a recorded run.
 */
function StatusGlyph({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span className={`glyph ${ok ? "glyph-ok" : "glyph-bad"}`} title={label}>
      <span aria-hidden>{ok ? "✓" : "×"}</span>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

/**
 * One recorded run: command, exit code, duration, and both captured streams.
 */
function Finding({
  title,
  run,
  expect,
}: {
  title: string;
  run: ProbeRun;
  expect: "pass" | "reject" | "observe";
}) {
  const supports = expect === "observe" ? true : expect === "reject" ? !run.passed : run.passed;
  const label =
    expect === "observe"
      ? "Recorded: "
      : expect === "reject"
      ? supports
        ? "Rejected as expected: "
        : "Unexpectedly matched: "
      : supports
        ? "Passed: "
        : "Failed: ";

  return (
    <details className="finding" open>
      <summary>
        <StatusGlyph ok={supports} label={label} />
        <span className="finding-title">{title}</span>
        <span className="finding-meta">
          exit {run.observation.exitCode}
          <span aria-hidden> · </span>
          {run.observation.durationMs} ms
        </span>
      </summary>
      <div className="finding-body">
        <p className="micro">Command</p>
        <pre>{run.observation.command}</pre>
        <div className="io">
          <div>
            <p className="micro">stdout</p>
            <pre>{run.observation.stdout || "(empty)"}</pre>
          </div>
          <div>
            <p className="micro">stderr</p>
            <pre>{run.observation.stderr || "(empty)"}</pre>
          </div>
        </div>
      </div>
    </details>
  );
}

/**
 * Reviewer surface: submit an issue URL, watch the investigation, and read or
 * export the resulting evidence.
 */
export function InvestigationWorkbench() {
  const formId = useId();
  const [issueUrl, setIssueUrl] = useState("");
  const [ref, setRef] = useState("");
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
        body: JSON.stringify(investigationRequest(issueUrl, ref)),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Investigation failed.");
      }
      setResult(payload);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Investigation failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function useEvaluationIssue() {
    setIssueUrl(EVALUATION_ISSUE);
    setError("");
    window.requestAnimationFrame(() => {
      document.getElementById(`${formId}-issue`)?.focus();
    });
  }

  return (
    <div className="page">
      <header className="top">
        <a className="brand" href="#report" aria-label="Isolate home">
          Isolate
        </a>
        <p className="brand-line">The model investigates. The runtime certifies.</p>
        <a
          className="top-link"
          href="https://github.com/Lamatic/AgentKit/pull/291"
        >
          Kit source
        </a>
      </header>

      <main className="report" id="report">
        <section className="accession" aria-labelledby="accession-title">
          <h1 id="accession-title">Reproduce a public GitHub issue</h1>
          <p className="lead">
            Paste an issue URL. Isolate plans a probe, runs it in a disposable
            sandbox, and returns a certified outcome — never a model self-grade.
          </p>

          <form className="accession-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor={`${formId}-issue`}>GitHub issue URL</label>
              <input
                id={`${formId}-issue`}
                type="url"
                required
                pattern={githubIssueUrlPattern}
                title="Use a public GitHub issue URL such as https://github.com/owner/repo/issues/123."
                value={issueUrl}
                onChange={(event) => setIssueUrl(event.target.value)}
                placeholder="https://github.com/owner/repo/issues/123"
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
              <p className="field-help">
                {issueUrl.trim() === EVALUATION_ISSUE ? (
                  <>
                    Evaluation fixture loaded.{" "}
                    <button
                      type="button"
                      className="text-action"
                      onClick={() => setIssueUrl("")}
                      disabled={loading}
                    >
                      Clear
                    </button>
                  </>
                ) : issueUrl.trim() ? (
                  <>Paste any public issue URL. The field stays under your control.</>
                ) : (
                  <>
                    Left empty on purpose — paste your issue, or{" "}
                    <button
                      type="button"
                      className="text-action"
                      onClick={useEvaluationIssue}
                      disabled={loading}
                    >
                      use the public evaluation issue
                    </button>
                    .
                  </>
                )}
              </p>
            </div>

            <div className="field">
              <label htmlFor={`${formId}-ref`}>
                Repository ref <span className="optional">optional</span>
              </label>
              <input
                id={`${formId}-ref`}
                value={ref}
                onChange={(event) => setRef(event.target.value)}
                placeholder="Default branch if left blank"
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <button className="run" type="submit" disabled={loading || !issueUrl.trim()}>
              {loading ? "Working…" : "Run isolation"}
            </button>
          </form>

          <p className="constraints">
            Public repositories only. No credentials, pushes, publishing, or
            fixes.
          </p>

          {error ? (
            <div className="alert" role="alert">
              <p>
                <strong>Stopped.</strong> {error}
              </p>
              <button type="button" className="text-action" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          ) : null}
        </section>

        <div className="body" aria-live="polite">
          {loading ? (
            <WaitingPanel />
          ) : result ? (
            <ResultPanel result={result} />
          ) : (
            <EmptyPanel />
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Placeholder shown before an investigation has been submitted.
 */
function EmptyPanel() {
  return (
    <section className="primer" aria-labelledby="primer-title">
      <h2 id="primer-title">What a certified result requires</h2>
      <p>
        Two candidate runs must show the same issue-derived failure. A nearby
        negative control must not. Only the runtime may issue{" "}
        <em>reproduced</em> or <em>not reproduced</em>.
      </p>
      <ul className="roles">
        <li>
          <strong>Lamatic</strong>
          <span>Forms the hypothesis and picks probe commands.</span>
        </li>
        <li>
          <strong>Daytona</strong>
          <span>Hosts a private, time-bounded sandbox.</span>
        </li>
        <li>
          <strong>Isolate runtime</strong>
          <span>Asserts, records evidence, and owns the outcome.</span>
        </li>
      </ul>
    </section>
  );
}

/**
 * Progress placeholder shown while an investigation is running.
 */
function WaitingPanel() {
  return (
    <section className="waiting" aria-labelledby="waiting-title">
      <div className="waiting-pulse" aria-hidden />
      <h2 id="waiting-title">Isolation in progress</h2>
      <p>
        Usually one to three minutes. Progress is not streamed — this page
        updates when the full evidence set returns and the sandbox is gone.
      </p>
      <ol className="expected">
        {EXPECTED_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Completed investigation: hypothesis, outcome, evidence, and export actions.
 */
function ResultPanel({ result }: { result: Investigation }) {
  const reproduced = ["reproduced", "likely_reproduced"].includes(result.outcome);
  const exploratory = result.verdictOwner === "lamatic";
  const evidenceReviewHypothesis = result.hypothesisSource === "evidence_review";
  const outcomeLabel = result.outcome === "likely_reproduced"
    ? "Likely reproduced"
    : result.outcome === "inconclusive"
      ? "Inconclusive"
      : reproduced
        ? "Reproduced"
        : "Not reproduced";
  const repo = result.issue.repositoryUrl.replace("https://github.com/", "");

  return (
    <article className="result">
      <header className={`diagnosis ${reproduced ? "diagnosis-yes" : "diagnosis-no"}`}>
        <p className="diagnosis-word" role="status">
          {outcomeLabel}
        </p>
        <h2 className="diagnosis-title">{result.issue.title}</h2>
        <p className="diagnosis-meta">
          {exploratory ? "Lamatic evidence review" : "Runtime-certified"} · issue #{result.issue.number} · {result.ref} ·{" "}
          <a href={result.issue.url}>{repo}</a>
        </p>
      </header>

      <section className="block" aria-labelledby="hypothesis-title">
        <h3 id="hypothesis-title">
          {evidenceReviewHypothesis ? "Evidence review" : "Agent hypothesis"}
        </h3>
        <p className="block-note">
          {evidenceReviewHypothesis
            ? "Written by Lamatic after the runtime probes ran. Not certification."
            : "Preliminary. Written by Lamatic before the runtime probes ran. Not certification."}
        </p>
        <p className="hypothesis">{result.hypothesis}</p>
      </section>

      {result.analysis ? (
        <section className="block" aria-labelledby="report-title">
          <h3 id="report-title">Bug report</h3>
          <p className="block-note">AI interpretation of sandbox-recorded evidence. Not deterministic certification.</p>
          <p>{result.analysis.summary}</p>
          <h4>Expected</h4>
          <p>{result.analysis.expectedBehavior}</p>
          <h4>Actual</h4>
          <p>{result.analysis.actualBehavior}</p>
          <h4>Reproduction steps</h4>
          <ol>{result.analysis.reproductionSteps.map((step) => <li key={step}>{step}</li>)}</ol>
          <h4>Evidence</h4>
          <ul>{result.analysis.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
          {result.analysis.limitations.length ? <><h4>Limitations</h4><ul>{result.analysis.limitations.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
        </section>
      ) : null}

      {result.gate ? <section className="block" aria-labelledby="gate-title">
        <h3 id="gate-title">Evidence criteria</h3>
        <ul className="criteria">
          <li>
            <StatusGlyph
              ok={result.gate.allCandidateRunsPassed}
              label={
                result.gate.allCandidateRunsPassed
                  ? "Passed: "
                  : "Failed: "
              }
            />
            <span>Both candidate runs passed</span>
          </li>
          <li>
            <StatusGlyph
              ok={result.gate.controlRejected}
              label={
                result.gate.controlRejected ? "Passed: " : "Failed: "
              }
            />
            <span>Negative control rejected the assertion</span>
          </li>
          <li>
            <StatusGlyph
              ok={reproduced}
              label={reproduced ? "Passed: " : "Failed: "}
            />
            <span>Runtime issued a reproduced outcome</span>
          </li>
        </ul>
      </section> : null}

      <section className="block" aria-labelledby="findings-title">
        <h3 id="findings-title">Recorded findings</h3>
        <div className="findings">
          {result.evidence.candidateRuns.map((run, index) => (
            <Finding
              key={index}
              title={`Candidate run ${index + 1}`}
              run={run}
              expect={exploratory ? "observe" : "pass"}
            />
          ))}
          <Finding
            title="Negative control"
            run={result.evidence.controlRun}
            expect={exploratory ? "observe" : "reject"}
          />
        </div>
      </section>

      <footer className="export">
        <div>
          <p className="export-title">Take the evidence with you</p>
          <p className="export-note">Sandbox already deleted.</p>
        </div>
        <div className="export-actions">
          <button
            type="button"
            onClick={() =>
              download(
                "isolate-report.md",
                result.report.content,
                "text/markdown",
              )
            }
          >
            Markdown
          </button>
          <button
            type="button"
            onClick={() =>
              download(
                "isolate-report.json",
                JSON.stringify(result, null, 2),
                "application/json",
              )
            }
          >
            JSON
          </button>
        </div>
      </footer>
    </article>
  );
}
