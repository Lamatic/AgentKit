"use client"

import { useState, useRef, useEffect } from "react"
import { askQuestion, type QueryResultRow } from "@/actions/orchestrate"

type Message = {
  role: "user" | "assistant"
  content: string
  chartType?: string
  sql?: string
  results?: QueryResultRow[]
  error?: boolean
}

const SAMPLE_QUESTIONS = [
  "How many trips happened this year?",
  "What's the average fare by vehicle type?",
  "Which pickup city has the most cancellations?",
]

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function BarChart({ results }: { results: QueryResultRow[] }) {
  if (!results || results.length === 0) return null

  const keys = Object.keys(results[0])
  const labelKey = keys[0]
  const valueKey = keys.find((k) => k !== labelKey) ?? keys[1]

  if (!valueKey) return null

  const numericRows = results
    .map((row) => ({
      label: String(row[labelKey] ?? ""),
      value: Number(row[valueKey]) || 0,
    }))
    .slice(0, 15) // cap bars shown so long result sets stay readable

  const max = Math.max(...numericRows.map((r) => r.value), 1)

  return (
    <div className="mt-4 space-y-2">
      {numericRows.map((row, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <div className="w-32 truncate text-muted-foreground" title={row.label}>
            {row.label}
          </div>
          <div className="flex-1 bg-border/30 rounded h-5 overflow-hidden">
            <div
              className="bg-primary h-full rounded"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <div className="w-16 text-right tabular-nums text-card-foreground">
            {row.value.toLocaleString()}
          </div>
        </div>
      ))}
      {results.length > numericRows.length && (
        <p className="text-xs text-muted-foreground pt-1">
          Showing top {numericRows.length} of {results.length} rows.
        </p>
      )}
    </div>
  )
}

function ResultsTable({ results }: { results: QueryResultRow[] }) {
  if (!results || results.length === 0) return null
  const keys = Object.keys(results[0])
  const rows = results.slice(0, 20)

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {keys.map((k) => (
              <th key={k} className="text-left py-2 px-3 font-medium text-muted-foreground">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              {keys.map((k) => (
                <td key={k} className="py-2 px-3 text-card-foreground">
                  {String(row[k] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {results.length > rows.length && (
        <p className="text-xs text-muted-foreground pt-2">
          Showing 20 of {results.length} rows.
        </p>
      )}
    </div>
  )
}

export default function RideHailingAnalyticsPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState("")
  const [showSql, setShowSql] = useState<Record<number, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  // Session id is generated client-side on mount so each browser tab/session
  // gets its own memory scope in the flow's session table.
  useEffect(() => {
    setSessionId(generateSessionId())
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendQuestion = async (question: string) => {
    if (!question.trim() || isLoading || !sessionId) return

    setMessages((prev) => [...prev, { role: "user", content: question }])
    setInput("")
    setIsLoading(true)

    try {
      const response = await askQuestion(question, sessionId)

      if (response.success && response.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.data!.answer,
            chartType: response.data!.chartType,
            sql: response.data!.sql,
            results: response.data!.results,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.error || "Something went wrong.", error: true },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "An error occurred",
          error: true,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendQuestion(input)
  }

  const handleNewSession = () => {
    setMessages([])
    setSessionId(generateSessionId())
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ride-Hailing Analytics Assistant</h1>
          <p className="text-sm text-muted-foreground">Ask about trips, fares, cities, and more — 2026 data</p>
        </div>
        <button
          onClick={handleNewSession}
          className="text-sm text-link hover:underline"
          disabled={messages.length === 0}
        >
          New session
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Try asking:</p>
              <div className="flex flex-col gap-2 items-center">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendQuestion(q)}
                    className="text-sm px-4 py-2 rounded-full border border-border hover:bg-card text-card-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <div key={i} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-user-bubble text-user-bubble-foreground"
                    : message.error
                    ? "bg-destructive-bg border border-destructive-border text-destructive-foreground"
                    : "bg-assistant-bubble text-assistant-bubble-foreground border border-border"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {message.role === "assistant" && !message.error && message.results && message.results.length > 0 && (
                  <>
                    {message.chartType === "bar" ? (
                      <BarChart results={message.results} />
                    ) : (
                      <ResultsTable results={message.results} />
                    )}
                  </>
                )}

                {message.role === "assistant" && !message.error && message.sql && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowSql((prev) => ({ ...prev, [i]: !prev[i] }))}
                      className="text-xs text-link hover:underline"
                    >
                      {showSql[i] ? "Hide SQL" : "Show SQL"}
                    </button>
                    {showSql[i] && (
                      <pre className="mt-2 text-xs bg-background/50 border border-border rounded p-3 overflow-x-auto whitespace-pre-wrap">
                        {message.sql}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-assistant-bubble border border-border rounded-xl px-4 py-3 text-muted-foreground text-sm">
                Thinking...
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </main>

      <form onSubmit={handleSubmit} className="border-t border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about ride-hailing trips..."
            disabled={isLoading || !sessionId}
            className="flex-1 h-12 px-4 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !sessionId}
            className="h-12 px-6 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-medium"
          >
            {isLoading ? "..." : "Ask"}
          </button>
        </div>
      </form>
    </div>
  )
}
