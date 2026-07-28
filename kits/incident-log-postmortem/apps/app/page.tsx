"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { analyzeIncident } from "@/actions/orchestrate"

const SAMPLE_LOGS = `2026-07-17T14:02:11Z ERROR [payments-service] Connection pool exhausted: timeout waiting for connection (waited 30000ms)
2026-07-17T14:02:15Z ERROR [payments-service] Connection pool exhausted: timeout waiting for connection (waited 30000ms)
2026-07-17T14:03:02Z WARN [payments-service] Retrying request, attempt 3/5
2026-07-17T14:03:45Z ERROR [checkout-service] Upstream payments-service returned 504
2026-07-17T14:01:58Z INFO [deploy-bot] Deployed payments-service v2.14.1`

const formSchema = z.object({
  serviceName: z.string().optional(),
  recentDeployTime: z.string().optional(),
  logs: z.string().min(1, "Please paste some logs"),
})

type FormValues = z.infer<typeof formSchema>

export default function IncidentPostmortemPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: "",
      recentDeployTime: "",
      logs: "",
    },
  })

  const handleLoadExample = () => {
    setValue("logs", SAMPLE_LOGS)
    setValue("serviceName", "payments-service")
    setValue("recentDeployTime", "2026-07-17T14:01:58Z")
  }

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await analyzeIncident(
        values.logs,
        values.serviceName ?? "",
        values.recentDeployTime ?? ""
      )
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
    setError("")
    reset()
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold mb-3 text-foreground">
            Incident Postmortem Pipeline
          </h1>
          <p className="text-lg text-muted-foreground">
            Paste raw incident logs and get ranked root causes, a mitigation checklist,
            a stakeholder update, and a postmortem draft.
          </p>
        </div>

        {!result && (
          <div className="bg-card text-card-foreground rounded-xl shadow-xl border border-border p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleLoadExample}
                  className="text-sm text-link hover:underline"
                >
                  Load example
                </button>
              </div>

              <div className="space-y-2">
                <label htmlFor="service-name" className="text-sm font-medium text-foreground">
                  Service name (optional)
                </label>
                <input
                  id="service-name"
                  type="text"
                  placeholder="e.g. payments-service"
                  className="w-full h-11 px-3 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                  {...register("serviceName")}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="recent-deploy-time" className="text-sm font-medium text-foreground">
                  Recent deploy time (optional)
                </label>
                <input
                  id="recent-deploy-time"
                  type="text"
                  placeholder="e.g. 2026-07-17T14:01:58Z"
                  className="w-full h-11 px-3 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                  {...register("recentDeployTime")}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="raw-logs" className="text-sm font-medium text-foreground">
                  Raw logs
                </label>
                <textarea
                  id="raw-logs"
                  placeholder="Paste raw incident logs here..."
                  className="w-full min-h-[220px] p-3 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground font-mono text-sm resize-none"
                  disabled={isLoading}
                  {...register("logs")}
                />
                {errors.logs && (
                  <p className="text-sm text-destructive-foreground">{errors.logs.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive-bg border border-destructive-border rounded-md">
                  <p className="text-sm text-destructive-foreground">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-medium"
              >
                {isLoading ? "Analyzing..." : "Investigate"}
              </button>
            </form>
          </div>
        )}

        {result && (
          <div className="bg-card text-card-foreground rounded-xl shadow-xl border border-border p-8">
            <div className="prose prose-sm dark:prose-invert max-w-none mb-6 text-card-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
            <button
              onClick={handleReset}
              className="w-full h-12 rounded-md border border-border font-medium text-card-foreground"
            >
              Analyze another incident
            </button>
          </div>
        )}
      </div>
    </div>
  )
}