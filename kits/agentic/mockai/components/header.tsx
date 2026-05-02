import Link from "next/link"
import { Sparkles } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-indigo-100 px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="group flex items-center gap-3 transition-opacity">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-200 group-hover:shadow-md group-hover:shadow-indigo-300 transition-all duration-300 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight select-none bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
            Mockai
          </h1>
        </Link>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-slate-50 text-slate-600 text-sm font-medium rounded-full border border-slate-200 shadow-sm flex items-center">
            Interview Prep Area
          </div>
        </div>
      </div>
    </header>
  )
}
