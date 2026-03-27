"use client"

import html2canvas from "html2canvas"
import { 
  Loader2Icon, 
  ExternalLinkIcon, 
  DownloadIcon, 
  SparklesIcon, 
  ArrowRightIcon, 
  CheckIcon, 
  Wand2Icon, 
  RefreshCwIcon, 
  ImageIcon, 
  CodeIcon, 
  FileTextIcon, 
  PenToolIcon 
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { z } from "zod"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  defaultPosterDimensions,
  getElementDimensions,
  getPosterRoot,
  getPreviewRoot,
  slugifyName,
  type PosterDimensions,
} from "@/app/page-helpers"

import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ExportState = "idle" | "exporting-png" | "exporting-jpg" | "exporting-svg"

const progressStages = [
  "Parsing your idea",
  "Building design spec",
  "Generating poster code",
  "Finalising",
]

const promptSchema = z.string().trim().min(1, "Please enter a prompt before generating.")

const posterResponseSchema = z.object({
  is_valid: z.boolean(),
  validation_issues: z.array(z.string()).default([]),
  html_code: z.string().optional(),
  poster_name: z.string().default("poster"),
})

function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

async function withHiddenIframeDocument(
  html: string,
  run: (doc: Document) => Promise<void> | void
) {  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.left = "-10000px"
  iframe.style.top = "0"
  iframe.style.width = "2000px"
  iframe.style.height = "2000px"
  iframe.style.opacity = "0"
  iframe.setAttribute("aria-hidden", "true")
  document.body.appendChild(iframe)

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve()
      iframe.onerror = () => reject(new Error("Failed to load export document."))
      iframe.srcdoc = html
    })

    const doc = iframe.contentDocument
    if (!doc) {
      throw new Error("Failed to access export document.")
    }

    const captureStyle = doc.createElement("style")
    captureStyle.textContent = `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      html, body {
        opacity: 1 !important;
        filter: none !important;
      }
    `
    doc.head.appendChild(captureStyle)

    if (doc.fonts?.ready) {
      await doc.fonts.ready.catch(() => undefined)
    }

    await new Promise<void>((resolve) => {
      const win = iframe.contentWindow
      if (!win) {
        resolve()
        return
      }

      win.requestAnimationFrame(() => {
        win.requestAnimationFrame(() => {
          win.setTimeout(() => resolve(), 80)
        })
      })
    })

    await run(doc)
  } finally {
    iframe.remove()
  }
}

