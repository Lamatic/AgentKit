"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity, Check, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, CircleAlert, Clipboard,
  Clock3, Database, Gauge, Play, RotateCcw, ShieldAlert, ShieldCheck, Sparkles, Square, Upload, XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  MAX_QUERY_CHARACTERS,
  type RunMode,
  type StrategistExperimentEvidence,
  type TuningReport,
} from "../lib/contracts";
import { DEMO_QUERY } from "../lib/demo-database";

const queryFormSchema = z.object({
  query: z.string().trim().min(1, "Enter a SQL query.").max(
    MAX_QUERY_CHARACTERS,
    `Queries are limited to ${MAX_QUERY_CHARACTERS.toLocaleString()} characters.`,
  ),
});
type QueryFormValues = z.infer<typeof queryFormSchema>;

function milliseconds(value?: number): string {
  if (value === undefined) return "-";
  return `${value.toFixed(value < 10 ? 2 : 1)} ms`;
}

function countdownLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function verdictLabel(verdict: StrategistExperimentEvidence["verdict"]): string {
  return {
    improved: "Proven faster",
    slower: "Slower",
    "equivalent-noise": "No clear gain",
    "guard-rejected": "Guard rejected",
    "non-equivalent": "Results changed",
    "execution-failed": "Execution failed",
  }[verdict];
}

function VerdictIcon({ verdict }: { verdict: StrategistExperimentEvidence["verdict"] }) {
  if (verdict === "improved") return <CheckCircle2 size={14} />;
  if (verdict === "non-equivalent" || verdict === "execution-failed") return <XCircle size={14} />;
  if (verdict === "guard-rejected") return <ShieldAlert size={14} />;
  return <CircleAlert size={14} />;
}

function strategyLabel(strategy: StrategistExperimentEvidence["strategy"]): string {
  return {
    covering_index: "Covering index",
    filter_first_index: "Filter-first index",
    grouping_first_index: "Grouping-first index",
    partial_index: "Partial index",
    query_rewrite: "Query rewrite",
    revise_failed_candidate: "Revision",
  }[strategy];
}

function recommendationSql(report: TuningReport): string {
  return report.winner?.candidateSql ?? report.originalQuery;
}

function SqlBlock({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);

  async function copySql() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="sql-shell">
      <button className="copy-button" type="button" onClick={copySql} title="Copy SQL">
        {copied ? <Check size={14} /> : <Clipboard size={14} />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
      <pre className="sql-block"><code>{sql}</code></pre>
    </div>
  );
}

function SpeedComparison({ report }: { report: TuningReport }) {
  const baseline = report.baseline?.benchmark.medianMs;
  const candidate = report.winner?.benchmark?.medianMs;
  if (!baseline || !candidate) return null;
  const max = Math.max(baseline, candidate);
  return (
    <div className="speed-bars" aria-label="Median runtime comparison">
      <div>
        <span>Baseline</span>
        <div className="bar-track"><div style={{ width: `${Math.max(6, (baseline / max) * 100)}%` }} /></div>
        <strong>{milliseconds(baseline)}</strong>
      </div>
      <div>
        <span>Winner</span>
        <div className="bar-track bar-track-winner"><div style={{ width: `${Math.max(6, (candidate / max) * 100)}%` }} /></div>
        <strong>{milliseconds(candidate)}</strong>
      </div>
    </div>
  );
}

