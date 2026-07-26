import Link from "next/link";
import Image from "next/image";
import { FileText, Github } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lamatic-logo-azWF3QdrlPsL1hXo285W1A2AQo2Vg9.png"
                alt="Lamatic logo"
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </span>
            <h1 className="select-none text-xl font-bold tracking-tight">
              <span className="text-slate-800 dark:text-slate-100">Lamatic</span>
              <span className="text-rose-500"> Release Notes</span>
            </h1>
          </div>
        </Link>
        <nav className="flex gap-3">
          <Link
            href="https://lamatic.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm transition-colors hover:bg-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:hover:bg-sky-900/60"
          >
            <FileText className="h-4 w-4" />
            Docs
          </Link>
          <Link
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </nav>
      </div>
    </header>
  );
}
