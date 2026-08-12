import { ArrowRight, LoaderCircle } from "lucide-react";
import type { PipelineNodeState } from "@/lib/pipeline";

type PipelineExecutionProps = {
  nodes: PipelineNodeState[];
};

export default function PipelineExecution({
  nodes,
}: PipelineExecutionProps) {
  return (
    <section className="panel-strong mt-6 overflow-hidden rounded-[22px] border border-slate-200/90">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <h2 className="text-[1.15rem] font-bold tracking-[-0.03em] text-slate-950">
          Pipeline Execution
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Four sequential AgentKit orchestration nodes.
        </p>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {nodes.map((node, index) => (
            <div
              key={node.id}
              className="flex flex-1 items-center gap-3"
            >
              <article className="min-h-[88px] flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <p className="code-font text-[11px] uppercase tracking-[0.08em] text-slate-500">
                    {node.label}
                  </p>
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px]",
                      node.status === "COMPLETED"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : node.status === "RUNNING"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                              : node.status === "ERROR"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-white text-slate-500",
                    ].join(" ")}
                  >
                    {node.status === "RUNNING" ? (
                      <LoaderCircle className="h-3 w-3 animate-spin" />
                    ) : null}
                    {node.status}
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-5 text-slate-900">
                  {node.title}
                </p>
                <p className="mt-2 min-h-5 text-xs text-slate-500">
                  {node.summary ?? ""}
                </p>
              </article>

              {index < nodes.length - 1 ? (
                <div
                  className={[
                    "hidden h-full items-center xl:flex",
                    node.status === "COMPLETED"
                      ? "text-emerald-400"
                      : node.status === "RUNNING"
                        ? "text-blue-400"
                        : "text-slate-300",
                  ].join(" ")}
                >
                  <ArrowRight className="h-4 w-4" />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <p className="code-font mt-4 text-[11px] text-slate-500">
          Visual execution indicator for the pipeline run.
        </p>
      </div>
    </section>
  );
}
