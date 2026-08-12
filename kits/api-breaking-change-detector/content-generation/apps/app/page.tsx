"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Sparkles, FileText, Copy, Check, Home } from "lucide-react"
import { generateContent } from "@/actions/orchestrate"
import ReactMarkdown from "react-markdown"
import { Header } from "@/components/header"

type InputType = "text" | "image" | "json"

export default function GenerationPage() {
  const [inputType, setInputType] = useState<InputType>("text")
  const [instructions, setInstructions] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instructions.trim()) {
      setError("Please provide instructions")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)
    setCopied(false)

    try {
      const response = await generateContent(inputType, instructions)

      if (response.success) {
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
    setInstructions("")
    setError("")
    setCopied(false)
  }

  const handleCopy = async () => {
    const textToCopy = typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const isImageUrl = (value: any): boolean => {
    if (typeof value !== "string") return false
    return (
      /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value) ||
      (/^https?:\/\/.+/.test(value) && (value.includes("image") || value.includes("img")))
    )
  }

  const renderResult = () => {
    if (!result) return null

    // Check if it's an image URL
    if (isImageUrl(result)) {
      return (
        <div className="space-y-4">
          <img src={result || "/placeholder.svg"} alt="Generated content" className="w-full rounded-lg shadow-md" />
          <p className="text-xs text-muted-foreground break-all">{result}</p>
        </div>
      )
    }

    // Check if it's an object/JSON
    if (typeof result === "object" && result !== null) {
      return <pre className="text-sm whitespace-pre-wrap break-words font-mono">{JSON.stringify(result, null, 2)}</pre>
    }

    // If input type is text, render as markdown
    if (inputType === "text" && typeof result === "string") {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-code:text-primary">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )
    }

    // Otherwise, it's plain text
    return <p className="text-sm whitespace-pre-wrap break-words">{result}</p>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 text-foreground">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        {!result && (
          <div className="flex items-start justify-center pt-12">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-normal mb-4 text-balance">Generate Content</h1>
                <p className="text-xl text-muted-foreground">
                  Select input type and provide instructions for content generation
                </p>
              </div>

              <Card className="p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="inputType" className="text-sm font-medium">
                      Input Type
                    </label>
                    <Select value={inputType} onValueChange={(value) => setInputType(value as InputType)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select input type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="instructions" className="text-sm font-medium">
                      Instructions
                    </label>
                    <Textarea
                      id="instructions"
                      placeholder="Enter your instructions here..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="min-h-[200px] resize-none"
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
                    disabled={!instructions.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-start justify-center pt-12">
            <div className="max-w-3xl w-full">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-normal mb-2 text-balance">Generated Result</h1>
                <p className="text-lg text-muted-foreground">Your content has been generated successfully</p>
              </div>

              <Card className="p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Output</h2>
                  </div>
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
                </div>

                <div className="p-6 bg-muted/50 rounded-lg overflow-auto max-h-[600px] mb-6">{renderResult()}</div>

                <Button onClick={handleReset} variant="outline" className="w-full h-12 gap-2 bg-transparent">
                  <Home className="w-4 h-4" />
                  Generate New Content
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
