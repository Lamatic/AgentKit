"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Upload, FileText, Loader2, Sparkles, CheckCircle2, Globe, X, Github } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type SourceType = "document" | "webpages"

export default function EmbeddedSearchKit() {
  const [sourceType, setSourceType] = useState<SourceType>("document")
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [urls, setUrls] = useState<string[]>([])
  const [currentUrl, setCurrentUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [currentIframeIndex, setCurrentIframeIndex] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      const filename = selectedFile.name.replace(/\.pdf$/i, "")
      setTitle(filename)
      setError("")
    } else {
      setError("Please select a valid PDF file")
      setFile(null)
      setTitle("")
    }
  }

  const handleAddUrl = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentUrl.trim()) {
      e.preventDefault()

      if (urls.length >= 3) {
        setError("Maximum 3 URLs allowed")
        return
      }

      try {
        new URL(currentUrl.trim())
        setUrls([...urls, currentUrl.trim()])
        setCurrentUrl("")
        setError("")
      } catch {
        setError("Please enter a valid URL")
      }
    }
  }

  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index))
  }

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please provide a PDF file")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload PDF")
      }

      const { url: uploadedPdfUrl } = await uploadResponse.json()

      console.log("[v0] Setting PDF URL for preview:", uploadedPdfUrl)
      setPdfUrl(uploadedPdfUrl)
      setIsPdfLoading(true)
      setIsLoading(false)
      setIsProcessing(true)

      sessionStorage.setItem("searchkit_source_type", "document")
      sessionStorage.setItem("searchkit_title", title.trim())
      sessionStorage.setItem("searchkit_blob_url", uploadedPdfUrl)

      const indexResponse = await fetch("/api/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          url: uploadedPdfUrl,
        }),
      })

      if (!indexResponse.ok) {
        throw new Error("Failed to index document")
      }

      const result = await indexResponse.json()

      if (result.success) {
        setShowSuccess(true)
        setTimeout(() => {
          window.location.href = "/search"
        }, 2000)
      } else {
        throw new Error(result.error || "Indexation failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsProcessing(false)
      setPdfUrl(null)
      setIsPdfLoading(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWebpagesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (urls.length === 0) {
      setError("Please provide at least one URL")
      return
    }

    setIsLoading(true)
    setIsProcessing(true)
    setError("")

    sessionStorage.setItem("searchkit_source_type", "webpages")
    sessionStorage.setItem("searchkit_urls", JSON.stringify(urls))

    const iframeInterval = setInterval(() => {
      setCurrentIframeIndex((prev) => (prev + 1) % urls.length)
    }, 2000)

    try {
      const executeResponse = await fetch("/api/index-webpages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: urls,
        }),
      })

      if (!executeResponse.ok) {
        clearInterval(iframeInterval)
        throw new Error("Failed to start webpage indexation")
      }

      const executeResult = await executeResponse.json()

      if (!executeResult.success || !executeResult.requestId) {
        clearInterval(iframeInterval)
        throw new Error(executeResult.error || "Failed to get request ID")
      }

      const requestId = executeResult.requestId

      let attempts = 0
      const maxAttempts = 20

      const pollStatus = async (): Promise<boolean> => {
        try {
          const timestamp = Date.now()
          const statusResponse = await fetch(`/api/check-workflow-status?t=${timestamp}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
            body: JSON.stringify({
              requestId: requestId,
            }),
            cache: "no-store",
          })

          if (!statusResponse.ok) {
            throw new Error("Failed to check status")
          }

          const statusResult = await statusResponse.json()

          if (statusResult.success && statusResult.status?.success && statusResult.status?.status === "success") {
            clearInterval(iframeInterval)
            setShowSuccess(true)
            setTimeout(() => {
              window.location.href = "/search"
            }, 2000)
            return true
          }

          if (statusResult.status?.status === "failed" || statusResult.status?.status === "error") {
            clearInterval(iframeInterval)
            throw new Error("Workflow processing failed")
          }

          return false
        } catch (err) {
          console.error("[v0] Polling error:", err)
          throw err
        }
      }

      const pollingInterval = setInterval(async () => {
        attempts++

        if (attempts >= maxAttempts) {
          clearInterval(pollingInterval)
          clearInterval(iframeInterval)
          setError("Workflow processing timed out")
          setIsProcessing(false)
          setIsLoading(false)
          return
        }

        try {
          const isComplete = await pollStatus()
          if (isComplete) {
            clearInterval(pollingInterval)
          }
        } catch (err) {
          clearInterval(pollingInterval)
          clearInterval(iframeInterval)
          setError(err instanceof Error ? err.message : "An error occurred")
          setIsProcessing(false)
          setIsLoading(false)
        }
      }, 30000)

      setTimeout(async () => {
        try {
          const isComplete = await pollStatus()
          if (isComplete) {
            clearInterval(pollingInterval)
          }
        } catch (err) {
          clearInterval(pollingInterval)
          clearInterval(iframeInterval)
          setError(err instanceof Error ? err.message : "An error occurred")
          setIsProcessing(false)
          setIsLoading(false)
        }
      }, 5000)

      setIsLoading(false)
    } catch (err) {
      clearInterval(iframeInterval)
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsProcessing(false)
      setIsLoading(false)
    }
  }

  const handleSubmit = sourceType === "document" ? handleDocumentSubmit : handleWebpagesSubmit

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 text-foreground flex flex-col">
      <header className="border-b border-border/50 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Image src="/images/lamatic-logo.png" alt="Lamatic" width={32} height={32} className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight select-none">
              <span className="text-black dark:text-white">Embedded Search</span>
              <span className="text-primary"> Kit</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="https://lamatic.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Docs
            </Link>
            <Link
              href="https://github.com/Lamatic/AgentKit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex px-6 py-8 gap-6 max-w-7xl mx-auto w-full">
        <div
          className={`flex-1 flex items-center justify-center ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
        >
          <div className="max-w-2xl w-full">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-normal mb-4 text-balance">Upload Your Source</h1>
              <p className="text-xl text-muted-foreground">
                Upload a PDF or provide webpage URLs to create your embedded search widget
              </p>
            </div>

            <Card className="p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
              <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => setSourceType("document")}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
                    sourceType === "document" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Document
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType("webpages")}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
                    sourceType === "webpages" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Webpages
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {sourceType === "document" ? (
                  <div className="space-y-2">
                    <label htmlFor="file" className="text-sm font-medium">
                      PDF Document
                    </label>
                    <div className="relative">
                      <input
                        id="file"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isLoading || isProcessing}
                      />
                      <div className="h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {file ? file.name : "Click to upload PDF or drag and drop"}
                        </p>
                        <p className="text-xs text-muted-foreground">PDF files only</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-medium">
                      Webpage URLs (Max 3)
                    </label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="Enter URL and press Enter"
                      value={currentUrl}
                      onChange={(e) => setCurrentUrl(e.target.value)}
                      onKeyDown={handleAddUrl}
                      className="h-12"
                      disabled={isLoading || isProcessing || urls.length >= 3}
                    />

                    {urls.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {urls.map((url, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            {isProcessing ? (
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted-foreground/20 rounded animate-pulse w-3/4" />
                                <div className="h-3 bg-muted-foreground/10 rounded animate-pulse w-1/2" />
                              </div>
                            ) : (
                              <span className="text-sm truncate flex-1">{url}</span>
                            )}
                            {!isProcessing && (
                              <button
                                type="button"
                                onClick={() => handleRemoveUrl(index)}
                                className="ml-2 text-muted-foreground hover:text-destructive"
                                disabled={isLoading || isProcessing}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={(sourceType === "document" ? !file : urls.length === 0) || isLoading || isProcessing}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {sourceType === "document" ? "Uploading Document..." : "Processing URLs..."}
                    </>
                  ) : isProcessing ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Create Search Widget"
                  )}
                </Button>
              </form>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Also index from your favorite sources in Lamatic Studio
              </p>
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="group cursor-pointer transition-transform hover:scale-110" title="Google Drive">
                  <Image
                    src="/images/gdrive-icon.png"
                    alt="Google Drive"
                    width={40}
                    height={40}
                    className="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="group cursor-pointer transition-transform hover:scale-110" title="Amazon S3">
                  <Image
                    src="/images/s3-icon.png"
                    alt="Amazon S3"
                    width={40}
                    height={40}
                    className="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="group cursor-pointer transition-transform hover:scale-110" title="PostgreSQL">
                  <Image
                    src="/images/postgres-icon.png"
                    alt="PostgreSQL"
                    width={40}
                    height={40}
                    className="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="group cursor-pointer transition-transform hover:scale-110" title="Google Sheets">
                  <Image
                    src="/images/gsheet-icon.png"
                    alt="Google Sheets"
                    width={40}
                    height={40}
                    className="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="group cursor-pointer transition-transform hover:scale-110" title="SharePoint">
                  <Image
                    src="/images/sharepoint-icon.png"
                    alt="SharePoint"
                    width={40}
                    height={40}
                    className="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="group cursor-pointer transition-transform hover:scale-110" title="OneDrive">
                  <Image
                    src="/images/onedrive-icon.png"
                    alt="OneDrive"
                    width={40}
                    height={40}
                    className="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
              <Link
                href="https://lamatic.ai/integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm text-primary hover:underline"
              >
                Learn more about integrations →
              </Link>
            </div>
          </div>
        </div>

        {(pdfUrl || (isProcessing && urls.length > 0)) && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full h-[calc(100vh-12rem)] relative">
              <Card className="h-full backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-lg shadow-sm">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Document Preview</span>
                </div>

                {sourceType === "document" && pdfUrl ? (
                  <div className="w-full h-full relative">
                    {isPdfLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                      </div>
                    )}
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                      className="w-full h-full border-0"
                      title="PDF Preview"
                      onLoad={() => {
                        console.log("[v0] PDF iframe loaded successfully")
                        setIsPdfLoading(false)
                      }}
                      onError={(e) => {
                        console.error("[v0] PDF iframe failed to load:", e)
                        setIsPdfLoading(false)
                      }}
                    />
                  </div>
                ) : (
                  urls.length > 0 && (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-8">
                      <div className="space-y-4 animate-pulse">
                        <div className="h-16 bg-muted-foreground/20 rounded-lg" />
                        <div className="grid grid-cols-3 gap-4">
                          <div className="h-32 bg-muted-foreground/20 rounded-lg" />
                          <div className="h-32 bg-muted-foreground/20 rounded-lg" />
                          <div className="h-32 bg-muted-foreground/20 rounded-lg" />
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                          <div className="h-4 bg-muted-foreground/20 rounded w-full" />
                          <div className="h-4 bg-muted-foreground/20 rounded w-5/6" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-8">
                          <div className="h-48 bg-muted-foreground/20 rounded-lg" />
                          <div className="h-48 bg-muted-foreground/20 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  )
                )}

                {isProcessing && !showSuccess && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-emerald-500/30 to-teal-500/30 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <Sparkles className="w-24 h-24 text-green-600 animate-pulse absolute inset-0" />
                        <Sparkles className="w-16 h-16 text-emerald-600 animate-ping absolute inset-0 m-auto" />
                        <Sparkles className="w-12 h-12 text-teal-600 animate-bounce absolute inset-0 m-auto" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-green-900 dark:text-green-100">
                        AI Processing {sourceType === "document" ? "Document" : "Webpages"}
                      </h3>
                      <p className="text-muted-foreground">
                        {sourceType === "document"
                          ? "Analyzing and indexing your PDF..."
                          : "Analyzing and indexing your webpages..."}
                      </p>
                    </div>
                  </div>
                )}

                {showSuccess && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-emerald-500/30 to-teal-500/30 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-500">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-16 h-16 text-green-600 animate-in zoom-in duration-700" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-green-900 dark:text-green-100">Ready to Search!</h3>
                      <p className="text-muted-foreground">Redirecting to your search widget...</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
