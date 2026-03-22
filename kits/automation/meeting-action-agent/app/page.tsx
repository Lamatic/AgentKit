"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Loader2,
  Sparkles,
  ClipboardList,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Mail,
  FileText,
} from "lucide-react"
import { analyzeMeeting } from "@/actions/orchestrate"
import ReactMarkdown from "react-markdown"
import { Header } from "@/components/header"

type Priority = "High" | "Medium" | "Low"

type ActionItem = {
  task: string
  owner: string
  deadline: string
  priority: Priority
}

type MeetingResult = {
  decisions: string[]
  action_items: ActionItem[]
  summary_report: string
  followup_email: string
}

const priorityColors: Record<Priority, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
  Medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
  Low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
}

const SAMPLE_NOTES = `Team Sync - March 21, 2026

Attendees: Alice (PM), Bob (Backend), Carol (Design), Dave (Frontend)

Alice: We need to launch the new onboarding flow by April 5th. Agreed?
All: Yes, that works.

Bob: The API integration is done. Still need Carol to finish the UI mockups.
Carol: I'll have the mockups ready by March 25th.
Dave: Once I have the mockups I can build it in 3 days.

Alice: Bob, can you also write unit tests for the new endpoints?
Bob: Sure, I'll add those by March 28th.

Alice: Dave, please also update the README with the new setup steps.
Dave: Will do, I'll get that done by March 26th.

Decision: We will use Stripe for payments instead of PayPal.
Decision: The beta will be invite-only for the first 2 weeks.`

export default function MeetingAgentPage() {
  const [meetingNotes, setMeetingNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MeetingResult | null>(null)
  const [rawResult, setRawResult] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedReport, setCopiedReport] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingNotes.trim()) {
      setError("Please paste your meeting notes first.")
      return
    }
    setIsLoading(true)
    setError("")
    setResult(null)
    setRawResult(null)

    try {
      const response = await analyzeMeeting(meetingNotes)
      console.log("[page] Full response:", JSON.stringify(response))

      if (response.success) {
        if (response.data) {
          // Best case: structured data parsed correctly
          setResult(response.data)
        } else if (response.rawResult) {
          // rawResult may be a string or an object — try to extract data from it
          const raw = response.rawResult as any
          if (typeof raw === "object" && raw !== null) {
            // It's already a parsed object — check nested shapes
            const inner = raw?.result ?? raw
            if (inner?.decisions || inner?.action_items) {
              setResult({
                decisions: Array.isArray(inner.decisions) ? inner.decisions : [],
                action_items: Array.isArray(inner.action_items)
                  ? inner.action_items.map((item: any) => ({
                      task: item.task ?? "",
                      owner: item.owner ?? "Unassigned",
                      deadline: item.deadline ?? "TBD",
                      priority:
                        (["High", "Medium", "Low"].includes(
                          (item.priority ?? "").charAt(0).toUpperCase() +
                            (item.priority ?? "").slice(1).toLowerCase(),
                        )
                          ? (item.priority ?? "").charAt(0).toUpperCase() +
                            (item.priority ?? "").slice(1).toLowerCase()
                          : "Medium") as "High" | "Medium" | "Low",
                    }))
                  : [],
                summary_report: inner.summary_report ?? "",
                followup_email: inner.followup_email ?? "",
              })
            } else {
              setRawResult(JSON.stringify(raw, null, 2))
            }
          } else {
            setRawResult(String(raw))
          }
        }
      } else {
        setError(response.error || "Analysis failed. Please try again.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setRawResult(null)
    setMeetingNotes("")
    setError("")
    setCopiedEmail(false)
    setCopiedReport(false)
  }

  const handleCopyEmail = async () => {
    if (!result?.followup_email) return
    await navigator.clipboard.writeText(result.followup_email)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const handleCopyReport = async () => {
    if (!result?.summary_report) return
    await navigator.clipboard.writeText(result.summary_report)
    setCopiedReport(true)
    setTimeout(() => setCopiedReport(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 text-foreground">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Input form — shown when no result yet */}
        {!result && !rawResult && (
          <div className="flex items-start justify-center pt-10">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <ClipboardList className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <h1 className="text-5xl font-normal mb-3 text-balance">Meeting Action Agent</h1>
                <p className="text-xl text-muted-foreground">
                  Paste your meeting notes and instantly get prioritized action items, decisions, and a follow-up email.
                </p>
              </div>

              <Card className="p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="meetingNotes" className="text-sm font-medium">
                      Meeting Notes or Transcript
                    </label>
                    <Textarea
                      id="meetingNotes"
                      placeholder="Paste your raw meeting notes, transcript, or summary here..."
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      className="min-h-[260px] resize-none font-mono text-sm"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setMeetingNotes(SAMPLE_NOTES)}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-primary transition-colors"
                    >
                      Load sample meeting notes
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!meetingNotes.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Analyzing meeting notes...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze Meeting
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}

        {/* Results */}
        {(result || rawResult) && (
          <div className="pt-8 space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-normal mb-1">Meeting Analysis</h1>
              <p className="text-muted-foreground">Here's what your AI assistant extracted from the meeting.</p>
            </div>

            {/* Raw fallback */}
            {rawResult && !result && (
              <Card className="p-6 bg-white/90 dark:bg-gray-900/90 shadow-xl">
                <h2 className="text-lg font-semibold mb-3">Raw Output</h2>
                <pre className="text-sm whitespace-pre-wrap break-words font-mono text-muted-foreground">{rawResult}</pre>
              </Card>
            )}

            {result && (
              <>
                {/* Decisions */}
                {result.decisions.length > 0 && (
                  <Card className="p-6 bg-white/90 dark:bg-gray-900/90 shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">Key Decisions</h2>
                    </div>
                    <ul className="space-y-2">
                      {result.decisions.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1 shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {i + 1}
                          </span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Action Items */}
                {result.action_items.length > 0 && (
                  <Card className="p-6 bg-white/90 dark:bg-gray-900/90 shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                      <ClipboardList className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">Action Items</h2>
                    </div>
                    <div className="space-y-3">
                      {result.action_items.map((item, i) => (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-muted/40 border"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.task}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.owner || "Unassigned"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.deadline || "No deadline"}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${priorityColors[item.priority as Priority] ?? priorityColors["Medium"]}`}
                          >
                            {item.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Summary Report */}
                {result.summary_report && (
                  <Card className="p-6 bg-white/90 dark:bg-gray-900/90 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Meeting Summary</h2>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyReport} className="gap-2 bg-transparent">
                        {copiedReport ? (
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
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary">
                      <ReactMarkdown>{result.summary_report}</ReactMarkdown>
                    </div>
                  </Card>
                )}

                {/* Follow-up Email */}
                {result.followup_email && (
                  <Card className="p-6 bg-white/90 dark:bg-gray-900/90 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Follow-up Email Draft</h2>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyEmail} className="gap-2 bg-transparent">
                        {copiedEmail ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Email
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="text-sm whitespace-pre-wrap break-words font-mono bg-muted/40 p-4 rounded-lg">
                      {result.followup_email}
                    </pre>
                  </Card>
                )}
              </>
            )}

            {/* Reset button */}
            <div className="flex justify-center pb-10">
              <Button onClick={handleReset} variant="outline" className="gap-2 bg-transparent">
                <RotateCcw className="w-4 h-4" />
                Analyze Another Meeting
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
