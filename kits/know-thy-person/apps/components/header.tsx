import Link from "next/link"
import { UserSearch, Github } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-black/10 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <UserSearch className="h-6 w-6 text-violet-600" />
          <span className="text-xl font-semibold tracking-tight text-zinc-900">
            Know Thy Person
          </span>
        </Link>
        <Link
          href="https://github.com/Lamatic/AgentKit/tree/main/kits/know-thy-person"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <Github className="h-4 w-4" />
          GitHub
        </Link>
      </div>
    </header>
  )
}
