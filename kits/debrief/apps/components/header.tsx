import Link from "next/link";

export function Header() {
  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-slate-900">Debrief</span>
            <span className="text-muted-foreground font-normal"> — interview feedback summarizer</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link
            href="https://lamatic.ai/docs"
            target="_blank"
            className="hover:text-foreground hover:underline"
          >
            Lamatic Docs
          </Link>
          <span className="text-border">|</span>
          <Link
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            className="hover:text-foreground hover:underline"
          >
            AgentKit
          </Link>
        </div>
      </div>
    </header>
  );
}
