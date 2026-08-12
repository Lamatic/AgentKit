"use client";

import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Binary,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  FileSearch,
  Gauge,
  GitBranch,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UploadCloud,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { requestAdvisorProposal } from "@/actions/orchestrate";
import { analyzeTraceCsv } from "@/lib/analyze";
import { generateDemoCsv } from "@/lib/demo-data";
import type {
  AdvisorProposal,
  AnalysisReport,
  CandidateType,
  OptimizationCandidate,
} from "@/lib/types";

const formatSeconds = (value: number) => `${value.toFixed(value >= 10 ? 1 : 2)}s`;
const formatMoney = (value: number) => `$${value.toFixed(value < 0.01 ? 4 : 2)}`;
const formatPercent = (value: number) => `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`;

const candidateLabel: Record<CandidateType, string> = {
  "exact-cache": "Exact-input cache",
  "deterministic-code": "Code-node candidate",
  "model-rightsize": "Model benchmark",
  "reusable-subflow": "Reusable subflow",
};

function CandidateIcon({ type }: { type: CandidateType }) {
  if (type === "exact-cache") return <Database size={17} />;
  if (type === "deterministic-code") return <Binary size={17} />;
  if (type === "model-rightsize") return <Gauge size={17} />;
  return <Workflow size={17} />;
}

function confidenceClass(confidence: OptimizationCandidate["confidence"]) {
  return confidence === "high" ? "confidence-high" : confidence === "medium" ? "confidence-medium" : "confidence-low";
}

