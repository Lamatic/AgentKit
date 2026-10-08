import { Circle, Database, Workflow } from "lucide-react";

export default function Header() {
  return (
    <header className="panel-strong soft-ring overflow-hidden rounded-[26px] border border-slate-200/80">
      <div className="flex flex-col gap-4 px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 shadow-sm">
            <Database className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-[1.05rem] font-extrabold tracking-[-0.035em] text-slate-900 sm:text-[1.15rem]">
                Production Database Release Planner
              </h1>
              <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                <Workflow className="h-3.5 w-3.5" />
                Lamatic AgentKit Pipeline
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Analyze. Plan. Release Safely.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full px-1 py-1 text-sm font-medium text-slate-500 lg:self-center">
          <Circle className="h-3 w-3 fill-emerald-600 text-emerald-600" />
          <span>Pipeline Ready</span>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </header>
  );
}
