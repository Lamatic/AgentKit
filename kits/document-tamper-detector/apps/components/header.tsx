import Link from "next/link"
import { Shield, Github, FileText } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-slate-800/60 px-6 py-4 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Shield className="w-5 h-5 text-slate-950" />
              </div>
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 blur-sm" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                Document<span className="text-amber-400"> Tamper Detector</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Powered by Lamatic AgentKit</p>
            </div>
          </div>
        </Link>
        <div className="flex gap-3">
          <Link
            href="https://lamatic.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5 border border-slate-700/50"
          >
            <FileText className="h-3.5 w-3.5" />
            Docs
          </Link>
          <Link
            href="https://github.com/Taukeer1256/AgentKit/tree/main/kits/document-tamper-detector"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all flex items-center gap-1.5 border border-amber-500/20"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </Link>
        </div>
      </div>
    </header>
  )
}
