import Link from "next/link"
import Image from "next/image"

export function Header() {
  return (
    <header className="border-b border-neutral-100 px-8 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/lamatic-logo.png"
            alt="Lamatic"
            width={28}
            height={28}
            className="w-7 h-7 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="text-lg font-medium tracking-tight text-neutral-900">
            Lamatic <span className="text-neutral-400 font-light mx-1">/</span> <span className="font-serif italic text-neutral-700">Reddit Scout</span>
          </span>
        </Link>
        <nav className="flex items-center gap-8">
          <Link
            href="https://lamatic.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors duration-200 tracking-wide"
          >
            Docs
          </Link>
          <Link
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors duration-200 tracking-wide"
          >
            GitHub
          </Link>
        </nav>
      </div>
    </header>
  )
}
