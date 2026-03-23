"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Sparkles, Mail, Copy, Check, Home } from "lucide-react"
import { personalizeColdEmail } from "@/actions/orchestrate"
import { Header } from "@/components/header"

const initialForm = {
  profile_data: "",
  prospect_name: "",
  prospect_role: "",
  company_name: "",
  product_description: "",
  value_proposition: "",
  call_to_action: "",
}

export default function ColdEmailPage() {
  const [form, setForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    subject_line: string
    email_body: string
    personalized_hook: string
  } | null>(null)
  const [error, setError] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const required = [
      "profile_data",
      "prospect_name",
      "company_name",
      "product_description",
      "value_proposition",
      "call_to_action",
    ] as const
    for (const key of required) {
      if (!form[key].trim()) {
        setError(`Please fill in ${key.replace(/_/g, " ")}`)
        return
      }
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await personalizeColdEmail(form)
      if (response.success && response.data) {
        setResult(response.data)
      } else {
        setError(response.error || "Generation failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setForm(initialForm)
    setError("")
    setCopiedField(null)
  }

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(label)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      console.error("Copy failed")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 text-foreground">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        {!result && (
          <div className="flex items-start justify-center pt-8">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-normal mb-3 text-balance">
                  Cold Email Personalization
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Paste a LinkedIn-style profile and your context. Get a subject line, email body, and
                  personalization hook for engineering internship outreach.
                </p>
              </div>

              <Card className="p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="profile_data">Their profile / LinkedIn context</Label>
                    <Textarea
                      id="profile_data"
                      placeholder="Headline, About, recent roles — paste what you’d use to personalize"
                      value={form.profile_data}
                      onChange={(e) => setForm((f) => ({ ...f, profile_data: e.target.value }))}
                      className="min-h-[140px] resize-y"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prospect_name">Recipient name</Label>
                      <Input
                        id="prospect_name"
                        value={form.prospect_name}
                        onChange={(e) => setForm((f) => ({ ...f, prospect_name: e.target.value }))}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prospect_role">Their role</Label>
                      <Input
                        id="prospect_role"
                        placeholder="e.g. Senior Software Engineer"
                        value={form.prospect_role}
                        onChange={(e) => setForm((f) => ({ ...f, prospect_role: e.target.value }))}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company</Label>
                    <Input
                      id="company_name"
                      value={form.company_name}
                      onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product_description">About you (student pitch)</Label>
                    <Textarea
                      id="product_description"
                      placeholder="Major, year, projects, skills, links you want reflected"
                      value={form.product_description}
                      onChange={(e) => setForm((f) => ({ ...f, product_description: e.target.value }))}
                      className="min-h-[100px]"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value_proposition">Why you&apos;re a fit</Label>
                    <Textarea
                      id="value_proposition"
                      placeholder="Tie your background to their team, stack, or mission"
                      value={form.value_proposition}
                      onChange={(e) => setForm((f) => ({ ...f, value_proposition: e.target.value }))}
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="call_to_action">What you&apos;re asking for</Label>
                    <Input
                      id="call_to_action"
                      placeholder="e.g. 10-minute chat, referral, feedback on my background"
                      value={form.call_to_action}
                      onChange={(e) => setForm((f) => ({ ...f, call_to_action: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate personalized email
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-start justify-center pt-8">
            <div className="max-w-3xl w-full space-y-6">
              <div className="text-center mb-4">
                <h1 className="text-3xl md:text-4xl font-normal mb-2">Your outreach</h1>
                <p className="text-muted-foreground">Copy sections below into your email client</p>
              </div>

              <Card className="p-6 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <h2 className="font-semibold">Subject line</h2>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyText("subject", result.subject_line)}
                      className="gap-1"
                    >
                      {copiedField === "subject" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm rounded-md bg-muted/50 p-3 whitespace-pre-wrap">{result.subject_line}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold">Email body</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyText("body", result.email_body)}
                      className="gap-1"
                    >
                      {copiedField === "body" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm rounded-md bg-muted/50 p-3 whitespace-pre-wrap font-sans leading-relaxed">
                    {result.email_body}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-muted-foreground">Personalization hook (reference)</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyText("hook", result.personalized_hook)}
                      className="gap-1"
                    >
                      {copiedField === "hook" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm rounded-md bg-muted/30 p-3 whitespace-pre-wrap text-muted-foreground">
                    {result.personalized_hook}
                  </p>
                </div>

                <Button onClick={handleReset} variant="outline" className="w-full h-12 gap-2 bg-transparent">
                  <Home className="w-4 h-4" />
                  Start over
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
