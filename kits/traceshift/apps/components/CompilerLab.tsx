"use client";

import {
  ArrowDownToLine,
  Check,
  FileCode2,
  FlaskConical,
  GitCompareArrows,
  Network,
  Play,
  ShieldCheck,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { analyzeTraceCsv } from "@/lib/analyze";
import {
  buildCacheBoundaryScript,
  buildOptimizationManifest,
  buildProposedFlowDiff,
} from "@/lib/artifacts";
import { runDeterministicCacheBenchmark } from "@/lib/benchmark";
import { demoFlowExport } from "@/lib/demo-flow";
import { generateDemoCsv } from "@/lib/demo-data";
import { compareTraceWindows } from "@/lib/drift";
import { mapFlowToReport, parseLamaticFlow } from "@/lib/flow-parser";
import type {
  AnalysisReport,
  FlowMapping,
  MappedFlowNode,
  OptimizationCandidate,
  WorkloadBenchmark,
} from "@/lib/types";

type HeatMode = "latency" | "cost" | "traffic";

const formatSeconds = (value: number) => `${value.toFixed(value >= 10 ? 1 : 2)}s`;
const formatMoney = (value: number) => `$${value.toFixed(value < 0.01 ? 4 : 2)}`;
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

const graphPosition = (node: MappedFlowNode) => ({
  x: 72 + (node.position.x / 880) * 850,
  y: 160 + node.position.y * 0.92,
});

function FlowHeatmap({ mapping, mode }: { mapping: FlowMapping; mode: HeatMode }) {
  const byId = new Map(mapping.nodes.map((node) => [node.id, node]));
  const maximum = Math.max(
    ...mapping.nodes.map((node) =>
      mode === "latency" ? node.totalSeconds : mode === "cost" ? node.totalCost : node.calls,
    ),
    1,
  );
  return (
    <svg className="flow-map" viewBox="0 0 1000 320" role="img" aria-label="Lamatic flow graph with observed trace heat">
      <defs>
        <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#5b5969" />
        </marker>
      </defs>
      {mapping.edges.filter((edge) => edge.type !== "responseEdge").map((edge) => {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (!source || !target) return null;
        const from = graphPosition(source);
        const to = graphPosition(target);
        return (
          <line
            key={edge.id}
            x1={from.x + 55}
            y1={from.y}
            x2={to.x - 55}
            y2={to.y}
            stroke={edge.observedRuns ? "#8270d9" : "#34333d"}
            strokeWidth={1.2 + edge.shareOfSuccessfulRuns * 5}
            opacity={edge.observedRuns ? 0.8 : 0.5}
            markerEnd="url(#flow-arrow)"
          >
            <title>{edge.observedRuns} observed successful runs</title>
          </line>
        );
      })}
      {mapping.nodes.map((node) => {
        const position = graphPosition(node);
        const value = mode === "latency" ? node.totalSeconds : mode === "cost" ? node.totalCost : node.calls;
        const intensity = node.match === "unmapped" ? 0 : Math.max(0.12, value / maximum);
        return (
          <g key={node.id} transform={`translate(${position.x - 55}, ${position.y - 27})`}>
            <rect
              width="110"
              height="54"
              rx="10"
              fill={node.match === "unmapped" ? "#15151b" : `rgba(124, 92, 255, ${0.1 + intensity * 0.5})`}
              stroke={node.match === "unmapped" ? "#33323c" : `rgba(180, 164, 255, ${0.35 + intensity * 0.6})`}
            />
            <text x="55" y="23" textAnchor="middle" fill="#dedce6" fontSize="9" fontWeight="600">
              {node.name.length > 17 ? `${node.name.slice(0, 16)}…` : node.name}
            </text>
            <text x="55" y="39" textAnchor="middle" fill="#8a8798" fontSize="7">
              {node.match === "unmapped"
                ? "not in trace window"
                : mode === "latency"
                  ? formatSeconds(node.totalSeconds)
                  : mode === "cost"
                    ? formatMoney(node.totalCost)
                    : `${node.calls} calls`}
            </text>
            <title>{node.id} · {node.nodeId} · {node.calls} calls · {formatSeconds(node.totalSeconds)} · {formatMoney(node.totalCost)}</title>
          </g>
        );
      })}
    </svg>
  );
}

export default function CompilerLab({
  report,
  selected,
}: {
  report: AnalysisReport;
  selected?: OptimizationCandidate;
}) {
  const [mapping, setMapping] = useState<FlowMapping>(() =>
    mapFlowToReport(parseLamaticFlow(demoFlowExport), report),
  );
  const [flowName, setFlowName] = useState("Synthetic Commerce Support flow export");
  const [flowError, setFlowError] = useState("");
  const [heatMode, setHeatMode] = useState<HeatMode>("latency");
  const [baseline, setBaseline] = useState<AnalysisReport>(() => analyzeTraceCsv(generateDemoCsv()));
  const [baselineName, setBaselineName] = useState("Synthetic baseline window");
  const [baselineError, setBaselineError] = useState("");
  const [benchmark, setBenchmark] = useState<WorkloadBenchmark | null>(null);
  const flowInput = useRef<HTMLInputElement>(null);
  const baselineInput = useRef<HTMLInputElement>(null);

  const refreshedMapping = useMemo(
    () => mapFlowToReport(mapping.graph, report),
    [mapping.graph, report],
  );
  const drift = useMemo(() => compareTraceWindows(baseline, report), [baseline, report]);
  const manifest = useMemo(
    () => selected ? buildOptimizationManifest(report, selected, refreshedMapping) : null,
    [report, selected, refreshedMapping],
  );
  const patch = manifest ? buildProposedFlowDiff(manifest) : "";
  const cacheScript = manifest ? buildCacheBoundaryScript(manifest) : null;

  const loadFlow = async (file: File) => {
    setFlowError("");
    if (!file.name.toLowerCase().endsWith(".ts")) {
      setFlowError("Choose a TypeScript flow exported from Lamatic Studio.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFlowError("The flow export is over 2 MB.");
      return;
    }
    try {
      const next = mapFlowToReport(parseLamaticFlow(await file.text()), report);
      setMapping(next);
      setFlowName(file.name);
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : "The flow export could not be parsed.");
    }
  };

  const loadBaseline = async (file: File) => {
    setBaselineError("");
    try {
      setBaseline(analyzeTraceCsv(await file.text()));
      setBaselineName(file.name);
    } catch (error) {
      setBaselineError(error instanceof Error ? error.message : "The baseline trace could not be parsed.");
    }
  };

  return (
    <>
      <section className="section-block compiler-section">
        <div className="section-heading">
          <div><span>02</span><h2>Trace-to-flow compiler</h2></div>
          <p>Real graph IDs · observed traffic · review-only patch artifacts</p>
        </div>
        <div className="compiler-grid">
          <article className="data-card graph-card">
            <div className="data-card-title">
              <div><Network size={17} /><strong>Flow topology and heat</strong></div>
              <div className="heat-tabs">
                {(["latency", "cost", "traffic"] as HeatMode[]).map((mode) => (
                  <button key={mode} className={heatMode === mode ? "active" : ""} onClick={() => setHeatMode(mode)}>{mode}</button>
                ))}
              </div>
            </div>
            <FlowHeatmap mapping={refreshedMapping} mode={heatMode} />
            <div className="graph-footer">
              <span><Check size={13} /> {refreshedMapping.mappedNodes}/{refreshedMapping.nodes.length} graph nodes matched</span>
              <span>{refreshedMapping.edges.filter((edge) => edge.observedRuns).length} observed edges</span>
            </div>
          </article>

          <article className="data-card compiler-control">
            <div className="data-card-title"><div><FileCode2 size={17} /><strong>Studio flow export</strong></div><small>TypeScript · local parse</small></div>
            <div className="compiler-body">
              <input ref={flowInput} type="file" accept=".ts,text/typescript" hidden onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void loadFlow(file);
              }} />
              <div className="source-file"><FileCode2 size={18} /><div><strong>{flowName}</strong><small>{refreshedMapping.graph.sourceFingerprint}</small></div></div>
              <button className="button ghost wide" onClick={() => flowInput.current?.click()}><Upload size={14} /> Upload flow export</button>
              {flowError && <p className="inline-error"><TriangleAlert size={13} /> {flowError}</p>}
              <div className="mapping-summary">
                <span><strong>{refreshedMapping.mappedNodes}</strong> mapped</span>
                <span><strong>{refreshedMapping.unmappedFlowNodes.length}</strong> graph-only</span>
                <span><strong>{refreshedMapping.unmappedTraceNodes.length}</strong> trace-only</span>
              </div>
              <p className="control-note"><ShieldCheck size={13} /> The parser reads JSON-compatible Studio arrays and never evaluates uploaded TypeScript.</p>
            </div>
          </article>
        </div>

        {selected && manifest && (
          <article className="artifact-card">
            <div>
              <span className="panel-label">COMPILED REVIEW PACKAGE</span>
              <h3>{selected.title}</h3>
              <p>Targeted to <code>{manifest.candidate.targetNodeId ?? "unmapped node"}</code>. The package describes a proposed change but cannot import, deploy, or overwrite the source flow.</p>
            </div>
            <div className="artifact-actions">
              <button className="button ghost" onClick={() => download("traceshift-optimization-manifest.json", JSON.stringify(manifest, null, 2), "application/json")}><ArrowDownToLine size={14} /> Manifest</button>
              <button className="button ghost" onClick={() => download("traceshift-proposed-flow.diff", patch, "text/plain")}><ArrowDownToLine size={14} /> Flow diff</button>
              {cacheScript && <button className="button ghost" onClick={() => download("traceshift-cache-boundary.ts", cacheScript, "text/typescript")}><ArrowDownToLine size={14} /> Code artifact</button>}
            </div>
          </article>
        )}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><span>03</span><h2>Replay, drift and measured proof</h2></div>
          <p>Historical cache simulation · two-window comparison · real CPU benchmark</p>
        </div>
        <div className="proof-grid">
          <article className="data-card replay-card">
            <div className="data-card-title"><div><FlaskConical size={17} /><strong>Historical cache replay</strong></div><small>chronological · exact key</small></div>
            {selected?.backtest ? (
              <div className="proof-body">
                <div className={`proof-status ${selected.backtest.passed ? "passed" : "failed"}`}><ShieldCheck size={15} /> {selected.backtest.passed ? "Passed all replay gates" : "Blocked by replay gates"}</div>
                <div className="proof-kpis">
                  <div><small>Measured hits</small><strong>{selected.backtest.cacheHits}</strong></div>
                  <div><small>Mismatches</small><strong>{selected.backtest.outputMismatches}</strong></div>
                  <div><small>Measured saved</small><strong>{formatSeconds(selected.backtest.latencySavedSeconds)}</strong></div>
                  <div><small>Hit rate</small><strong>{formatPercent(selected.backtest.hitRate)}</strong></div>
                </div>
                <p>{formatSeconds(selected.backtest.baselineLatencySeconds)} historical node time replayed as {formatSeconds(selected.backtest.replayLatencySeconds)} using a 5ms lookup cost.</p>
              </div>
            ) : <div className="proof-empty">Select an exact-cache candidate to run historical replay evidence.</div>}
          </article>

          <article className="data-card drift-card">
            <div className="data-card-title"><div><GitCompareArrows size={17} /><strong>Window drift</strong></div><small>{baselineName} → current</small></div>
            <div className="proof-body">
              <input ref={baselineInput} type="file" accept=".csv,text/csv" hidden onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void loadBaseline(file);
              }} />
              <button className="button ghost compact" onClick={() => baselineInput.current?.click()}><Upload size={13} /> Replace baseline CSV</button>
              {baselineError && <p className="inline-error"><TriangleAlert size={13} /> {baselineError}</p>}
              <div className="drift-metrics">
                {drift.metrics.slice(0, 3).map((item) => (
                  <div key={item.name}><span>{item.name}</span><strong className={item.direction}>{item.percentDelta === null ? "n/a" : `${item.percentDelta >= 0 ? "+" : ""}${formatPercent(item.percentDelta)}`}</strong></div>
                ))}
              </div>
              <div className="signal-list">
                {drift.signals.slice(0, 3).map((signal) => <p key={signal.id}><span className={signal.severity} /> <strong>{signal.title}</strong><small>{signal.detail}</small></p>)}
                {drift.signals.length === 0 && <p><Check size={13} /><strong>No material drift detected</strong></p>}
              </div>
            </div>
          </article>

          <article className="data-card benchmark-card">
            <div className="data-card-title"><div><Play size={17} /><strong>Before/after benchmark</strong></div><small>same workload · same outputs</small></div>
            <div className="proof-body">
              <button className="button primary wide" onClick={() => setBenchmark(runDeterministicCacheBenchmark())}><Play size={14} /> Run reproducible benchmark</button>
              {benchmark ? (
                <>
                  <div className="benchmark-result"><strong>{benchmark.speedup}×</strong><span>measured speedup</span></div>
                  <div className="benchmark-lines">
                    <p><span>Calls</span><strong>{benchmark.baselineCalls} → {benchmark.optimizedCalls}</strong></p>
                    <p><span>Runtime</span><strong>{benchmark.baselineMilliseconds}ms → {benchmark.optimizedMilliseconds}ms</strong></p>
                    <p><span>Output agreement</span><strong>{formatPercent(benchmark.outputAgreement)}</strong></p>
                  </div>
                </>
              ) : <p className="benchmark-note">Executes 240 deterministic lookups twice: once normally, then with an exact-input cache. Timings are measured on this device.</p>}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