export default function Page() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  const [promptValue, setPromptValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [posterHtml, setPosterHtml] = useState("")
  const [posterName, setPosterName] = useState("poster")
  const [posterDimensions, setPosterDimensions] = useState<PosterDimensions>(defaultPosterDimensions)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [exportState, setExportState] = useState<ExportState>("idle")
  const [previewScale, setPreviewScale] = useState(1)
  const [isFrameLoading, setIsFrameLoading] = useState(false)
  const [svgNotice, setSvgNotice] = useState("")

  const iframeSrcDoc = useMemo(() => {
    if (!posterHtml) {
      return ""
    }
    return posterHtml
  }, [posterHtml])

  const updatePreviewScale = useCallback(() => {
    const container = previewContainerRef.current
    if (!container || !posterHtml) {
      setPreviewScale(1)
      return
    }

    const availableWidth = Math.max(container.clientWidth - 32, 1)
    const availableHeight = Math.max(container.clientHeight - 32, 1)

    const widthScale = availableWidth / posterDimensions.width
    const heightScale = availableHeight / posterDimensions.height
    const nextScale = Math.min(widthScale, heightScale, 1)

    setPreviewScale(nextScale)
  }, [posterDimensions.height, posterDimensions.width, posterHtml])

  useEffect(() => {
    if (!isLoading) {
      return
    }

    setProgressStep(0)
    const timer = window.setInterval(() => {
      setProgressStep((current) => Math.min(current + 1, progressStages.length - 1))
    }, 7000)

    return () => window.clearInterval(timer)
  }, [isLoading])

  useEffect(() => {
    updatePreviewScale()

    const resizeObserver = new ResizeObserver(() => {
      updatePreviewScale()
    })

    const node = previewContainerRef.current
    if (node) {
      resizeObserver.observe(node)
    }

    window.addEventListener("resize", updatePreviewScale)
    return () => {
      if (node) {
        resizeObserver.unobserve(node)
      }
      resizeObserver.disconnect()
      window.removeEventListener("resize", updatePreviewScale)
    }
  }, [updatePreviewScale])

  const handleGeneratePoster = useCallback(async () => {
    const parsedPrompt = promptSchema.safeParse(promptValue)
    if (!parsedPrompt.success) {
      setValidationErrors([parsedPrompt.error.issues[0]?.message ?? "Prompt is required"])
      return
    }

    setIsLoading(true)
    setValidationErrors([])
    setSvgNotice("")

    try {
      const response = await fetch("/api/generate-poster", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: parsedPrompt.data }),
      })

      const rawJson: unknown = await response.json()

      if (!response.ok) {
        const safeParsed = posterResponseSchema.safeParse(rawJson)
        if (safeParsed.success) {
          setValidationErrors(
            safeParsed.data.validation_issues.length > 0
              ? safeParsed.data.validation_issues
              : [`Generation failed with status ${response.status}. Please try again.`]
          )
          return
        }

        setValidationErrors([`Generation failed with status ${response.status}. Please try again.`])
        return
      }

      const parsedResponse = posterResponseSchema.parse(rawJson)

      if (!parsedResponse.is_valid) {
        setValidationErrors(
          parsedResponse.validation_issues.length > 0
            ? parsedResponse.validation_issues
            : ["This request returned an invalid poster response. Please try again."]
        )
        return
      }

      if (!parsedResponse.html_code) {
        setValidationErrors(["Poster HTML was not returned. Please try again."])
        return
      }

      setIsFrameLoading(true)
      setPosterHtml(parsedResponse.html_code)
      setPosterName(slugifyName(parsedResponse.poster_name))
      setPosterDimensions(defaultPosterDimensions)
      setValidationErrors([])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate poster"
      setValidationErrors([message])
    } finally {
      setIsLoading(false)
    }
  }, [promptValue])

  const getIframeDocument = useCallback(() => {
    return iframeRef.current?.contentDocument ?? null
  }, [])

  const handlePreviewLoad = useCallback(() => {
    const run = async () => {
      const doc = getIframeDocument()
      if (!doc) {
        setIsFrameLoading(false)
        return
      }

      if (doc.fonts?.ready) {
        await doc.fonts.ready.catch(() => undefined)
      }

      await new Promise<void>((resolve) => {
        const win = doc.defaultView
        if (!win) {
          resolve()
          return
        }

        win.requestAnimationFrame(() => {
          win.requestAnimationFrame(() => {
            win.setTimeout(() => resolve(), 60)
          })
        })
      })

      const root = getPreviewRoot(doc)
      const measured = getElementDimensions(root)
      const edgeBuffer = 8

      setPosterDimensions({
        width: measured.width + edgeBuffer,
        height: measured.height + edgeBuffer,
      })
      setIsFrameLoading(false)
    }

    void run()
  }, [getIframeDocument])

  const exportHtml = useCallback(() => {
    if (!iframeSrcDoc) {
      return
    }

    const htmlBlob = new Blob([iframeSrcDoc], { type: "text/html" })
    triggerFileDownload(htmlBlob, `${posterName}.html`)
  }, [iframeSrcDoc, posterName])

  const exportRaster = useCallback(
    async (type: "png" | "jpg") => {
      if (!posterHtml) {
        setValidationErrors(["Generate a poster before exporting."])
        return
      }

      setValidationErrors([])
      setExportState(type === "png" ? "exporting-png" : "exporting-jpg")

      try {
        await withHiddenIframeDocument(posterHtml, async (doc) => {
          const target = doc.documentElement
          const targetWidth = Math.max(
            target.scrollWidth,
            target.clientWidth,
            defaultPosterDimensions.width
          )
          const targetHeight = Math.max(
            target.scrollHeight,
            target.clientHeight,
            defaultPosterDimensions.height
          )

          const computedBackground = doc.defaultView
            ? doc.defaultView.getComputedStyle(doc.body).backgroundColor
            : ""
          const backgroundColor =
            computedBackground && computedBackground !== "rgba(0, 0, 0, 0)"
              ? computedBackground
              : "#ffffff"

          const canvas = await html2canvas(target, {
            scale: 1,
            useCORS: true,
            backgroundColor,
            width: targetWidth,
            height: targetHeight,
            windowWidth: targetWidth,
            windowHeight: targetHeight,
            scrollX: 0,
            scrollY: 0,
          })

          const mimeType = type === "png" ? "image/png" : "image/jpeg"
          const quality = type === "png" ? undefined : 0.95
          const dataUrl = canvas.toDataURL(mimeType, quality)
          const anchor = document.createElement("a")
          anchor.href = dataUrl
          anchor.download = `${posterName}.${type}`
          document.body.appendChild(anchor)
          anchor.click()
          document.body.removeChild(anchor)
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Export failed"
        setValidationErrors([`Failed to export ${type.toUpperCase()}: ${message}`])
      } finally {
        setExportState("idle")
      }
    },
    [posterHtml, posterName]
  )

  const exportSvg = useCallback(async () => {
    if (!posterHtml) {
      setValidationErrors(["Generate a poster before exporting."])
      return
    }

    setValidationErrors([])
    setExportState("exporting-svg")

    try {
      await withHiddenIframeDocument(posterHtml, (doc) => {
        const targetRoot = getPosterRoot(doc)
        const rootSvg =
          targetRoot.tagName.toLowerCase() === "svg"
            ? targetRoot
            : targetRoot.querySelector("svg") ?? doc.querySelector("svg")
        if (!rootSvg) {
          setSvgNotice(
            "This poster uses CSS/HTML layout rather than a root SVG — PNG or JPG export is recommended."
          )
          return
        }

        const xml = new XMLSerializer().serializeToString(rootSvg)
        const svgBlob = new Blob([xml], { type: "image/svg+xml" })
        triggerFileDownload(svgBlob, `${posterName}.svg`)
        setSvgNotice("")
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed"
      setValidationErrors([`Failed to export SVG: ${message}`])
    } finally {
      setExportState("idle")
    }
  }, [posterHtml, posterName])

  const openFullSize = useCallback(() => {
    if (!iframeSrcDoc) {
      return
    }

    const blob = new Blob([iframeSrcDoc], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank", "noopener,noreferrer")
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }, [iframeSrcDoc])

  const scaledWidth = Math.ceil(posterDimensions.width * previewScale)
  const scaledHeight = Math.ceil(posterDimensions.height * previewScale)
  const isLandscapePoster = posterDimensions.width > posterDimensions.height

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans mb-12">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="font-heading text-xl font-bold flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-primary" />
          Poster Studio
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full min-h-[calc(100svh-65px)]">
        {!posterHtml && !isLoading ? (
           <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-12 max-w-4xl mx-auto w-full animate-in fade-in zoom-in duration-500">
             <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold text-center mb-6 tracking-tight">
               Design posters with <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">pure intent</span>.
             </h1>
             <p className="text-base sm:text-lg text-muted-foreground text-center mb-8 sm:mb-10 max-w-2xl">
               {"Describe your concept, vibe, and audience. We'll handle the typography, layout, and visual balance to craft a stunning poster in seconds."}
             </p>
             
             <div className="w-full relative shadow-2xl shadow-primary/5 rounded-xl bg-card border flex flex-col">
               <Textarea 
                  value={promptValue} 
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder="e.g. A retro 70s jazz concert poster in Tokyo, featuring moody orange and blue tones, bold stylized typography..."
                  className="w-full min-h-35 sm:min-h-40 p-4 sm:p-6 text-base sm:text-lg bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none"
               />
               <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center p-4 border-t bg-muted/20 rounded-b-xl">
                 <span className="text-xs text-muted-foreground sm:ml-2">Be as descriptive as you like.</span>
                 <Button size="lg" onClick={handleGeneratePoster} className="w-full sm:w-auto rounded-full px-6 sm:px-8 shadow-md font-semibold">
                   Generate Poster <ArrowRightIcon className="ml-2 w-4 h-4" />
                 </Button>
               </div>
             </div>

             {validationErrors.length > 0 && (
               <div className="mt-8 w-full">
                 <Alert variant="destructive">
                   <AlertTitle>Generation issue</AlertTitle>
                   <AlertDescription>
                     <ul className="list-disc space-y-1 pl-5">
                       {validationErrors.map((issue, index) => (
                         <li key={`${issue}-${index}`}>{issue}</li>
                       ))}
                     </ul>
                   </AlertDescription>
                 </Alert>
               </div>
             )}
           </div>
        ) : (
            <div className={cn("flex-1 flex w-full relative", isLandscapePoster ? "flex-col" : "flex-col md:flex-row md:h-full md:overflow-hidden")}>
              <div className={cn("bg-muted/30 relative flex items-center justify-center p-3 sm:p-4 md:p-8 overflow-hidden", isLandscapePoster ? "h-[58svh] sm:h-[62svh] md:h-[68svh]" : "min-h-[52svh] md:min-h-0 md:flex-1")}>
                 {isLoading && (
                    <div className="absolute inset-0 z-40 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                       <div className="max-w-sm w-full bg-card border shadow-xl rounded-2xl p-8 flex flex-col items-center animate-in zoom-in-95 duration-300">
                         <Loader2Icon className="w-12 h-12 text-primary animate-spin mb-6" />
                         <h3 className="font-heading text-lg font-semibold mb-6 text-center">Crafting your design</h3>
                         <div className="w-full space-y-4">
                            {progressStages.map((stage, i) => {
                               const isCurrent = i === progressStep;
                               const isComplete = i < progressStep;
                               return (
                                 <div key={stage} className={cn("flex items-center gap-3 transition-opacity duration-300", isCurrent || isComplete ? "opacity-100" : "opacity-40")}>
                                   <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border text-xs transition-colors", isComplete ? "bg-primary border-primary text-primary-foreground" : isCurrent ? "border-primary text-primary" : "border-muted-foreground/30")}>
                                      {isComplete ? <CheckIcon className="w-4 h-4" /> : (i + 1)}
                                   </div>
                                   <span className={cn("text-sm font-medium", isCurrent ? "text-primary animate-pulse" : isComplete ? "text-foreground" : "text-muted-foreground")}>{stage}</span>
                                 </div>
                               )
                            })}
                         </div>
                       </div>
                    </div>
                 )}

                 {posterHtml && (
                   <div ref={previewContainerRef} className="w-full h-full relative flex items-center justify-center">
                      <div className="relative shadow-2xl ring-1 ring-border/50 overflow-hidden bg-background" style={{
                        width: `${scaledWidth}px`,
                        height: `${scaledHeight}px`,
                      }}>
                        <iframe
                          ref={iframeRef}
                          title="Poster preview"
                          sandbox="allow-scripts"
                          srcDoc={iframeSrcDoc}
                          onLoad={handlePreviewLoad}
                          className="absolute top-0 left-0 border-0 bg-background"
                          style={{
                            width: `${posterDimensions.width}px`,
                            height: `${posterDimensions.height}px`,
                            transform: `scale(${previewScale})`,
                            transformOrigin: "top left",
                          }}
                        />
                        <div className={cn("pointer-events-none absolute inset-0 z-10 transition-opacity duration-500", isFrameLoading ? "opacity-100" : "opacity-0")}>
                          <Skeleton className="h-full w-full rounded-none" />
                        </div>
                      </div>
                   </div>
                 )}
              </div>

                <div className={cn("w-full bg-card border-t flex flex-col z-10", isLandscapePoster ? "h-auto" : "md:w-100 lg:w-112.5 md:border-t-0 md:border-l md:h-full md:overflow-y-auto")}>
                  <div className="p-4 sm:p-6 space-y-8 flex-1">
                   {validationErrors.length > 0 && (
                     <Alert variant="destructive">
                       <AlertTitle>Generation issue</AlertTitle>
                       <AlertDescription>
                         <ul className="list-disc space-y-1 pl-5">
                           {validationErrors.map((issue, index) => (
                             <li key={`${issue}-${index}`}>{issue}</li>
                           ))}
                         </ul>
                       </AlertDescription>
                     </Alert>
                   )}

                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <h3 className="font-heading font-semibold flex items-center gap-2">
                         <Wand2Icon className="w-4 h-4 text-primary" /> Refine Design
                       </h3>
                     </div>
                     <div className="relative flex flex-col group rounded-lg border focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all bg-background">
                       <Textarea 
                         value={promptValue} 
                         onChange={(e) => setPromptValue(e.target.value)}
                         className="min-h-30 text-sm resize-y border-0 focus-visible:ring-0 shadow-none pt-4 bg-transparent"
                         placeholder="Change the prompt to iterate..."
                       />
                       <div className="flex justify-end p-2 pb-3 pr-3 bg-background rounded-b-lg">
                         <Button 
                           disabled={isLoading}
                           onClick={handleGeneratePoster} 
                           size="sm" 
                           className="shadow-sm rounded-full">
                           {isLoading ? <Loader2Icon className="w-4 h-4 animate-spin mr-2" /> : <RefreshCwIcon className="w-4 h-4 mr-2" />}
                           {isLoading ? "Regenerating..." : "Regenerate"}
                         </Button>
                       </div>
                     </div>
                   </div>

                   <Separator />

                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-semibold flex items-center gap-2">
                          <DownloadIcon className="w-4 h-4 text-primary" /> Export
                        </h3>
                        <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={openFullSize} disabled={isLoading || !posterHtml}>
                           <ExternalLinkIcon className="w-3.5 h-3.5 mr-1.5" /> Open full size
                        </Button>
                      </div>
                      
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <Button variant="outline" className="h-12 font-medium justify-start px-4 bg-background" onClick={() => exportRaster('png')} disabled={exportState !== 'idle' || isLoading || !posterHtml}>
                            {exportState === 'exporting-png' ? <Loader2Icon className="w-4 h-4 animate-spin mr-3 text-muted-foreground" /> : <ImageIcon className="w-4 h-4 mr-3 text-muted-foreground" />}
                            PNG
                         </Button>
                         <Button variant="outline" className="h-12 font-medium justify-start px-4 bg-background" onClick={() => exportRaster('jpg')} disabled={exportState !== 'idle' || isLoading || !posterHtml}>
                            {exportState === 'exporting-jpg' ? <Loader2Icon className="w-4 h-4 animate-spin mr-3 text-muted-foreground" /> : <ImageIcon className="w-4 h-4 mr-3 text-muted-foreground" />}
                            JPG
                         </Button>
                         <Button variant="outline" className="h-12 font-medium justify-start px-4 bg-background" onClick={exportSvg} disabled={exportState !== 'idle' || isLoading || !posterHtml}>
                            {exportState === 'exporting-svg' ? <Loader2Icon className="w-4 h-4 animate-spin mr-3 text-muted-foreground" /> : <PenToolIcon className="w-4 h-4 mr-3 text-muted-foreground" />}
                            SVG
                         </Button>
                         <Button variant="outline" className="h-12 font-medium justify-start px-4 bg-background" onClick={exportHtml} disabled={isLoading}>
                            <CodeIcon className="w-4 h-4 mr-3 text-muted-foreground" /> HTML
                         </Button>
                      </div>
                      {svgNotice && <Alert className="bg-muted/50 py-2"><AlertDescription className="text-xs text-muted-foreground">{svgNotice}</AlertDescription></Alert>}
                   </div>

                   <Separator />

                   <div className="space-y-4">
                     <h3 className="font-heading font-semibold flex items-center gap-2">
                       <FileTextIcon className="w-4 h-4 text-primary" /> Design Specs
                     </h3>
                     <Accordion type="single" collapsible className="w-full space-y-2">
                        <AccordionItem value="intent" className="border rounded-lg bg-background px-1 overflow-hidden">
                           <AccordionTrigger className="text-sm px-3 hover:no-underline hover:bg-muted/30 rounded-t-lg transition-colors py-3">Resolved Intent</AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 px-3">
                            <p className="text-sm text-muted-foreground text-center py-4">Not included in fixed API response.</p>
                           </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="design" className="border rounded-lg bg-background px-1 overflow-hidden">
                           <AccordionTrigger className="text-sm px-3 hover:no-underline hover:bg-muted/30 rounded-t-lg transition-colors py-3">Style & Layout Details</AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 px-3">
                            <p className="text-sm text-muted-foreground text-center py-4">Not included in fixed API response.</p>
                           </AccordionContent>
                        </AccordionItem>
                     </Accordion>
                   </div>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  )
}
