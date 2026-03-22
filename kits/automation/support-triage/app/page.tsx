"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Copy, Check, RotateCcw } from "lucide-react"
import { executeSupportTriage } from "@/actions/orchestrate"
import { Header } from "@/components/header"

type TriageResult = {
  category: string
  severity: string
  priority_reason: string
  possible_duplicate: boolean
  recommended_owner: string
  sla_risk: boolean
  escalation_summary: string
}

const defaultForm = {
  ticket_text: "",
  customer_tier: "enterprise",
  channel: "email",
  created_at: "",
  past_ticket_context: "",
}

export default function SupportTriagePage() {
  const [form, setForm] = useState(defaultForm)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TriageResult | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.ticket_text.trim()) {
      setError("Please provide a support ticket description.")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)
    setCopied(false)

    try {
      const response = await executeSupportTriage({
        ...form,
        created_at: form.created_at || new Date().toISOString(),
      })

      if (response.success) {
        setResult(response.result ?? null)
      } else {
        setError(response.error || "Triage failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setForm(defaultForm)
    setError("")
    setCopied(false)
  }

  const handleCopy = async () => {
    const textToCopy = JSON.stringify(result, null, 2)

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const setField = (field: keyof typeof defaultForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 text-foreground">
      <Header />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_380px] xl:gap-10">
          <div className="space-y-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-normal leading-none tracking-tight text-balance sm:text-6xl">
                Support
                <br />
                Triage Agent
              </h1>
              <p className="mt-5 max-w-xl text-xl leading-9 text-muted-foreground">
                Turn raw support requests into a structured triage result with severity, owner guidance, duplicate
                hints, and an escalation summary.
              </p>
            </div>

            <Card className="max-w-2xl p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ticket_text">Ticket Text</Label>
                  <Textarea
                    id="ticket_text"
                    placeholder="Describe the support issue, affected users, and business impact..."
                    value={form.ticket_text}
                    onChange={(e) => setField("ticket_text", e.target.value)}
                    className="min-h-[220px] resize-none"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customer_tier">Customer Tier</Label>
                    <Select value={form.customer_tier} onValueChange={(value) => setField("customer_tier", value)}>
                      <SelectTrigger id="customer_tier" className="h-12">
                        <SelectValue placeholder="Select customer tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="channel">Channel</Label>
                    <Select value={form.channel} onValueChange={(value) => setField("channel", value)}>
                      <SelectTrigger id="channel" className="h-12">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="chat">Chat</SelectItem>
                        <SelectItem value="web-form">Web Form</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="created_at">Created At</Label>
                  <Input
                    id="created_at"
                    type="datetime-local"
                    value={form.created_at}
                    onChange={(e) => setField("created_at", e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="past_ticket_context">Past Ticket Context</Label>
                  <Textarea
                    id="past_ticket_context"
                    placeholder="Include similar incidents, outage context, or recent related tickets..."
                    value={form.past_ticket_context}
                    onChange={(e) => setField("past_ticket_context", e.target.value)}
                    className="min-h-[120px] resize-none"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!form.ticket_text.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Triaging...
                      </>
                    ) : (
                      "Run Triage"
                    )}
                  </Button>
                  <Button type="button" variant="outline" className="h-12 px-5 bg-transparent" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="lg:pt-[2px]">
            <Card className="sticky top-8 p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Triage Result</h2>
                {result && (
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 bg-transparent">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>

              {!result ? (
                <div className="rounded-lg border border-dashed p-6 text-sm leading-7 text-muted-foreground">
                  Submit a ticket to see the structured triage response.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="text-muted-foreground mb-1">Category</div>
                      <div className="font-medium">{result.category}</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="text-muted-foreground mb-1">Severity</div>
                      <div className="font-medium capitalize">{result.severity}</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="text-muted-foreground mb-1">Possible Duplicate</div>
                      <div className="font-medium">{String(result.possible_duplicate)}</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="text-muted-foreground mb-1">SLA Risk</div>
                      <div className="font-medium">{String(result.sla_risk)}</div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Priority Reason</div>
                    <div className="text-sm">{result.priority_reason}</div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Recommended Owner</div>
                    <div className="text-sm">{result.recommended_owner}</div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Escalation Summary</div>
                    <div className="text-sm whitespace-pre-wrap">{result.escalation_summary}</div>
                  </div>

                  <pre className="text-xs whitespace-pre-wrap break-words font-mono rounded-lg bg-slate-950 text-slate-100 p-4 overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