function Experiment({ experiment, winner }: { experiment: StrategistExperimentEvidence; winner: boolean }) {
  const [expanded, setExpanded] = useState(winner);
  const planDetails = experiment.plan?.map((step) => step.detail).filter(Boolean) ?? [];
  return (
    <article className={`experiment ${winner ? "experiment-winner" : ""}`}>
      <div className="experiment-head">
        <div className="experiment-index">{experiment.number}</div>
        <div>
          <p className="eyebrow">Lamatic strategist · {strategyLabel(experiment.strategy)}</p>
          <h3>{experiment.hypothesis}</h3>
        </div>
        <div className="experiment-actions">
          <span className={`verdict verdict-${experiment.verdict}`}><VerdictIcon verdict={experiment.verdict} />{verdictLabel(experiment.verdict)}</span>
          <button
            className="icon-button collapse-toggle"
            type="button"
            title={expanded ? "Collapse experiment" : "Expand experiment"}
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="experiment-body">
          {experiment.adaptation ? (
            <div className="strategy-note">
              <span>Strategy</span>
              <p>{experiment.adaptation.learnedFromEvidence}</p>
              <p>{experiment.adaptation.differsFromPrevious}</p>
            </div>
          ) : null}
          <SqlBlock sql={experiment.candidateSql} />
          <div className="experiment-metrics">
            <span><ShieldCheck size={15} /> {experiment.equivalence ? "Same results" : "Not verified"}</span>
            <span><Clock3 size={15} /> {milliseconds(experiment.benchmark?.medianMs)}</span>
            <span><Gauge size={15} /> {experiment.speedup ? `${experiment.speedup.toFixed(2)}x` : "-"}</span>
          </div>
          <div className="local-observation">
            <span>Deterministic local measurement</span>
            <p>{experiment.observation}</p>
          </div>
          {experiment.stopConditions?.length ? (
            <div className="stop-criteria">
              <span>Stop criteria supplied by strategist</span>
              <ul>
                {experiment.stopConditions.map((condition) => <li key={condition}>{condition}</li>)}
              </ul>
            </div>
          ) : null}
          <p className="experiment-summary">{experiment.summary}</p>
          {planDetails.length ? (
            <div className="plan-line"><ChevronRight size={15} /><code>{planDetails.join(" · ")}</code></div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function HomePage() {
  const queryForm = useForm<QueryFormValues>({
    resolver: zodResolver(queryFormSchema),
    defaultValues: { query: DEMO_QUERY },
  });
  const query = queryForm.watch("query");
  const [mode, setMode] = useState<RunMode>("demo");
  const [report, setReport] = useState<TuningReport | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [clockTick, setClockTick] = useState(0);
  const [databaseFile, setDatabaseFile] = useState<{ name: string; base64: string; size: number } | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const queryLines = Math.max(1, query.split("\n").length);
  const retrySeconds = rateLimitUntil
    ? Math.max(0, Math.ceil((rateLimitUntil - clockTick) / 1000))
    : 0;

  useEffect(() => {
    const savedMode = window.localStorage.getItem("sql-tuner-mode");
    if (savedMode === "demo" || savedMode === "live") setMode(savedMode);
  }, []);

  useEffect(() => {
    if (!rateLimitUntil) return undefined;
    setClockTick(Date.now());
    const timer = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [rateLimitUntil]);

  useEffect(() => {
    if (rateLimitUntil && retrySeconds === 0) setRateLimitUntil(null);
  }, [rateLimitUntil, retrySeconds]);

  async function selectDatabase(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 4 * 1024 * 1024) {
      setDatabaseFile(null);
      setReport(null);
      setError("SQLite uploads are limited to 4 MB.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    setDatabaseFile({ name: file.name, base64: window.btoa(binary), size: file.size });
    setReport(null);
  }

  async function runTuner(values: QueryFormValues) {
    if (retrySeconds > 0) return;
    const controller = new AbortController();
    abortController.current = controller;
    setRunning(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch("/api/tune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: values.query, mode, databaseBase64: databaseFile?.base64 }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as TuningReport;
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number.parseInt(response.headers.get("Retry-After") ?? "", 10);
          setRateLimitUntil(Date.now() + (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60) * 1000);
        }
        throw new Error(payload.conclusion || "The tuning run failed.");
      }
      setRateLimitUntil(null);
      setReport(payload);
    } catch (caught) {
      setError(caught instanceof DOMException && caught.name === "AbortError"
        ? "The request was cancelled."
        : caught instanceof Error ? caught.message : "The tuning run failed.");
    } finally {
      abortController.current = null;
      setRunning(false);
    }
  }

  function resetDemo() {
    queryForm.reset({ query: DEMO_QUERY });
    setReport(null);
    setError("");
    setDatabaseFile(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function selectMode(nextMode: RunMode) {
    setMode(nextMode);
    window.localStorage.setItem("sql-tuner-mode", nextMode);
    setReport(null);
    setError("");
  }

  function handleQueryKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !running && query.trim()) {
      event.preventDefault();
      void queryForm.handleSubmit(runTuner, (errors) => {
        setError(errors.query?.message ?? "Invalid query.");
      })();
    }
  }

  const completionMessage = report
    ? report.status === "improved"
      ? `Run complete. Experiment ${report.winner?.number ?? ""} is the measured winner.`
      : "Run complete. No proven improvement; keep the original query."
    : error
      ? retrySeconds > 0
        ? `Run failed. ${error} Retry in ${countdownLabel(retrySeconds)}.`
        : `Run failed. ${error}`
      : "";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><Activity size={19} /></div>
        <div className="brand-copy"><strong>SQL Performance Tuner</strong><span>SQLite experiment agent</span></div>
        <div className="runtime-status"><span /> Bounded sandbox</div>
      </header>

      <section className="workspace">
        <form
          className="editor-pane"
          onSubmit={queryForm.handleSubmit(runTuner, (errors) => {
            setError(errors.query?.message ?? "Invalid query.");
          })}
        >
          <div className="section-heading">
            <div><p className="eyebrow">Input</p><h1>Query workspace</h1></div>
            <button className="icon-button" type="button" title="Reset demo query" onClick={resetDemo}><RotateCcw size={17} /></button>
          </div>

          <div className="source-row">
            <label className="source-chip" title="Choose a SQLite database up to 4 MB">
              <Database size={16} />
              <span className="source-name">{databaseFile?.name ?? "commerce-demo.sqlite"}</span>
              <span>{databaseFile ? `${(databaseFile.size / 1024).toFixed(0)} KB` : "32k orders"}</span>
              <Upload size={14} />
              <input ref={fileInput} aria-label="Choose SQLite database" type="file" accept=".db,.sqlite,.sqlite3,application/vnd.sqlite3" onChange={(event) => selectDatabase(event.target.files?.[0])} />
            </label>
            <div className="mode-control" aria-label="Planner mode">
              <button type="button" disabled={running} className={mode === "demo" ? "active" : ""} onClick={() => selectMode("demo")}>Demo planner</button>
              <button type="button" disabled={running} className={mode === "live" ? "active" : ""} onClick={() => selectMode("live")}><Sparkles size={14} /> Live Lamatic</button>
            </div>
          </div>

          <label className="query-label" htmlFor="query">Read-only SQL</label>
          <div className="editor-wrap">
            <div className="line-number" aria-hidden="true">
              {Array.from({ length: queryLines }, (_, index) => <span key={index}>{index + 1}</span>)}
            </div>
            <textarea
              id="query"
              {...queryForm.register("query")}
              onKeyDown={handleQueryKeyDown}
              placeholder="Paste a SELECT query to optimize..."
              spellCheck={false}
              aria-label="SQL query"
            />
          </div>

          <div className="editor-footer">
            <div className="guard-list">
              <span><Check size={14} /> SELECT / WITH only</span>
              <span><Check size={14} /> Five experiments max</span>
              <span><Check size={14} /> Full result comparison</span>
              <span><Check size={14} /> Cmd+Enter runs</span>
            </div>
            <div className="run-actions">
              {running ? (
                <button className="cancel-button" type="button" onClick={() => abortController.current?.abort()}>
                  <Square size={15} fill="currentColor" /> Stop request
                </button>
              ) : null}
              <button className="run-button" type="submit" disabled={running || retrySeconds > 0 || !query.trim()}>
                {running ? <span className="spinner" /> : <Play size={17} fill="currentColor" />}
                {running ? "Running experiments" : retrySeconds > 0 ? `Retry in ${countdownLabel(retrySeconds)}` : "Run tuner"}
              </button>
            </div>
          </div>
          {running ? (
            <div className="progress-steps" aria-live="polite">
              <span className="active">Baseline</span>
              <span className="active">Strategist</span>
              <span className="active">Experiment</span>
              <span className="active">Reviewer</span>
            </div>
          ) : null}
          {completionMessage ? <div className="completion-toast" role="status" aria-live="polite">{completionMessage}</div> : null}
        </form>

        <aside className="summary-pane">
          <div className="section-heading">
            <div><p className="eyebrow">Run summary</p><h2>{report ? (report.status === "improved" ? "Improvement proven" : "Run complete") : "Awaiting run"}</h2></div>
            {report?.status === "improved" ? <div className="success-icon"><Check size={18} /></div> : null}
          </div>

          {!report && !error ? <div className="empty-state"><Gauge size={30} /><p>Run the query to measure its baseline and test bounded optimization experiments.</p></div> : null}
          {error ? (
            <div className="error-state">
              <CircleAlert size={20} />
              <p>{retrySeconds > 0 ? `${error} Retry in ${countdownLabel(retrySeconds)}.` : error}</p>
            </div>
          ) : null}

          {report?.baseline ? (
            <>
              <div className="headline-metric"><span>Best measured speedup</span><strong>{report.winner?.speedup ? `${report.winner.speedup.toFixed(2)}x` : "None"}</strong></div>
              <div className="metric-grid">
                <div><span>Baseline median</span><strong>{milliseconds(report.baseline.benchmark.medianMs)}</strong></div>
                <div><span>Candidate median</span><strong>{milliseconds(report.winner?.benchmark?.medianMs)}</strong></div>
                <div><span>Result rows</span><strong>{report.baseline.result.rowCount.toLocaleString()}</strong></div>
                <div><span>Experiments</span><strong>{report.experiments.length} / 5</strong></div>
              </div>
              <SpeedComparison report={report} />
              <div className="baseline-plan"><span>Baseline plan</span><code>{report.baseline.plan.map((step) => step.detail).filter(Boolean).join(" · ") || "No plan details returned"}</code></div>
              <p className="conclusion">{report.conclusion}</p>
            </>
          ) : null}
        </aside>
      </section>

      {report ? (
        <section className="results-band">
          <div className="results-inner">
            <div className="results-title"><div><p className="eyebrow">Evidence trail</p><h2>Experiments</h2></div><span>{report.experiments.length} evaluated</span></div>
            {report.experiments.length ? (
              <div className="experiment-list">{report.experiments.map((experiment) => <Experiment key={experiment.number} experiment={experiment} winner={report.winner?.number === experiment.number} />)}</div>
            ) : <p className="no-experiments">The planner concluded without proposing a candidate.</p>}
            {report.review ? (
              <section className="review-panel" aria-labelledby="review-heading">
                <div className="review-copy">
                  <p className="eyebrow">Lamatic reviewer explanation</p>
                  <h2 id="review-heading">{report.review.headline}</h2>
                  <p>{report.review.evidenceSummary}</p>
                </div>
                <div className="recommendation-block">
                  <span>{report.winner ? "Recommended candidate" : "Recommendation"}</span>
                  <p>{report.review.recommendation}</p>
                  <SqlBlock sql={recommendationSql(report)} />
                </div>
                <div className="review-meta">
                  <div>
                    <span>Reviewer cited</span>
                    <strong>{report.review.citedExperiments.length ? report.review.citedExperiments.map((number) => `#${number}`).join(", ") : "No experiment numbers"}</strong>
                  </div>
                  <div>
                    <span>Limitations</span>
                    <p>{report.review.limitations.length ? report.review.limitations.join(" ") : "No additional reviewer limitations returned."}</p>
                  </div>
                </div>
              </section>
            ) : null}
            {report.caveats.length ? <div className="caveats"><CircleAlert size={17} /><p>{report.caveats.join(" ")}</p></div> : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
