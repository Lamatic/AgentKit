import { getRunDetails } from "../../../actions/orchestrate";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { notFound } from "next/navigation";

export default async function ReportPage({
  params,
}: {
  params: { runId: string };
}) {
  const details = await getRunDetails(params.runId);
  
  if (!details) {
    notFound();
  }

  const { run, diff } = details;
  
  const passCount = run.cases.filter((c) => c.passed).length;
  const totalCount = run.cases.length;
  const allPassed = passCount === totalCount;
  const noBlockingRegressions = diff.blockingRegressions.length === 0;
  
  // Calculate P50
  const validLatencies = run.cases.filter(c => c.latencyMs > 0).map(c => c.latencyMs).sort((a, b) => a - b);
  const p50 = validLatencies.length > 0 ? validLatencies[Math.floor(validLatencies.length / 2)] : null;

  return (
    <main className="max-w-6xl mx-auto py-12 px-6">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Run Report
            <span className="text-sm font-normal text-slate-500 font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              {run.runId}
            </span>
          </h1>
          <p className="text-slate-400">
            Flow ID: <span className="font-mono text-slate-300">{run.flowId}</span>
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 min-w-[120px]">
            <div className="text-sm text-slate-400 mb-1">Pass Rate</div>
            <div className={`text-2xl font-bold ${allPassed ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalCount === 0 ? "—" : `${Math.round((passCount / totalCount) * 100)}%`}
            </div>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 min-w-[120px]">
            <div className="text-sm text-muted-foreground mb-1">Latency p50</div>
            <div className="text-2xl font-bold text-foreground">
              {p50 !== null ? `${p50}ms` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Baseline Status */}
      <div className={`mb-12 p-6 rounded-xl border ${
        allPassed && noBlockingRegressions 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
          : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
      }`}>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
          {allPassed && noBlockingRegressions ? (
            <><CheckCircle className="w-5 h-5" /> Baseline Status: Clean Run</>
          ) : (
            <><AlertTriangle className="w-5 h-5" /> Baseline Status: Regressions Detected</>
          )}
        </h2>
        <p className="opacity-90">
          {allPassed && noBlockingRegressions 
            ? "This run had no blocking regressions and updated the baseline if it was the most recent run."
            : "This run had blocking regressions (failures or similarity drops) and did not update the baseline."}
        </p>
        
        {diff.regressions.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="font-medium">Detected Regressions:</div>
            <ul className="list-disc pl-5 space-y-1">
              {diff.regressions.map((reg, i) => {
                const parts = [];
                if (reg.latency.regressed) {
                  parts.push(`latency: ${reg.latency.baseline.toFixed(0)}ms → ${reg.latency.current.toFixed(0)}ms (+${reg.latency.pctChange.toFixed(0)}%)`);
                }
                if (reg.similarity?.regressed) {
                  parts.push(`similarity: ${reg.similarity.baseline.toFixed(4)} → ${reg.similarity.current.toFixed(4)} (${reg.similarity.delta.toFixed(4)})`);
                }
                if (reg.passChange === "new_failure") {
                  parts.push("new failure (was passing)");
                }
                return (
                  <li key={i} className="opacity-90">
                    <span className="font-mono text-red-300 mr-2">{reg.id}:</span>
                    {parts.join(", ")}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        {diff.improvements.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="font-medium text-emerald-400">Detected Improvements:</div>
            <ul className="list-disc pl-5 space-y-1">
              {diff.improvements.map((imp, i) => {
                const parts = [];
                if (imp.latency.improved) {
                  parts.push(`latency: ${imp.latency.baseline.toFixed(0)}ms → ${imp.latency.current.toFixed(0)}ms (${imp.latency.pctChange.toFixed(0)}%)`);
                }
                if (imp.similarity?.improved) {
                  parts.push(`similarity: ${imp.similarity.baseline.toFixed(4)} → ${imp.similarity.current.toFixed(4)} (+${imp.similarity.delta.toFixed(4)})`);
                }
                if (imp.passChange === "new_pass") {
                  parts.push("now passing (was failing)");
                }
                return (
                  <li key={i} className="text-emerald-400/90">
                    <span className="font-mono text-emerald-300 mr-2">{imp.id}:</span>
                    {parts.join(", ")}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Test Cases Table */}
      <h3 className="text-xl font-semibold mb-6 text-slate-200">Test Cases</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80">
              <th className="p-4 text-sm font-medium text-slate-400">ID</th>
              <th className="p-4 text-sm font-medium text-slate-400">Status</th>
              <th className="p-4 text-sm font-medium text-slate-400">Latency</th>
              <th className="p-4 text-sm font-medium text-slate-400">Similarity</th>
              <th className="p-4 text-sm font-medium text-slate-400 w-1/3">Output / Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {run.cases.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-mono text-sm text-slate-300 align-top">
                  {c.id}
                </td>
                <td className="p-4 align-top">
                  {c.passed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5" /> PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                      <XCircle className="w-3.5 h-3.5" /> FAIL
                    </span>
                  )}
                </td>
                <td className="p-4 text-slate-300 align-top">
                  {c.latencyMs}ms
                </td>
                <td className="p-4 text-slate-300 align-top">
                  {c.similarity !== null ? c.similarity.toFixed(4) : "—"}
                </td>
                <td className="p-4 align-top">
                  {c.error ? (
                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg whitespace-pre-wrap">
                      {c.error}
                    </div>
                  ) : (
                    <div className="text-slate-300 text-sm bg-slate-950 border border-slate-800 p-3 rounded-lg whitespace-pre-wrap">
                      {c.output}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
