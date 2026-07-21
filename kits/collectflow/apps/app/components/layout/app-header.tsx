import { ArrowUpRight, BrainCircuit, Info } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-md transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-lg dark:from-slate-100 dark:to-white dark:text-slate-900">
            <BrainCircuit className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
          </div>

          <div className="leading-tight">
            <h1 className="animate-in fade-in slide-in-from-left-2 duration-700 text-base font-semibold tracking-tight">
              CollectFlow
            </h1>

            <p className="animate-in fade-in slide-in-from-left-2 fill-mode-both text-xs text-muted-foreground delay-150 duration-700">
              AI-native Collections Decision Engine
            </p>
          </div>
        </Link>

        <nav className="flex shrink-0 items-center gap-2">
          <a
            href="#how-it-works"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Info className="h-4 w-4" />
            <span>How it works</span>
          </a>

          <Link
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 min-w-[104px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span>AgentKit</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
