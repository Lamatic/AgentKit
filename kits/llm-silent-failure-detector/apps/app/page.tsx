"use client"

import { useState } from "react"
import { detectSilentFailures, type DetectionReport, type LogEntry } from "@/actions/orchestrate"

const SAMPLE_LOGS: LogEntry[] = [
  {
    id: "sample_1",
    prompt: "How large is the Amazon rainforest?",
    context:
      "The Amazon rainforest is the largest tropical rainforest in the world, spanning multiple South American countries.",
    response:
      "The Amazon rainforest covers approximately 5.5 million square kilometers and loses about 11,000 square kilometers annually according to a 2023 NASA satellite report.",
    expected_schema: {},
  },
  {
    id: "sample_2",
    prompt: "What is the capital of France?",
    context: "France is a country in Western Europe. Its capital city is Paris, which is also its largest city.",
    response: "The capital of France is Paris.",
    expected_schema: {},
  },
]

export default function Page() {
  const [logsText, setLogsText] = useState(JSON.stringify(SAMPLE_LOGS, null, 2))
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<DetectionReport | null>(null)
  const [error, setError] = useState("")

  const handleRun = async () => {
    setError("")
    setReport(null)

    let parsed: unknown
    try {
      parsed = JSON.parse(logsText)
      if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array of log objects.")
    } catch (e) {
      setError(e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON input.")
      return
    }

    setIsLoading(true)
    const result = await detectSilentFailures(parsed)
    setIsLoading(false)

    if (result.success) {
      setReport(result.data)
    } else {
      setError(result.error)
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 md:px-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 border-b border-neutral-800 pb-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-amber-500">
            AgentKit Challenge — Lamatic.ai
          </p>
          <h1 className="text-2xl font-semibold text-neutral-100 md:text-3xl">LLM Silent Failure Detector</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Paste a batch of LLM interaction logs below. Each log is checked for ungrounded claims and schema
            violations, and flagged failures are clustered into named failure modes with suggested fixes.
          </p>
        </header>

        <section className="mb-8">
          <label htmlFor="logs" className="mb-2 block font-mono text-xs uppercase tracking-wide text-neutral-500">
            Log batch (JSON array)
          </label>
          <textarea
            id="logs"
            value={logsText}
            onChange={(e) => setLogsText(e.target.value)}
            rows={12}
            spellCheck={false}
            className="w-full rounded border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-300 outline-none focus:border-amber-600"
          />

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="rounded bg-amber-600 px-5 py-2 text-sm font-medium text-neutral-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Analyzing..." : "Run detection"}
            </button>
            {error && <p className="font-mono text-xs text-red-400">{error}</p>}
          </div>
        </section>

        {report && (
          <section className="border-t border-neutral-800 pt-8">
            <div className="mb-8 grid grid-cols-3 gap-4">
              <Stat label="Total logs" value={report.summary.total_logs} />
              <Stat label="Flagged" value={report.summary.flagged} accent />
              <Stat label="Failure modes" value={report.summary.clusters} />
            </div>

            {report.failure_modes.length === 0 ? (
              <p className="font-mono text-sm text-neutral-500">No failures detected in this batch.</p>
            ) : (
              <div className="space-y-4">
                {report.failure_modes.map((mode, i) => (
                  <article key={i} className="rounded border border-neutral-800 bg-neutral-950 p-5">
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <h3 className="font-medium text-neutral-100">{mode.name}</h3>
                      <span className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 font-mono text-xs text-neutral-400">
                        {mode.count} {mode.count === 1 ? "log" : "logs"}
                      </span>
                    </div>
                    <p className="mb-3 text-sm leading-relaxed text-neutral-400">{mode.description}</p>
                    <p className="mb-3 font-mono text-xs text-neutral-600">
                      examples: {mode.examples.join(", ")}
                    </p>
                    <div className="border-l-2 border-amber-700 pl-3">
                      <p className="text-xs leading-relaxed text-amber-500/90">{mode.suggested_direction}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-950 p-4">
      <p className="mb-1 font-mono text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? "text-amber-500" : "text-neutral-100"}`}>{value}</p>
    </div>
  )
}
