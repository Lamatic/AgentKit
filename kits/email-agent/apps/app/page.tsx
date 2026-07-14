"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { verifyEmail, replyEmail } from "@/actions/orchestrate"
import { Loader2, ShieldCheck, MailCheck, Copy, Check, RotateCcw, AlertTriangle, ArrowRightLeft, PenTool, CheckCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"

type Mode = "verify" | "reply"

export default function EmailAgentPage() {
  const [sender, setSender] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [mode, setMode] = useState<Mode>("verify")
  const [isLoading, setIsLoading] = useState(false)
  
  const [verifierResult, setVerifierResult] = useState<string | null>(null)
  const [replierResult, setReplierResult] = useState<string | null>(null)
  
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sender.trim() || !subject.trim() || !body.trim()) {
      setError("Please fill in sender, subject, and email body.")
      return
    }

    setIsLoading(true)
    setError("")
    
    if (mode === "verify") {
      setVerifierResult(null)
    } else {
      setReplierResult(null)
    }
    setCopied(false)

    try {
      if (mode === "verify") {
        const response = await verifyEmail(sender, subject, body)
        if (response.success && response.data) {
          setVerifierResult(response.data)
        } else {
          setError(response.error || "Email verification failed")
        }
      } else {
        const response = await replyEmail(sender, subject, body)
        if (response.success && response.data) {
          setReplierResult(response.data)
        } else {
          setError(response.error || "Email reply generation failed")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    const textToCopy = mode === "verify" ? verifierResult : replierResult
    if (!textToCopy) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleReset = () => {
    setSender("")
    setSubject("")
    setBody("")
    setVerifierResult(null)
    setReplierResult(null)
    setError("")
    setCopied(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 text-foreground">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-slate-900 to-rose-600 dark:from-white dark:to-rose-400 bg-clip-text text-transparent">
            Intelligent Email Workspace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Audit sender authenticity, evaluate core intent/urgency, and draft instant professional replies using dedicated Lamatic AI pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Email Input Form */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="shadow-lg border-slate-200/60 dark:border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MailCheck className="w-5 h-5 text-rose-500" />
                  Inbound Email Details
                </CardTitle>
                <CardDescription>
                  Input the sender header details and body text.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sender">Sender</Label>
                    <Input
                      id="sender"
                      placeholder="e.g. sender@example.com or Jane Doe"
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="e.g. Action Required: Account Update"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="body">Email Body</Label>
                    <Textarea
                      id="body"
                      placeholder="Paste the full email contents here..."
                      className="min-h-[250px] font-sans text-sm resize-none"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-md flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-rose-700 dark:text-rose-400">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      className="flex-1 h-11 text-sm font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {mode === "reply" ? "Analyzing & Drafting..." : "Processing..."}
                        </>
                      ) : mode === "verify" ? (
                        <>
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Verify & Audit
                        </>
                      ) : (
                        <>
                          <PenTool className="w-4 h-4 mr-2" />
                          Draft Reply
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={handleReset}
                      disabled={isLoading}
                      title="Reset workspace"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: AI Action Workspace */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="shadow-lg border-slate-200/60 dark:border-slate-800 min-h-[500px] flex flex-col">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">AI Assistant Workspace</CardTitle>
                    <CardDescription>Toggle between verification audit and reply draft generation.</CardDescription>
                  </div>

                  {/* Mode Toggler */}
                  <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0 w-fit self-start">
                    <button
                      type="button"
                      onClick={() => { setMode("verify"); setError(""); }}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                        mode === "verify"
                          ? "bg-white dark:bg-slate-900 shadow-xs text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verifier
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode("reply"); setError(""); }}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                        mode === "reply"
                          ? "bg-white dark:bg-slate-900 shadow-xs text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Replier
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-6">
                {/* Result display */}
                {mode === "verify" ? (
                  verifierResult ? (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                          <ShieldCheck className="w-5 h-5" />
                          <span className="font-semibold text-sm">Security & Legitimacy Audit</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 text-xs">
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Report
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="flex-1 p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800 rounded-lg overflow-y-auto max-h-[450px]">
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-base prose-h2:text-sm prose-p:text-slate-600 dark:prose-p:text-slate-300">
                          <ReactMarkdown>{verifierResult}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                      <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-1">No Verification Audit Run</h3>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Enter email details on the left and click "Verify & Audit" to execute the analysis pipeline.
                      </p>
                    </div>
                  )
                ) : (
                  replierResult ? (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                          <PenTool className="w-5 h-5" />
                          <span className="font-semibold text-sm">AI Draft Reply</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 text-xs">
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Draft
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="flex-1 p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800 rounded-lg overflow-y-auto max-h-[450px] whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-350">
                        {replierResult}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <PenTool className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                      <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-1">No Reply Drafted</h3>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Enter email details on the left and click "Draft Reply" to generate a context-aware response.
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
