import { getRunsHistory } from "../actions/orchestrate";
import RunForm from "../components/RunForm";
import Link from "next/link";
import { Activity, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function HomePage() {
  const runs = await getRunsHistory();

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          FlowBench
        </h1>
        <p className="text-lg text-slate-400">
          Automated regression testing and quality benchmarking for Lamatic flows.
        </p>
      </div>

      <RunForm />

      <div>
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-200">
          <Activity className="w-5 h-5 text-cyan-400" />
          Recent Runs
        </h2>
        
        {runs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
            <p className="text-slate-500">No previous runs found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => {
              const passCount = run.cases.filter((c) => c.passed).length;
              const totalCount = run.cases.length;
              const allPassed = passCount === totalCount;
              
              const avgLatency = Math.round(
                run.cases.reduce((acc, curr) => acc + curr.latencyMs, 0) / (totalCount || 1)
              );

              const date = new Date(run.timestamp);

              return (
                <Link
                  key={run.runId}
                  href={`/report/${run.runId}`}
                  className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {allPassed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                          {run.runId}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {date.toLocaleString()}
                        </span>
                        <span>•</span>
                        <span className="font-mono">{run.flowId.slice(0, 8)}...</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <div className="text-slate-400 mb-1">Pass Rate</div>
                        <div className={`font-semibold ${allPassed ? "text-emerald-400" : "text-red-400"}`}>
                          {Math.round((passCount / totalCount) * 100)}% ({passCount}/{totalCount})
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-slate-400 mb-1">Avg Latency</div>
                        <div className="font-semibold text-slate-200">{avgLatency}ms</div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
