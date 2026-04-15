import Link from "next/link"
import { FileText, Github } from "lucide-react"
import Image from "next/image"

export function Header() {
  return (
    <header className="border-b border-stone-200 px-6 py-4 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lamatic-logo-azWF3QdrlPsL1hXo285W1A2AQo2Vg9.png"
              alt="Lamatic Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h1 className="text-2xl font-bold tracking-tight select-none">
              <span className="text-slate-800">Lamatic</span>
              <span className="text-amber-700"> Legal Assistant</span>
            </h1>
          </div>
        </Link>
        <div className="flex gap-4">
          <Link
            href="https://lamatic.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-stone-100 text-stone-800 rounded-md hover:bg-stone-200 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Docs
          </Link>
          <Link
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </div>
    </header>
  )
}
