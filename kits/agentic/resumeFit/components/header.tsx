import Link from "next/link"
import { Github, Sparkles } from "lucide-react"
import Image from "next/image"

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-200">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">

        {/* LEFT: LOGO + BRAND */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lamatic-logo-azWF3QdrlPsL1hXo285W1A2AQo2Vg9.png"
              alt="Lamatic Logo"
              width={36}
              height={36}
              className="rounded-md"
            />
            <div className="absolute inset-0 rounded-md bg-indigo-500/20 blur-md opacity-0 group-hover:opacity-100 transition" />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-slate-800">
              Lamatic AI
            </span>
            <span className="text-xs text-muted-foreground">
              Resume Screener
            </span>
          </div>
        </Link>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-3">

          {/* AI Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            AI Powered
          </div>

          {/* GitHub Button */}
          <Link
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </div>
    </header>
  )
}