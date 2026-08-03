"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Search, RefreshCw, BadgeDollarSign } from "lucide-react"
import { processStatement } from "@/actions/orchestrate"
import { Header } from "@/components/header"

type Subscription = {
  merchant: string;
  amount: string | number;
  frequency: string;
  verdict: "keep" | "cancel" | "review" | string;
  reason: string;
}

export default function SubscriptionAuditPage() {
  const [statementText, setStatementText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Subscription[] | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!statementText.trim()) {
      setError("Please provide your bank statement text")
      return
    }

    setIsLoading(true)
    setError("")
    setResults(null)

    try {
      const response = await processStatement(statementText)

      if (response.success && response.data?.subscriptions) {
        setResults(response.data.subscriptions)
      } else {
        setError(response.error || "Failed to audit subscriptions")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResults(null)
    setStatementText("")
    setError("")
  }

  const getVerdictColor = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v === "keep") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    if (v === "cancel") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    if (v === "review") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 text-foreground">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {!results && (
          <div className="flex items-start justify-center pt-12">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-normal mb-4 text-balance">Subscription Audit</h1>
                <p className="text-xl text-muted-foreground">
                  Paste your bank statement text to find and evaluate your recurring subscriptions.
                </p>
              </div>

              <Card className="p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="statementText" className="text-sm font-medium">
                      Bank Statement / Transaction Export
                    </label>
                    <Textarea
                      id="statementText"
                      placeholder="Paste your raw statement text here (e.g. date, description, amount)..."
                      value={statementText}
                      onChange={(e) => setStatementText(e.target.value)}
                      className="min-h-[250px] resize-none font-mono text-sm"
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
                    disabled={!statementText.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Auditing Subscriptions...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Audit Now
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}

        {results && (
          <div className="flex flex-col items-center pt-8">
            <div className="w-full mb-8 text-center">
              <h1 className="text-4xl font-normal mb-2 text-balance">Audit Results</h1>
              <p className="text-lg text-muted-foreground">
                Found {results.length} subscription{results.length === 1 ? '' : 's'} in your statement.
              </p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {results.map((sub, index) => (
                <Card key={index} className="flex flex-col h-full overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                  <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b ${getVerdictColor(sub.verdict)}`}>
                    {sub.verdict}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-start">
                      <span className="truncate pr-2">{sub.merchant}</span>
                      <span className="font-mono text-lg whitespace-nowrap">{typeof sub.amount === 'number' ? `$${sub.amount}` : sub.amount}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <RefreshCw className="w-3 h-3" />
                      {sub.frequency}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 flex-grow">
                    <p className="text-sm text-muted-foreground">
                      {sub.reason}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {results.length === 0 && (
              <div className="w-full p-12 text-center bg-muted/30 rounded-xl mb-8 border border-dashed">
                <BadgeDollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No Subscriptions Found</h3>
                <p className="text-muted-foreground">We couldn't identify any recurring subscriptions in this text.</p>
              </div>
            )}

            <Button onClick={handleReset} variant="outline" className="h-12 px-8">
              Audit Another Statement
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
