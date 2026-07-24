"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Link2, Loader2, ShieldQuestion } from "lucide-react"

import { analyzeEmail, type Verdict } from "@/actions/orchestrate"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

const SAMPLE = {
  subject: "Your account has been suspended - action required",
  from: "PayPal Security <security@paypa1-alerts.com>",
  reply_to: "billing@secure-verify-desk.net",
  body: `Dear customer,

We detected unusual activity on your account. For your protection we have temporarily suspended it.

You must verify your details within 24 hours or your account will be permanently closed. Confirm your identity here:

http://198.51.100.23/paypal/login/verify

Failure to act will result in loss of access.

PayPal Security Team`,
}

const VERDICT_STYLES: Record<Verdict["verdict"], { label: string; className: string; icon: any }> = {
  phishing: { label: "Phishing", className: "bg-red-600 text-white", icon: AlertTriangle },
  suspicious: { label: "Suspicious", className: "bg-amber-500 text-white", icon: ShieldQuestion },
  legitimate: { label: "Legitimate", className: "bg-emerald-600 text-white", icon: CheckCircle2 },
}

export default function Page() {
  const [subject, setSubject] = useState("")
  const [from, setFrom] = useState("")
  const [replyTo, setReplyTo] = useState("")
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Verdict | null>(null)

  const loadSample = () => {
    setSubject(SAMPLE.subject)
    setFrom(SAMPLE.from)
    setReplyTo(SAMPLE.reply_to)
    setBody(SAMPLE.body)
    setResult(null)
    setError(null)
  }

  const onAnalyze = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    const res = await analyzeEmail({ subject, from, reply_to: replyTo, body })
    if (res.success && res.data) setResult(res.data)
    else setError(res.error ?? "Something went wrong.")
    setLoading(false)
  }

  const style = result ? VERDICT_STYLES[result.verdict] : null
  const VerdictIcon = style?.icon

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto grid max-w-4xl gap-6 px-6 py-8 md:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Email to triage</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadSample}>
              Load sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="from">From</Label>
                <Input id="from" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="sender@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="replyto">Reply-To</Label>
                <Input id="replyto" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="optional" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste the full email body here…"
                className="min-h-[220px] font-mono text-sm"
              />
            </div>
            <Button onClick={onAnalyze} disabled={loading || !body.trim()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing…
                </>
              ) : (
                "Analyse email"
              )}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        {/* Verdict */}
        <Card>
          <CardHeader>
            <CardTitle>Verdict</CardTitle>
          </CardHeader>
          <CardContent>
            {!result && !loading && (
              <p className="text-sm text-muted-foreground">
                Run an analysis to see the phishing-risk verdict, indicators, and extracted URLs.
              </p>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Contacting the triage flow…
              </div>
            )}
            {result && style && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <Badge className={`${style.className} gap-1.5 px-3 py-1 text-sm`}>
                    {VerdictIcon && <VerdictIcon className="h-4 w-4" />}
                    {style.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{result.confidence}% confidence</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Risk score</span>
                    <span className="font-medium">{result.risk_score}/100</span>
                  </div>
                  <Progress value={result.risk_score} />
                </div>

                {result.reasoning && <p className="text-sm leading-relaxed">{result.reasoning}</p>}

                {result.indicators?.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Indicators</p>
                      <ul className="space-y-1.5">
                        {result.indicators.map((ind, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                            <span>{ind}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {result.extracted_urls?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Extracted URLs</p>
                    <ul className="space-y-1">
                      {result.extracted_urls.map((u, i) => (
                        <li key={i} className="flex gap-2 break-all font-mono text-xs text-muted-foreground">
                          <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommended_action && (
                  <>
                    <Separator />
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <span className="font-medium">Recommended action: </span>
                      {result.recommended_action}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
