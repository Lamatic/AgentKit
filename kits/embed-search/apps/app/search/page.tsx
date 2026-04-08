"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, FileText, Globe, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SearchPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [urls, setUrls] = useState<string[]>([])
  const [sourceType, setSourceType] = useState<"document" | "webpages">("document")
  const [isDeletingResource, setIsDeletingResource] = useState(false)

  useEffect(() => {
    const storedSourceType = sessionStorage.getItem("searchkit_source_type")
    const storedPdfUrl = sessionStorage.getItem("searchkit_blob_url")
    const storedUrls = sessionStorage.getItem("searchkit_urls")

    if (storedSourceType === "webpages" && storedUrls) {
      setSourceType("webpages")
      setUrls(JSON.parse(storedUrls))
    } else if (storedPdfUrl) {
      setSourceType("document")
      setPdfUrl(storedPdfUrl)
    }

    const handleBeforeUnload = () => {
      const storedTitle = sessionStorage.getItem("searchkit_title")
      const storedBlobUrl = sessionStorage.getItem("searchkit_blob_url")
      const storedSourceType = sessionStorage.getItem("searchkit_source_type")
      const storedUrls = sessionStorage.getItem("searchkit_urls")

      console.log("[v0] beforeunload triggered", {
        storedSourceType,
        storedTitle,
        storedUrls,
        storedBlobUrl,
      })

      let deletionData: any = null

      // Handle webpages deletion
      if (storedSourceType === "webpages") {
        let urlsArray: string[] = []

        if (storedUrls) {
          try {
            urlsArray = JSON.parse(storedUrls)
            console.log("[v0] Parsed URLs for webpages:", urlsArray)
          } catch (error) {
            console.error("[v0] Failed to parse URLs:", error)
            urlsArray = []
          }
        }

        deletionData = {
          type: "webpages",
          title: "dummy",
          urls: Array.isArray(urlsArray) && urlsArray.length > 0 ? urlsArray : [""],
        }

        console.log("[v0] Webpages deletion payload:", deletionData)
      }
      // Handle PDF deletion
      else if (storedSourceType === "document") {
        deletionData = {
          type: "pdf",
          title: storedTitle || "untitled",
          urls: [""],
        }

        console.log("[v0] PDF deletion payload:", deletionData)
      }

      // Send deletion request if we have data
      if (deletionData) {
        const blob = new Blob([JSON.stringify(deletionData)], {
          type: "application/json",
        })
        const sent = navigator.sendBeacon("/api/delete-resource", blob)
        console.log("[v0] sendBeacon result:", sent)

        // For PDFs, also delete the blob
        if (storedSourceType === "document" && storedBlobUrl && storedTitle) {
          const blobData = new Blob(
            [
              JSON.stringify({
                title: storedTitle,
                blobUrl: storedBlobUrl,
              }),
            ],
            {
              type: "application/json",
            },
          )
          const blobSent = navigator.sendBeacon("/api/delete", blobData)
          console.log("[v0] blob deletion sendBeacon result:", blobSent)
        }
      } else {
        console.warn("[v0] No deletion data to send")
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    const initializeChatbot = () => {
      const PROJECT_ID = "3387843c-b9c7-47ee-a96e-d6708e28ad6c"
      const FLOW_ID = "7d9d74f8-5281-46dd-ad71-3f26c0698634"
      const API_URL = "https://lamaticshowcase-firecrawl310.lamatic.dev"

      const root = document.createElement("div")
      root.id = "lamatic-search-root"
      root.dataset.apiUrl = API_URL
      root.dataset.flowId = FLOW_ID
      root.dataset.projectId = PROJECT_ID

      document.body.appendChild(root)

      const handleWidgetReady = () => {
        console.log("[v0] Lamatic search widget ready")

        if (window.LamaticSearchWidget?.resetSearchHistory) {
          window.LamaticSearchWidget.resetSearchHistory()
            .then(() => console.log("[v0] Search history reset successfully"))
            .catch((error: any) => console.error("[v0] Reset error:", error))
        }

        const storedTitle = sessionStorage.getItem("searchkit_title")
        const storedUrls = sessionStorage.getItem("searchkit_urls")
        const storedSourceType = sessionStorage.getItem("searchkit_source_type")

        if (root) {
          let metadata: { title: string; urls: string[] }

          if (storedSourceType === "webpages" && storedUrls) {
            try {
              const urlsArray = JSON.parse(storedUrls)
              metadata = {
                title: "",
                urls: Array.isArray(urlsArray) ? urlsArray : [],
              }
            } catch {
              metadata = {
                title: "",
                urls: [],
              }
            }
          } else {
            metadata = {
              title: storedTitle || "",
              urls: [""],
            }
          }

          root.dataset.metadata = JSON.stringify(metadata)
          console.log("[v0] Metadata set:", metadata)
        }
      }

      window.addEventListener("lamaticSearchWidgetReady", handleWidgetReady)

      const script = document.createElement("script")
      script.type = "module"
      script.src = `https://widget.lamatic.ai/search-v2?projectId=${PROJECT_ID}`
      document.body.appendChild(script)
    }

    initializeChatbot()

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("lamaticSearchWidgetReady", () => {})

      const root = document.getElementById("lamatic-search-root")
      if (root) {
        root.remove()
      }

      const scripts = document.querySelectorAll('script[src*="widget.lamatic.ai"]')
      scripts.forEach((script) => script.remove())
    }
  }, [])

  const handleBackToUpload = async () => {
    if (isDeletingResource) return

    setIsDeletingResource(true)

    const storedTitle = sessionStorage.getItem("searchkit_title")
    const storedBlobUrl = sessionStorage.getItem("searchkit_blob_url")
    const storedSourceType = sessionStorage.getItem("searchkit_source_type")
    const storedUrls = sessionStorage.getItem("searchkit_urls")

    try {
      if (storedSourceType === "webpages" && storedUrls) {
        const urlsArray = JSON.parse(storedUrls)
        console.log("[v0] New Source - Webpages deletion, parsed URLs:", urlsArray)

        if (!Array.isArray(urlsArray) || urlsArray.length === 0) {
          console.error("[v0] Invalid URLs array for webpages deletion:", urlsArray)
          alert("Error: No valid URLs found to delete")
          setIsDeletingResource(false)
          return
        }

        const payload = {
          type: "webpages",
          title: "dummy",
          urls: urlsArray,
        }

        console.log("[v0] Sending webpages deletion payload:", payload)

        const response = await fetch("/api/delete-resource", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const result = await response.json()
        console.log("[v0] Webpages deletion response:", result)

        if (!response.ok || !result.success) {
          console.error("[v0] Failed to delete webpages:", result)
          alert(`Failed to delete webpages: ${result.error || "Unknown error"}`)
          setIsDeletingResource(false)
          return
        }
      } else if (storedSourceType === "document" && storedTitle) {
        const payload = {
          type: "pdf",
          title: storedTitle,
          urls: [""],
        }

        console.log("[v0] Sending PDF deletion payload:", payload)

        const response = await fetch("/api/delete-resource", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const result = await response.json()
        console.log("[v0] PDF deletion response:", result)

        if (!response.ok || !result.success) {
          console.error("[v0] Failed to delete PDF:", result)
          alert(`Failed to delete PDF: ${result.error || "Unknown error"}`)
          setIsDeletingResource(false)
          return
        }

        if (storedBlobUrl) {
          const blobResponse = await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: storedTitle,
              blobUrl: storedBlobUrl,
            }),
          })

          const blobResult = await blobResponse.json()
          console.log("[v0] Blob deletion response:", blobResult)

          if (!blobResponse.ok || !blobResult.success) {
            console.error("[v0] Failed to delete blob:", blobResult)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error deleting resource:", error)
      alert(`An error occurred while deleting: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsDeletingResource(false)
      return
    }

    sessionStorage.removeItem("searchkit_title")
    sessionStorage.removeItem("searchkit_blob_url")
    sessionStorage.removeItem("searchkit_source_type")
    sessionStorage.removeItem("searchkit_urls")

    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 text-foreground flex flex-col">
      {isDeletingResource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-xl text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Cleaning up resources...</h3>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        </div>
      )}

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
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={handleBackToUpload}
              disabled={isDeletingResource}
            >
              {isDeletingResource ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cleaning up...
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  Upload New Source
                </>
              )}
            </Button>
            <Link
              href="https://lamatic.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Docs
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        {sourceType === "document" && pdfUrl ? (
          <Card
            className="w-full max-w-5xl backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl overflow-hidden flex flex-col"
            style={{ height: "calc(100vh - 140px)" }}
          >
            <div className="p-4 border-b border-border/50 flex-shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Document Preview
              </h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <embed
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                type="application/pdf"
                className="w-full h-full"
              />
            </div>
          </Card>
        ) : sourceType === "webpages" && urls.length > 0 ? (
          <Card
            className="w-full max-w-5xl backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl overflow-hidden flex flex-col"
            style={{ height: "calc(100vh - 140px)" }}
          >
            <div className="p-6 border-b border-border/50 flex-shrink-0">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-primary" />
                Indexed Webpages
              </h3>
              <p className="text-sm text-muted-foreground">Search from any of these webpages using the search widget</p>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="grid gap-4 max-w-3xl mx-auto">
                {urls.map((url, index) => {
                  const urlObj = new URL(url)
                  const domain = urlObj.hostname.replace("www.", "")
                  const path = urlObj.pathname !== "/" ? urlObj.pathname : ""

                  return (
                    <Card
                      key={index}
                      className="p-6 hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                            <h4 className="font-semibold text-lg truncate">{domain}</h4>
                          </div>
                          {path && <p className="text-sm text-muted-foreground truncate mb-3">{path}</p>}
                          <p className="text-xs text-muted-foreground/70 break-all line-clamp-2">{url}</p>
                        </div>
                        <Button asChild size="sm" className="gap-2 flex-shrink-0">
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </a>
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