function buildMarkdown(report: AnalysisReport): string {
  const lines = [
    "# TraceShift optimization report",
    "",
    `- Workflows: ${report.source.workflowNames.join(", ")}`,
    `- Requests: ${report.source.requests}`,
    `- Successful runs: ${report.metrics.successfulRuns}`,
    `- p50 / p95: ${report.metrics.p50Seconds}s / ${report.metrics.p95Seconds}s`,
    `- Recorded tokens: ${report.metrics.totalTokens}`,
    `- Recorded cost: $${report.metrics.totalCost.toFixed(6)}`,
    "",
    "## Ranked opportunities",
    "",
  ];
  report.candidates.forEach((candidate, index) => {
    lines.push(
      `### ${index + 1}. ${candidate.title}`,
      "",
      candidate.summary,
      "",
      `**Confidence:** ${candidate.confidence} · **Score:** ${candidate.score}/100`,
      "",
      ...candidate.evidence.map((item) => `- ${item}`),
      "",
      "Scenario estimates (not measured post-change):",
      "",
      `- Latency: ${candidate.estimatedWindowLatencySavingsSeconds}s in the uploaded window`,
      `- Cost: $${candidate.estimatedWindowCostSavings.toFixed(6)} in the uploaded window`,
      "",
      "Validation gates:",
      "",
      ...candidate.validationPlan.map((item) => `- ${item}`),
      "",
    );
  });
  return lines.join("\n");
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function TraceShiftWorkbench() {
  const [report, setReport] = useState<AnalysisReport>(() => analyzeTraceCsv(generateDemoCsv()));
  const [selectedId, setSelectedId] = useState<string>(() => report.candidates[0]?.id ?? "");
  const [sourceName, setSourceName] = useState("Synthetic proof set · 32 requests");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [goal, setGoal] = useState("Reduce latency and model cost without changing output behavior");
  const [advisor, setAdvisor] = useState<AdvisorProposal | null>(null);
  const [advisorError, setAdvisorError] = useState("");
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => report.candidates.find((candidate) => candidate.id === selectedId) ?? report.candidates[0],
    [report, selectedId],
  );

  const analyzeFile = async (file: File) => {
    setError("");
    setAdvisor(null);
    setAdvisorError("");
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Choose a CSV exported from Lamatic Traces.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("This file is over 5 MB. Export a smaller production window.");
      return;
    }
    try {
      const nextReport = analyzeTraceCsv(await file.text());
      setReport(nextReport);
      setSelectedId(nextReport.candidates[0]?.id ?? "");
      setSourceName(`${file.name} · ${nextReport.source.requests} requests`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The CSV could not be analyzed.");
    }
  };

  const loadDemo = () => {
    const demo = analyzeTraceCsv(generateDemoCsv());
    setReport(demo);
    setSelectedId(demo.candidates[0]?.id ?? "");
    setSourceName("Synthetic proof set · 32 requests");
    setError("");
    setAdvisor(null);
    setAdvisorError("");
  };

  const selectCandidate = (candidate: OptimizationCandidate) => {
    setSelectedId(candidate.id);
    setAdvisor(null);
    setAdvisorError("");
  };

  const askAdvisor = async () => {
    if (!selected) return;
    setAdvisorLoading(true);
    setAdvisorError("");
    const result = await requestAdvisorProposal(selected, goal);
    if (result.ok) setAdvisor(result.proposal);
    else setAdvisorError(result.error);
    setAdvisorLoading(false);
  };

  const topSavings = Math.max(
    ...report.candidates.map((candidate) => candidate.estimatedWindowLatencySavingsSeconds),
    0,
  );
  const maxNodeSeconds = Math.max(...report.nodes.map((node) => node.totalSeconds), 1);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="TraceShift home">
          <span className="brand-mark"><GitBranch size={18} /></span>
          <span>TraceShift</span>
        </a>
        <div className="topbar-center"><span className="pulse-dot" /> Production trace intelligence</div>
        <div className="review-badge"><ShieldCheck size={14} /> Review-only</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> TRACE → EVIDENCE → OPTIMIZATION</div>
          <h1>Find the expensive pattern<br />hiding in successful runs.</h1>
          <p>
            TraceShift mines Lamatic production traces for repeated paths, stable outputs, and model hotspots—then turns the strongest signal into a proposal an engineer can verify.
          </p>
          <div className="hero-proof">
            <span><Check size={14} /> Groups by <code>requestId</code></span>
            <span><Check size={14} /> No raw payloads sent to the advisor</span>
            <span><Check size={14} /> No automatic flow mutation</span>
          </div>
        </div>

        <div
          className={`dropzone ${dragging ? "is-dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void analyzeFile(file);
          }}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void analyzeFile(file);
            }}
          />
          <span className="upload-icon"><UploadCloud size={25} /></span>
          <strong>Drop a Lamatic trace CSV</strong>
          <span>or choose an export up to 5 MB</span>
          <button className="button primary" onClick={() => fileInput.current?.click()}>Choose CSV</button>
          <button className="text-button" onClick={loadDemo}><RefreshCw size={13} /> Reload proof set</button>
          <div className="privacy-note"><LockKeyhole size={13} /> Analysis stays in this browser; only aggregate evidence reaches Lamatic.</div>
        </div>
      </section>

      <section className="workspace">
        <div className="source-strip">
          <div>
            <span className="source-status"><span className="pulse-dot" /> ANALYZED</span>
            <strong>{sourceName}</strong>
          </div>
          <div className="source-actions">
            <button className="button ghost" onClick={() => download("traceshift-report.json", JSON.stringify(report, null, 2), "application/json")}>
              <ArrowDownToLine size={15} /> JSON
            </button>
            <button className="button ghost" onClick={() => download("traceshift-report.md", buildMarkdown(report), "text/markdown")}>
              <ArrowDownToLine size={15} /> Markdown
            </button>
          </div>
        </div>

        {error && <div className="error-banner"><X size={16} /> {error}</div>}
        {report.warnings.length > 0 && (
          <div className="warning-row">
            {report.warnings.map((warning) => <span key={warning}><TriangleAlert size={13} /> {warning}</span>)}
          </div>
        )}

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-icon violet"><Activity size={18} /></span>
            <div><small>Successful runs</small><strong>{report.metrics.successfulRuns}<em> / {report.source.requests}</em></strong></div>
            <span className="metric-foot positive">{formatPercent(report.metrics.successRate)} usable</span>
          </article>
          <article className="metric-card">
            <span className="metric-icon blue"><Clock3 size={18} /></span>
            <div><small>Flow latency</small><strong>{formatSeconds(report.metrics.p95Seconds)}</strong></div>
            <span className="metric-foot">p95 · p50 {formatSeconds(report.metrics.p50Seconds)}</span>
          </article>
          <article className="metric-card">
            <span className="metric-icon amber"><CircleDollarSign size={18} /></span>
            <div><small>Recorded model use</small><strong>{formatMoney(report.metrics.totalCost)}</strong></div>
            <span className="metric-foot">{report.metrics.totalTokens.toLocaleString()} tokens</span>
          </article>
          <article className="metric-card opportunity">
            <span className="metric-icon green"><Zap size={18} /></span>
            <div><small>Top savings scenario</small><strong>{formatSeconds(topSavings)}</strong></div>
            <span className="metric-foot positive">uploaded window · estimate</span>
          </article>
        </div>

        <section className="section-block">
          <div className="section-heading">
            <div><span>01</span><h2>Ranked opportunities</h2></div>
            <p>{report.candidates.length} evidence-backed candidates · strongest first</p>
          </div>

          {report.candidates.length === 0 ? (
            <div className="empty-state"><FileSearch size={28} /><strong>No defensible optimization yet</strong><p>Upload at least 10 successful runs with node inputs, outputs, and durations.</p></div>
          ) : (
            <div className="opportunity-layout">
              <div className="candidate-list">
                {report.candidates.map((candidate, index) => (
                  <button
                    key={candidate.id}
                    className={`candidate-card ${selected?.id === candidate.id ? "selected" : ""}`}
                    onClick={() => selectCandidate(candidate)}
                  >
                    <span className="candidate-rank">0{index + 1}</span>
                    <div className="candidate-main">
                      <div className="candidate-kind"><CandidateIcon type={candidate.type} /> {candidateLabel[candidate.type]}</div>
                      <strong>{candidate.title}</strong>
                      <p>{candidate.summary}</p>
                      <div className="candidate-meta">
                        <span className={confidenceClass(candidate.confidence)}>{candidate.confidence} confidence</span>
                        <span>{candidate.affectedRuns} runs</span>
                        <span>{formatSeconds(candidate.measuredLatencySeconds)} observed</span>
                      </div>
                    </div>
                    <div className="score-ring" style={{ "--score": `${candidate.score * 3.6}deg` } as React.CSSProperties}>
                      <span>{candidate.score}</span>
                    </div>
                    <ChevronRight size={17} className="candidate-arrow" />
                  </button>
                ))}
              </div>

              {selected && (
                <article className="evidence-panel">
                  <div className="panel-label">SELECTED EVIDENCE PACK</div>
                  <h3>{selected.title}</h3>
                  <p className="panel-summary">{selected.summary}</p>

                  <div className="evidence-kpis">
                    <div><small>Recurrence</small><strong>{formatPercent(selected.recurrenceRate)}</strong></div>
                    <div><small>Output stability</small><strong>{selected.outputStability === null ? "n/a" : formatPercent(selected.outputStability)}</strong></div>
                    <div><small>Observed cost</small><strong>{formatMoney(selected.measuredCost)}</strong></div>
                  </div>

                  <div className="evidence-list">
                    <h4>Why it surfaced</h4>
                    {selected.evidence.map((item) => <p key={item}><Check size={14} /> {item}</p>)}
                  </div>

                  <div className="estimate-box">
                    <span><Zap size={15} /> SCENARIO, NOT A MEASUREMENT</span>
                    <div>
                      <strong>−{formatSeconds(selected.estimatedWindowLatencySavingsSeconds)}</strong>
                      <small>latency in uploaded window</small>
                    </div>
                    <div>
                      <strong>−{formatMoney(selected.estimatedWindowCostSavings)}</strong>
                      <small>cost in uploaded window</small>
                    </div>
                  </div>

                  <details>
                    <summary>Assumptions & safety gates <ChevronRight size={14} /></summary>
                    <div className="details-body">
                      {selected.assumptions.map((item) => <p key={item}>{item}</p>)}
                      <strong>Known risk</strong>
                      <p>{selected.risk}</p>
                    </div>
                  </details>
                </article>
              )}
            </div>
          )}
        </section>

        <section className="section-block advisor-section">
          <div className="section-heading">
            <div><span>02</span><h2>Lamatic proposal reviewer</h2></div>
            <p>Aggregate evidence in · structured implementation brief out</p>
          </div>
          <div className="advisor-grid">
            <div className="advisor-control">
              <div className="advisor-title"><span><Bot size={20} /></span><div><strong>TraceShift Advisor</strong><small>Instructor LLM · grounded mode</small></div></div>
              <label htmlFor="goal">Optimization goal</label>
              <textarea id="goal" value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={240} />
              <button className="button primary wide" onClick={() => void askAdvisor()} disabled={!selected || advisorLoading}>
                {advisorLoading ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
                {advisorLoading ? "Reviewing evidence…" : "Generate reviewable proposal"}
              </button>
              <p className="control-note"><LockKeyhole size={13} /> Sends aggregate metrics, assumptions, and risks—not raw trace payloads or fingerprints.</p>
              {advisorError && <div className="advisor-error"><TriangleAlert size={15} /> <span>{advisorError}<small>The deterministic analysis above still works without credentials.</small></span></div>}
            </div>

            <div className="proposal-card">
              {advisor ? (
                <>
                  <div className="proposal-top"><span className="source-status"><span className="pulse-dot" /> GENERATED</span><span className={`confidence-pill ${advisor.confidence}`}>{advisor.confidence} confidence</span></div>
                  <h3>{advisor.title}</h3>
                  <p>{advisor.recommendation}</p>
                  <blockquote>{advisor.rationale}</blockquote>
                  <h4>Validation gates</h4>
                  <ol>{advisor.validationPlan.map((item) => <li key={item}>{item}</li>)}</ol>
                  <div className="approval-line"><ShieldCheck size={16} /> Human approval required before implementation</div>
                </>
              ) : selected ? (
                <>
                  <div className="proposal-top"><span className="draft-badge">DETERMINISTIC PREVIEW</span><span className={confidenceClass(selected.confidence)}>{selected.confidence} confidence</span></div>
                  <h3>{selected.title}</h3>
                  <p>{selected.summary}</p>
                  <h4>Minimum validation gates</h4>
                  <ol>{selected.validationPlan.map((item) => <li key={item}>{item}</li>)}</ol>
                  <div className="approval-line"><ShieldCheck size={16} /> No production change is performed by TraceShift</div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div><span>03</span><h2>Path and node evidence</h2></div>
            <p>Successful production behavior, grouped—not guessed</p>
          </div>
          <div className="evidence-grid">
            <article className="data-card paths-card">
              <div className="data-card-title"><div><Workflow size={17} /><strong>Repeated paths</strong></div><small>share of successful runs</small></div>
              <div className="paths-list">
                {report.paths.slice(0, 5).map((path, index) => (
                  <div className="path-row" key={path.signature}>
                    <div className="path-top"><span>PATH {String(index + 1).padStart(2, "0")}</span><strong>{formatPercent(path.shareOfSuccessfulRuns)}</strong></div>
                    <div className="path-nodes">
                      {path.nodes.map((node, nodeIndex) => (
                        <span key={`${node}-${nodeIndex}`}><em>{node}</em>{nodeIndex < path.nodes.length - 1 && <ArrowRight size={12} />}</span>
                      ))}
                    </div>
                    <div className="path-bar"><span style={{ width: `${path.shareOfSuccessfulRuns * 100}%` }} /></div>
                    <small>{path.successRuns} successful · p95 {formatSeconds(path.p95Seconds)}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="data-card node-card">
              <div className="data-card-title"><div><Gauge size={17} /><strong>Node hotspots</strong></div><small>successful runs only</small></div>
              <div className="node-table" role="table" aria-label="Node hotspots">
                <div className="node-table-head" role="row"><span>Node</span><span>Calls</span><span>Time</span><span>Cost</span></div>
                {report.nodes.slice(0, 7).map((node) => (
                  <div className="node-table-row" role="row" key={node.name}>
                    <div><strong>{node.name}</strong><span className="mini-bar"><i style={{ width: `${(node.totalSeconds / maxNodeSeconds) * 100}%` }} /></span></div>
                    <span>{node.calls}</span>
                    <span>{formatSeconds(node.totalSeconds)}</span>
                    <span>{formatMoney(node.cost)}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <footer>
          <div className="brand"><span className="brand-mark"><GitBranch size={16} /></span><span>TraceShift</span></div>
          <p>Production evidence for safer Lamatic flow optimization.</p>
          <span>Metrics are observed. Savings are scenarios. Changes require review.</span>
        </footer>
      </section>
    </main>
  );
}
