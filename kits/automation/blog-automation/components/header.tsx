import Link from "next/link"
import { FileText, Github, Zap } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-white/10 px-6 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="group flex items-center gap-3 transition-transform hover:scale-[1.02]">
          <h1 className="text-2xl font-bold tracking-tight select-none flex items-center gap-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">Blog</span>
            <span className="text-rose-500 flex items-center gap-1">
              Automation
              <Zap className="w-4 h-4 fill-current animate-pulse" />
            </span>
          </h1>
        </Link>
        <div className="flex gap-4">
          <Link
            href="https://lamatic.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm border border-slate-200 dark:border-slate-700 font-medium"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documentation</span>
            <span className="sm:hidden">Docs</span>
          </Link>
          <Link
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-white/20 transition-all flex items-center gap-2 font-medium"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </div>
    </header>
  )
}
