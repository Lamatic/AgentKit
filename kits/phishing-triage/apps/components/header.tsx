import { ShieldAlert } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-none">Phishing Email Triage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste an email — get an explainable phishing-risk verdict. Powered by Lamatic AgentKit.
          </p>
        </div>
      </div>
    </header>
  )
}
