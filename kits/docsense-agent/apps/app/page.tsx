"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Loader2, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { intakeDocument } from "@/actions/orchestrate"
import { Header } from "@/components/header"

interface SurfacedItem {
  label: string
  reason: string
}

interface OutstandingItem {
  label: string
  status: string
}

const SAMPLE_DOC =
  "HDFC Bank Statement. Account holder: Ravi Kumar. 12 Mar 2026 - Outward foreign remittance USD 5000 to a vendor in Singapore. 18 Mar 2026 - Cash deposit Rs 8,00,000 in branch."

export default function Home() {
  const [documentText, setDocumentText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newlySurfaced, setNewlySurfaced] = useState<SurfacedItem[] | null>(null)
  const [outstanding, setOutstanding] = useState<OutstandingItem[] | null>(null)

  async function handleAnalyze() {
    if (!documentText.trim()) return
    setLoading(true)
    setError(null)
    setNewlySurfaced(null)
    setOutstanding(null)

    const res = await intakeDocument(null, `client-${Date.now()}`, documentText)

    if (res.success) {
      setNewlySurfaced(res.newlySurfaced ?? [])
      setOutstanding(res.outstanding ?? [])
    } else {
      setError(res.error ?? "Something went wrong.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">DocSense</h1>
          <p className="mt-2 text-muted-foreground">
            Paste a client document. DocSense reads it and tells you what the
            client still owes you — with the evidence for each requirement.
          </p>
        </div>

        <Card className="p-4">
          <Textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            placeholder="Paste the document text here..."
            className="min-h-40"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reading...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Analyze document
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDocumentText(SAMPLE_DOC)}
              disabled={loading}
            >
              Use sample
            </Button>
          </div>
        </Card>

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <span>{error}</span>
          </div>
        )}

        {newlySurfaced && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Newly required</h2>
            {newlySurfaced.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing new triggered by this document.
              </p>
            ) : (
              <ul className="space-y-3">
                {newlySurfaced.map((item, i) => (
                  <li
                    key={i}
                    className="rounded-md border bg-card p-4"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      {item.label}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.reason}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {outstanding && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Still outstanding</h2>
            <ul className="space-y-2">
              {outstanding.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
