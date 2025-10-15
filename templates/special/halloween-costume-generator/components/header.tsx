import Link from "next/link"
import { FileText, Github } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-orange-900/30 px-6 py-4 bg-slate-950">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold tracking-tight select-none">
            <span className="text-white">Agent-Kit-Halloween</span>
            <span className="text-orange-500"> Costume-Generator</span>
          </h1>
        </Link>
        <div className="flex gap-4">
          <Link
            href="https://lamatic.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <FileText className="h-4 w-4" />
            Docs
          </Link>
          <Link
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-900 text-white rounded-md hover:bg-purple-800 transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </div>
    </header>
  )
}
