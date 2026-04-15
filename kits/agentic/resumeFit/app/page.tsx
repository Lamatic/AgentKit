"use client"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Textarea } from "../components/ui/textarea"
import { Card } from "../components/ui/card"
import { Loader2, Sparkles, Copy, Check, Home } from "lucide-react"
import { evaluateResume } from "../actions/orchestrate"
import { Header } from "../components/header"

export default function ResumeScreener() {
  const [resume, setResume] = useState("")
  const [jobDesc, setJobDesc] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    if (!resume || !jobDesc) {
      setError("Please provide both resume and job description")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const combinedInput = `
      RESUME:
      ${resume}

      JOB DESCRIPTION:
      ${jobDesc}
      `

      const response = await evaluateResume("text", combinedInput)

      if (response.success) {
  try {
    let raw = response.data

    if (typeof raw === "string") {

      
      raw = raw.replace(/```json|```/g, "").trim()

     
      const match = raw.match(/\{[\s\S]*\}/)

      if (!match) {
        throw new Error("No valid JSON found in response")
      }

      const parsed = JSON.parse(match[0])

      const formatted = {
  decision: parsed.decision,
  summary: parsed.summary,
  score: Number(parsed.fscore || 0),
  strengths: parsed.strengths
    ? parsed.strengths.split(",").map((s: string) => s.trim())
    : [],
  weaknesses: parsed.weaknesses
    ? parsed.weaknesses.split(",").map((s: string) => s.trim())
    : [],
}

setResult(formatted)

    } else {
      // Already JSON
      setResult(raw)
    }

  } catch (err) {
    console.error("Parsing error:", err)
    setError("Failed to parse AI response")
  }
}
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setResult(null)
    setResume("")
    setJobDesc("")
    setError("")
  }

  const decision = result?.decision
const summary = result?.summary
const score = result?.score
const strengths = result?.strengths || []
const weaknesses = result?.weaknesses || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* HERO */}
        {!result && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-5xl font-semibold mb-4">
                AI Resume Screener
              </h1>
              <p className="text-lg text-muted-foreground">
                Instantly evaluate candidates based on job requirements
              </p>
            </div>

            <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-md">

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* RESUME */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    📄 Candidate Resume
                  </label>
                  <Textarea
                    placeholder="Paste resume here..."
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>

                {/* JOB DESCRIPTION */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    🧾 Job Description
                  </label>
                  <Textarea
                    placeholder="Paste job description here..."
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-100 text-red-600 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Analyzing Candidate...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Evaluate Candidate
                    </>
                  )}
                </Button>

              </form>
            </Card>
          </>
        )}

        {/* RESULT SCREEN */}
        {result && (
          <div className="max-w-3xl mx-auto">

            <div className="text-center mb-8">
              <h1 className="text-4xl font-semibold mb-2">
                Evaluation Result
              </h1>
              <p className="text-muted-foreground">
                AI-powered candidate assessment
              </p>
            </div>

            <Card className="p-8 shadow-xl bg-white/90 backdrop-blur-md">

              {/* DECISION BADGE */}
              <div className={`text-center text-xl font-semibold p-4 rounded-lg mb-6
                ${decision?.toLowerCase().includes("strong") && "bg-green-100 text-green-700"}
                ${decision?.toLowerCase().includes("hire") && !decision?.toLowerCase().includes("strong") && "bg-blue-100 text-blue-700"}
                ${decision?.toLowerCase().includes("maybe") && "bg-yellow-100 text-yellow-700"}
                ${decision?.toLowerCase().includes("reject") && "bg-red-100 text-red-700"}
              `}>
                {decision}
              </div>

              {/* SCORE */}
              <div className="bg-indigo-50 p-5 rounded-lg mb-6 text-center">
                <h3 className="text-sm text-muted-foreground mb-2">Candidate Score</h3>
                <p className="text-3xl font-bold text-indigo-600">
                  {score}/100
                </p>
              </div>

              {/* STRENGTHS */}
              <div className="bg-green-50 p-5 rounded-lg mb-6">
                <h3 className="font-semibold mb-2 text-green-700">Strengths</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {strengths.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* WEAKNESSES */}
              <div className="bg-red-50 p-5 rounded-lg mb-6">
                <h3 className="font-semibold mb-2 text-red-700">Weaknesses</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {weaknesses.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* SUMMARY */}
              <div className="bg-muted/50 p-5 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">AI Summary</h3>
                <p className="text-sm">{summary}</p>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3">
                <Button onClick={handleCopy} variant="outline" className="flex-1">
                  {copied ? <Check /> : <Copy />}
                </Button>

                <Button onClick={handleReset} className="flex-1">
                  <Home className="mr-2 w-4 h-4" />
                  Evaluate Another
                </Button>
              </div>

            </Card>
          </div>
        )}

      </div>
    </div>
  )
}