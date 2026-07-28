"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { analyzeIncident } from "@/actions/orchestrate"

const SAMPLE_LOGS = `2026-07-17T14:02:11Z ERROR [payments-service] Connection pool exhausted: timeout waiting for connection (waited 30000ms)
2026-07-17T14:02:15Z ERROR [payments-service] Connection pool exhausted: timeout waiting for connection (waited 30000ms)
2026-07-17T14:03:02Z WARN [payments-service] Retrying request, attempt 3/5
2026-07-17T14:03:45Z ERROR [checkout-service] Upstream payments-service returned 504
2026-07-17T14:01:58Z INFO [deploy-bot] Deployed payments-service v2.14.1`

export default function IncidentPostmortemPage() {
  const [logs, setLogs] = useState("")
  const [serviceName, setServiceName] = useState("")
  const [recentDeployTime, setRecentDeployTime] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleLoadExample = () => {
    setLogs(SAMPLE_LOGS)
    setServiceName("payments-service")
    setRecentDeployTime("2026-07-17T14:01:58Z")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logs.trim()) {
      setError("Please paste some logs")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await analyzeIncident(logs, serviceName, recentDeployTime)
      if (response.success && response.data) {
        setResult(response.data)
      } else {
        setError(response.error || "Analysis failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setLogs("")
    setServiceName("")
    setRecentDeployTime("")
    setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold mb-3 text-gray-900 dark:text-white">
            Incident Postmortem Pipeline
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Paste raw incident logs and get ranked root causes, a mitigation checklist,
            a stakeholder update, and a postmortem draft.
          </p>
        </div>

        {!result && (
          <div className="bg-white/90 dark:bg-gray-900/90 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleLoadExample}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Load example
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  Service name (optional)
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. payments-service"
                  className="w-full h-11 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  Recent deploy time (optional)
                </label>
                <input
                  type="text"
                  value={recentDeployTime}
                  onChange={(e) => setRecentDeployTime(e.target.value)}
                  placeholder="e.g. 2026-07-17T14:01:58Z"
                  className="w-full h-11 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  Raw logs
                </label>
                <textarea
                  value={logs}
                  onChange={(e) => setLogs(e.target.value)}
                  placeholder="Paste raw incident logs here..."
                  className="w-full min-h-[220px] p-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 font-mono text-sm resize-none"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!logs.trim() || isLoading}
                className="w-full h-12 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium"
              >
                {isLoading ? "Analyzing..." : "Investigate"}
              </button>
            </form>
          </div>
        )}

        {result && (
          <div className="bg-white/90 dark:bg-gray-900/90 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
            <div className="prose prose-sm dark:prose-invert max-w-none mb-6 text-gray-900 dark:text-gray-100">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            <button
              onClick={handleReset}
              className="w-full h-12 rounded-md border border-gray-300 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100"
            >
              Analyze another incident
            </button>
          </div>
        )}
      </div>
    </div>
  )
}