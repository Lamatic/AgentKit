"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  ArrowRight,
  Terminal,
  GitBranch,
  GitPullRequest,
  FileCode,
  AlertTriangle,
  History,
  Activity,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Code,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
  Dices,
  Info
} from "lucide-react"
import { explainCode } from "@/actions/orchestrate"

// Types for code coordinate data
interface FileCoordinate {
  owner: string
  repo: string
  branch: string
  path: string
  startLine: number
  endLine: number
  symbolName: string
}

// Types for the analysis response
interface AnalysisData {
  coordinate: FileCoordinate
  unifiedPurpose: string
  purposeBasis?: string
  docstring?: string // Extracted symbol JSDoc comment
  coverageDashboard: {
    commitHistory: "STRONG" | "WEAK" | "NOT FOUND"
    prsIssues: "STRONG" | "WEAK" | "NOT FOUND"
    documentation: "STRONG" | "WEAK" | "NOT FOUND"
    invocations: "STRONG" | "WEAK" | "NOT FOUND"
  }
  architecturalIntent: {
    summary: string
    dependencies?: string[]
    notes?: string[]
  }
  originHistory: {
    summary: string
    originCommitFound: boolean
    relatedCommits: string[]
    commits: {
      oid: string
      message: string
      isLikelyOrigin?: boolean
    }[]
  }
  discussions: {
    prs: { number: number; title: string; body?: string }[]
    issues: { number: number; title: string; body?: string }[]
  }
  usages: {
    status: string
    files: {
      path: string
      resolvedLocalName: string
      fullContent?: string // Holds the full file content from context.usage
      invocations: {
        line: number | string
        snippet: string
        kind?: string
      }[]
      isDefinition?: boolean
    }[]
  }
}



// Supported language extensions validator helper
const SUPPORTED_EXTENSIONS = ["js", "jsx", "ts", "tsx", "py"]

function validateSupportedLanguage(url: string): { isValid: boolean; error?: string } {
  const trimmed = url.trim()
  if (!trimmed) return { isValid: true }

  const cleanUrl = trimmed.split("#")[0].split("?")[0]
  const extMatch = cleanUrl.match(/\.([a-zA-Z0-9]+)$/)

  if (!extMatch) return { isValid: true }

  const ext = extMatch[1].toLowerCase()
  if (SUPPORTED_EXTENSIONS.includes(ext)) {
    return { isValid: true }
  }

  return {
    isValid: false,
    error: `Unsupported .${ext} file. Only JS/TS (.js, .jsx, .ts, .tsx) and Python (.py) are supported.`
  }
}

export default function WhyThisCodePage() {
  const [inputUrl, setInputUrl] = useState("")
  const urlValidation = validateSupportedLanguage(inputUrl)
  const [view, setView] = useState<"welcome" | "loading" | "dashboard" | "error">("welcome")
  const [loadingStep, setLoadingStep] = useState(0)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [definitionExpanded, setDefinitionExpanded] = useState(true)
  const [usesExpanded, setUsesExpanded] = useState(true)
  const [originExpanded, setOriginExpanded] = useState(true)
  const [architectureExpanded, setArchitectureExpanded] = useState(false)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [isNewReferenceOpen, setIsNewReferenceOpen] = useState(false)

  // Loading timeline steps ("fetching issues etc")
  const loadingSteps = [
    { label: "Parsing GitHub Permalinks", desc: "Resolving branch references and targeted line ranges." },
    { label: "scanning codebase imports", desc: "Tracing module symbols and usage invocations." },
    { label: "fetching related commits", desc: "Searching author history and Git metadata." },
    { label: "fetching related pull requests", desc: "Indexing linked PR titles and pull closures." },
    { label: "fetching related issues", desc: "Crawling linked backlog items and tracker reports." },
    { label: "synthesizing intent & caveats", desc: "Evaluating JSDocs, frameworks, and warnings." },
    { label: "compiling coverage dashboard", desc: "Configuring metric status tags and package flags." }
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (view === "loading") {
      setLoadingStep(0)
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= loadingSteps.length - 1) {
            clearInterval(interval)
            return prev
          }
          return prev + 1
        })
      }, 950)
    }
    return () => clearInterval(interval)
  }, [view])

  const handleStartAnalysis = async (url: string) => {
    if (!url.trim()) return

    const validation = validateSupportedLanguage(url)
    if (!validation.isValid) {
      setErrorMessage(validation.error || "Unsupported file language")
      return
    }

    setErrorMessage(null)
    setView("loading")

    try {
      const response = await explainCode(url)

      if (response.success && response.data) {
        const { aiResponse, context } = response.data
        const raw = context.raw || context
        const usagesList = context.usage || []

        const parsedCoordinate = {
          owner: raw.owner || "suu-b",
          repo: raw.repo || "renaissance",
          branch: raw.ref || "main",
          path: raw.path || url,
          startLine: raw.startLine || 1,
          endLine: raw.endLine || 10,
          symbolName: raw.symbolName || "ResolvedSymbol"
        }

        const rawFiles = raw.usages?.files || []
        const mappedFiles = rawFiles.map((file: any) => {
          const matchingUsage = usagesList.find((u: any) => u.path === file.path)
          return {
            path: file.path,
            resolvedLocalName: file.resolvedLocalName,
            fullContent: file.content || file.fullContent || matchingUsage?.content || undefined,
            invocations: file.invocations || []
          }
        })

        // Prepend target/definition file
        if (raw.fileContent) {
          const isAlreadyIncluded = mappedFiles.some(f => f.path === parsedCoordinate.path)
          if (!isAlreadyIncluded) {
            const definitionInvocations = []
            for (let line = parsedCoordinate.startLine; line <= parsedCoordinate.endLine; line++) {
              definitionInvocations.push({ line, snippet: "" })
            }
            mappedFiles.unshift({
              path: parsedCoordinate.path,
              resolvedLocalName: parsedCoordinate.symbolName,
              fullContent: raw.fileContent,
              invocations: definitionInvocations,
              isDefinition: true
            })
          }
        }

        const mappedAnalysis: AnalysisData = {
          coordinate: parsedCoordinate,
          unifiedPurpose: aiResponse.unifiedPurpose || "No unified purpose provided.",
          docstring: raw.docstring || undefined,
          coverageDashboard: {
            commitHistory: aiResponse.coverageDashboard?.commitHistory || "NOT FOUND",
            prsIssues: aiResponse.coverageDashboard?.prsIssues || "NOT FOUND",
            documentation: aiResponse.coverageDashboard?.documentation || "NOT FOUND",
            invocations: aiResponse.coverageDashboard?.invocations || "NOT FOUND"
          },
          architecturalIntent: {
            summary: aiResponse.architecturalIntent?.summary || "No architectural summary generated.",
            warningsOrCaveats: aiResponse.architecturalIntent?.warningsOrCaveats || []
          },
          originHistory: {
            summary: aiResponse.originHistory?.summary || "No origin narrative generated.",
            originCommitFound: !!aiResponse.originHistory?.originCommitFound,
            relatedCommits: aiResponse.originHistory?.relatedCommits || [],
            commits: raw.history?.commits || []
          },
          discussions: {
            prs: raw.discussions?.prs || [],
            issues: raw.discussions?.issues || []
          },
          usages: {
            status: raw.usages?.status || "NOT FOUND",
            files: mappedFiles
          }
        }

        setAnalysis(mappedAnalysis)

        if (mappedAnalysis.usages.files.length > 0) {
          const firstPath = mappedAnalysis.usages.files[0].path
          setExpandedFiles({ [firstPath]: true })
          triggerAutoScroll(firstPath, mappedAnalysis.usages.files[0])
        }

        setTimeout(() => {
          setView("dashboard")
        }, 800)

      } else {
        const errorText = response.error || "Something went wrong"
        console.warn("Lamatic Flow returned error:", errorText)
        setErrorMessage(errorText)
        setView("error")
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Something went wrong"
      console.warn("Lamatic client connection error:", errorText)
      setErrorMessage(errorText)
      setView("error")
    }
  }

  const triggerAutoScroll = (path: string, fileData: any) => {
    const firstHighlightLine = fileData?.invocations?.[0]?.line
    if (!firstHighlightLine) return

    setTimeout(() => {
      const lineElement = document.getElementById(`line-${path}-${firstHighlightLine}`)
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 250)
  }

  const handleSuggestionClick = (pathOrUrl: string) => {
    const fullUrl = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : `https://github.com/Lamatic/AgentKit/blob/main/${pathOrUrl}`
    setInputUrl(fullUrl)
    handleStartAnalysis(fullUrl)
  }

  const toggleFile = (path: string, fileData: any) => {
    const isNowExpanded = !expandedFiles[path]
    setExpandedFiles(prev => ({
      ...prev,
      [path]: isNowExpanded
    }))

    if (isNowExpanded) {
      triggerAutoScroll(path, fileData)
    }
  }

  const handleReset = () => {
    setView("welcome")
    setInputUrl("")
    setAnalysis(null)
    setExpandedFiles({})
    setErrorMessage(null)
    setIsNewReferenceOpen(false)
  }

  // Colored badge helper function
  const renderBadge = (status: "STRONG" | "WEAK" | "NOT FOUND", labelPrefix: string) => {
    let classes = ""
    switch (status) {
      case "STRONG":
        classes = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        break
      case "WEAK":
        classes = "bg-amber-500/10 text-amber-400 border-amber-500/20"
        break
      case "NOT FOUND":
        classes = "bg-rose-500/10 text-rose-400 border-rose-500/20"
        break
    }
    return (
      <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${classes}`}>
        {status}
      </span>
    )
  }

  const mapPurposeBasis = (basis?: string) => {
    switch (basis) {
      case "issue-title-fallback": return "based on issue title, not detailed discussion"
      case "pr-or-issue-discussion": return "based on detailed PR/issue discussion"
      case "code-shape-only": return "based on code structure only"
      case "insufficient-evidence": return "insufficient evidence"
      default: return basis || ""
    }
  }

  const renderKindPill = (kind?: string) => {
    const normKind = kind || "other"
    let colorClass = "bg-neutral-800 text-neutral-400 border-neutral-700"
    if (normKind === "framework-registration") {
      colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20"
    } else if (normKind === "instantiation") {
      colorClass = "bg-purple-500/10 text-purple-400 border-purple-500/20"
    } else if (normKind === "direct-call") {
      colorClass = "bg-green-500/10 text-green-400 border-green-500/20"
    }
    return (
      <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-medium tracking-wide ${colorClass}`}>
        {normKind.replace("-", " ")}
      </span>
    )
  }

  // Slice loading steps up to the active step for the console fader effect
  const activeSteps = loadingSteps.slice(0, loadingStep + 1)
  const visibleLogs = activeSteps.slice(-3) // Show last 3 steps

  return (
    <div className="min-h-screen text-foreground bg-background relative flex flex-col font-sans">

      {/* HEADER BAR */}
      <header className="border-b border-border bg-[#0B0C0E]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="cursor-pointer group" onClick={handleReset}>
            <h1 className="text-xs font-semibold tracking-wide text-neutral-300 group-hover:text-white uppercase transition">
              Why This Code?
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {view === "dashboard" && (
              <div className="relative">
                <button
                  onClick={() => {
                    const nextState = !isNewReferenceOpen
                    if (nextState) {
                      setInputUrl("")
                    }
                    setIsNewReferenceOpen(nextState)
                  }}
                  className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white hover:border-neutral-600 transition"
                >
                  <RotateCcw className="h-3 w-3" />
                  New Reference
                </button>

                {isNewReferenceOpen && (
                  <div className="absolute right-0 mt-2 w-80 p-4 rounded border border-neutral-800 bg-[#0E0F12] shadow-2xl z-50 animate-fade-in">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!urlValidation.isValid) return
                        setIsNewReferenceOpen(false)
                        handleStartAnalysis(inputUrl)
                      }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                          New Reference
                        </h4>
                        <span className="text-[9px] text-neutral-500 font-mono">
                          JS/TS & Py only
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 p-1.5 rounded border bg-[#07080a] transition ${
                        !urlValidation.isValid
                          ? "border-rose-500/80 focus-within:border-rose-500"
                          : "border-neutral-800 focus-within:border-neutral-700"
                      }`}>
                        <input
                          type="text"
                          value={inputUrl}
                          onChange={(e) => setInputUrl(e.target.value)}
                          placeholder="Paste GitHub permalink (e.g. https://github.com/.../orchestrate.ts)"
                          className="w-full bg-transparent text-white border-0 outline-none placeholder:text-neutral-600 text-xs px-1"
                        />
                        <button
                          type="submit"
                          disabled={!inputUrl.trim() || !urlValidation.isValid}
                          className="p-1.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white hover:border-neutral-600 transition flex-shrink-0"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                      {!urlValidation.isValid ? (
                        <p className="text-[10px] text-rose-400 flex items-center gap-1 font-sans">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          {urlValidation.error}
                        </p>
                      ) : (
                        <p className="text-[9.5px] text-neutral-500 leading-normal">
                          Supported languages: <code className="text-neutral-400 font-mono">.js, .jsx, .ts, .tsx, .py</code>
                        </p>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )}
            <a
              href="https://github.com/Lamatic/AgentKit"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-neutral-400 hover:text-white transition flex items-center gap-1"
            >
              Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      {/* VIEW 1: WELCOME SCREEN */}
      {view === "welcome" && (
        <main className="flex-1 max-w-3xl mx-auto px-6 flex flex-col items-center justify-center pt-20 pb-16 relative z-10 w-full">
          <div className="text-center mb-10 fade-in-slide">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Why This Code?
            </h2>
            <p className="mt-3 text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              Analyze commits, linked issues, pull requests, and usage mappings from a single GitHub permalink.
            </p>
          </div>

          {/* ChatGPT-like Search Bar */}
          <div className="w-full fade-in-slide" style={{ animationDelay: "80ms" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!urlValidation.isValid) return
                handleStartAnalysis(inputUrl)
              }}
              className={`relative p-1 rounded border bg-[#0E0F12] shadow-2xl transition duration-150 ${
                !urlValidation.isValid
                  ? "border-rose-500/80 focus-within:border-rose-500"
                  : "border-neutral-800 focus-within:border-neutral-600"
              }`}
            >
              <div className="flex items-center gap-3 px-2">
                <Search className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste GitHub permalink (e.g. https://github.com/.../orchestrate.ts)"
                  className="w-full py-2.5 bg-transparent text-white border-0 outline-none placeholder:text-neutral-600 text-xs"
                />
                <button
                  type="submit"
                  disabled={!inputUrl.trim() || !urlValidation.isValid}
                  className="p-2 rounded border border-neutral-800 bg-neutral-900 text-neutral-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white hover:border-neutral-600 hover:bg-neutral-800/40 transition flex-shrink-0"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            {/* Language support hint or Validation warning */}
            <div className="mt-2.5 px-1 flex items-center justify-between text-[10.5px]">
              {!urlValidation.isValid ? (
                <p className="text-rose-400 flex items-center gap-1.5 font-medium animate-fade-in">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
                  {urlValidation.error}
                </p>
              ) : (
                <p className="text-neutral-500 font-sans flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-neutral-500" />
                  Supported languages: <span className="text-neutral-400 font-medium">JavaScript, TypeScript, Python</span>
                  <span className="text-neutral-600 font-mono">(.js, .jsx, .ts, .tsx, .py)</span>
                </p>
              )}
            </div>

            {/* Suggestions Panel */}
            <div className="mt-12 w-full">
              <h3 className="text-[10px] uppercase font-medium text-neutral-500 tracking-wider mb-3 flex items-center gap-1.5">
                <Terminal className="h-3 w-3" />
                Example Scan
              </h3>
              <div className="w-full">
                <button
                  onClick={() =>
                    handleSuggestionClick(
                      "https://github.com/suu-b/renaissance/blob/main/apps/remote-service/src/services/bootstrap/bootstrap-service.ts#L7"
                    )
                  }
                  className="w-full p-4 rounded-lg border border-neutral-900 bg-neutral-950/30 hover:bg-neutral-900/40 hover:border-neutral-800 text-left transition duration-150 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-neutral-400 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">renaissance</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-300 group-hover:text-white truncate">
                    bootstrap-service.ts
                  </h4>
                  <p className="text-[10px] text-neutral-500 line-clamp-2 mt-1 leading-normal font-mono">
                    apps/remote-service/src/services/bootstrap/bootstrap-service.ts#L7
                  </p>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: LOADING TIMELINE (SPINNING DICE ICON + DYNAMIC CONSOLE LOG FEED) */}
      {view === "loading" && (
        <main className="flex-1 max-w-xl mx-auto px-6 flex flex-col items-center justify-center pt-16 pb-16 relative z-10 w-full animate-fade-in">

          {/* SMOOTHLY SPINNING DICES ICON */}
          <div className="flex items-center justify-center mb-12">
            <Dices className="h-16 w-16 text-neutral-400 animate-[spin_2.2s_linear_infinite]" />
          </div>

          {/* DYNAMIC CONSOLE LOG FADER FEED */}
          <div className="w-full flex flex-col items-center justify-center min-h-[7.5rem] space-y-3 relative">
            {visibleLogs.map((log, index) => {
              const positionFromEnd = visibleLogs.length - 1 - index
              let opacityClass = "opacity-100 text-white font-medium scale-100"
              let transformClass = "translate-y-0"

              if (positionFromEnd === 1) {
                opacityClass = "opacity-40 text-neutral-400 scale-95"
                transformClass = "-translate-y-1"
              } else if (positionFromEnd === 2) {
                opacityClass = "opacity-15 text-neutral-500 scale-90"
                transformClass = "-translate-y-2.5"
              }

              return (
                <div
                  key={log.label}
                  className={`text-center transition-all duration-300 transform ${opacityClass} ${transformClass}`}
                >
                  <span className="text-[11px] uppercase tracking-widest block font-mono">
                    {log.label}
                  </span>
                  {positionFromEnd === 0 && (
                    <span className="text-[10px] text-neutral-500 mt-1.5 block max-w-xs mx-auto animate-pulse leading-normal font-sans">
                      {log.desc}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

        </main>
      )}

      {/* VIEW 3: SPLIT LAYOUT DASHBOARD (CLAUDE CANVAS STYLE - 50/50 SPLIT) */}
      {view === "dashboard" && analysis && (
        <main className="flex-1 flex flex-col relative z-10 w-full border-t border-border bg-[#0B0C0E]">



          {/* CLAUDE CANVAS 50/50 GRID */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

            {/* LEFT PANEL: ANALYSIS RECORDS (50% WIDTH) */}
            <div className="p-8 overflow-y-auto space-y-6 max-h-[calc(100vh-4rem)]">

              {/* TOP REFERENCE BLOCK */}
              <div>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono mb-1">
                  <span>{analysis.coordinate.owner}</span>
                  <span>/</span>
                  <span>{analysis.coordinate.repo}</span>
                  <span>/</span>
                  <span>{analysis.coordinate.branch}</span>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCode className="h-4.5 w-4.5 text-neutral-400" />
                  {analysis.coordinate.symbolName}
                  <span className="text-[11px] font-normal text-neutral-500 font-mono">
                    ({analysis.coordinate.path.split("/").pop()})
                  </span>
                </h3>

                {/* Extracted Docstring / JSDoc Comment Block */}
                {analysis.docstring && (
                  <div className="mt-3 border-l border-neutral-800 pl-4 py-1.5 font-mono text-[10.5px] text-neutral-500 whitespace-pre-wrap leading-relaxed select-text">
                    {analysis.docstring}
                  </div>
                )}
              </div>

              {/* UNIFIED PURPOSE */}
              <div className="py-2">
                <h2 className="text-base font-semibold text-neutral-200 leading-relaxed">
                  {analysis.unifiedPurpose}
                </h2>
                {analysis.purposeBasis && (
                  <p className="text-[10px] text-neutral-500 mt-2 flex items-center gap-1.5 font-mono select-none">
                    <Info className="h-3 w-3 text-neutral-600" />
                    {mapPurposeBasis(analysis.purposeBasis)}
                  </p>
                )}
              </div>

              {/* ACCORDION: ORIGIN */}
              <div className="border border-border rounded bg-[#111215]/30 overflow-hidden">
                <button
                  onClick={() => setOriginExpanded(!originExpanded)}
                  className="w-full px-5 py-3 flex items-center justify-between text-left focus:outline-none bg-neutral-950/45 hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-xs font-semibold text-neutral-300">Origin</span>
                  </div>
                  {originExpanded ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
                </button>
                {originExpanded && (
                  <div className="p-5 border-t border-neutral-800/50 space-y-4">
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {analysis.originHistory.summary}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {analysis.originHistory.commits?.map((commit, i) => (
                        <a
                          key={i}
                          href={`https://github.com/${analysis.coordinate.owner}/${analysis.coordinate.repo}/commit/${commit.oid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400 hover:text-white hover:border-neutral-600 transition flex items-center gap-1.5"
                        >
                          <GitBranch className="h-2.5 w-2.5 text-neutral-500" />
                          {commit.oid.substring(0, 7)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION: ARCHITECTURE */}
              <div className="border border-border rounded bg-[#111215]/30 overflow-hidden">
                <button
                  onClick={() => setArchitectureExpanded(!architectureExpanded)}
                  className="w-full px-5 py-3 flex items-center justify-between text-left focus:outline-none bg-neutral-950/45 hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-xs font-semibold text-neutral-300">Architecture</span>
                  </div>
                  {architectureExpanded ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
                </button>
                {architectureExpanded && (
                  <div className="p-5 border-t border-neutral-800/50 space-y-4">
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {analysis.architecturalIntent.summary}
                    </p>
                    {analysis.architecturalIntent.dependencies && analysis.architecturalIntent.dependencies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {analysis.architecturalIntent.dependencies.map((dep, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300">
                            {dep}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACCORDION: NOTES */}
              {analysis.architecturalIntent.notes && analysis.architecturalIntent.notes.length > 0 && (
                <div className="border border-border rounded bg-[#111215]/30 overflow-hidden">
                  <button
                    onClick={() => setNotesExpanded(!notesExpanded)}
                    className="w-full px-5 py-3 flex items-center justify-between text-left focus:outline-none bg-neutral-950/45 hover:bg-neutral-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-xs font-semibold text-neutral-300">Notes</span>
                    </div>
                    {notesExpanded ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
                  </button>
                  {notesExpanded && (
                    <div className="p-5 border-t border-neutral-800/50 space-y-3">
                      {analysis.architecturalIntent.notes.map((note, i) => {
                        const isWarning = note.startsWith("WARNING:");
                        const isGap = note.startsWith("GAP:");
                        const text = note.replace(/^(WARNING|GAP):\s*/, "");
                        return (
                          <div key={i} className="flex gap-2.5 items-start">
                            {isWarning ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Info className="h-3.5 w-3.5 text-neutral-500 mt-0.5 flex-shrink-0" />
                            )}
                            <span className="text-xs text-neutral-400 leading-relaxed">{text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* CARD 4: DISCUSSIONS (PRs and Issues with description bodies) */}
              <div className="p-5 rounded border border-border bg-[#111215]/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] uppercase font-medium text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <GitPullRequest className="h-3.5 w-3.5" />
                    Linked discussions
                  </h3>
                  {renderBadge(analysis.coverageDashboard.prsIssues, "DISCUSSIONS")}
                </div>

                <div className="space-y-4">
                  {/* PRs */}
                  <div>
                    <h4 className="text-[9px] uppercase font-semibold text-neutral-500 flex items-center gap-1.5 mb-2">
                      <GitPullRequest className="h-3 w-3" />
                      <span>Linked Pull Requests</span>
                    </h4>
                    {analysis.discussions.prs.length > 0 ? (
                      <div className="space-y-2.5">
                        {analysis.discussions.prs.map((pr, i) => (
                          <div key={i} className="text-[10.5px] p-3 rounded border border-neutral-900 bg-neutral-950/20 group hover:border-neutral-700 transition duration-150">
                            <div className="flex items-center justify-between mb-1.5">
                              <a
                                href={`https://github.com/${analysis.coordinate.owner}/${analysis.coordinate.repo}/pull/${pr.number}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neutral-300 group-hover:text-white font-medium font-mono hover:underline flex items-center gap-1"
                              >
                                #{pr.number}
                                <ExternalLink className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                              </a>
                              <span className="text-neutral-400 group-hover:text-white transition font-semibold truncate flex-1 ml-3">{pr.title}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 border-t border-neutral-900/50 pt-1.5 leading-relaxed whitespace-pre-line font-sans pl-1">
                              {pr.body && pr.body.trim() ? pr.body.trim() : "No description provided."}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral-600 pl-4 italic">No related PRs identified.</p>
                    )}
                  </div>

                  {/* Issues */}
                  <div>
                    <h4 className="text-[9px] uppercase font-semibold text-neutral-500 flex items-center gap-1.5 mb-2">
                      <AlertCircle className="h-3 w-3" />
                      <span>Linked Issues</span>
                    </h4>
                    {analysis.discussions.issues.length > 0 ? (
                      <div className="space-y-2.5">
                        {analysis.discussions.issues.map((issue, i) => (
                          <div key={i} className="text-[10.5px] p-3 rounded border border-neutral-900 bg-neutral-950/20 group hover:border-neutral-700 transition duration-150">
                            <div className="flex items-center justify-between mb-1.5">
                              <a
                                href={`https://github.com/${analysis.coordinate.owner}/${analysis.coordinate.repo}/issues/${issue.number}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neutral-300 group-hover:text-white font-medium font-mono hover:underline flex items-center gap-1"
                              >
                                #{issue.number}
                                <ExternalLink className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                              </a>
                              <span className="text-neutral-400 group-hover:text-white transition font-semibold truncate flex-1 ml-3">{issue.title}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 border-t border-neutral-900/50 pt-1.5 leading-relaxed whitespace-pre-line font-sans pl-1">
                              {issue.body && issue.body.trim() ? issue.body.trim() : "No description provided."}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral-600 pl-4 italic">No related issues identified.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT PANEL: CLAUDE CANVAS CODE VIEWER (50% WIDTH) */}
            <div className="p-8 overflow-y-auto max-h-[calc(100vh-4rem)] space-y-8 flex flex-col">

              {/* DEFINITION SECTION */}
              {(() => {
                const definitionFile = analysis.usages.files.find(f => f.isDefinition)
                if (!definitionFile) return null
                const isFileExpanded = !!expandedFiles[definitionFile.path]
                const highlightLines = new Set(definitionFile.invocations.map(inv => inv.line))

                return (
                  <div className="flex flex-col">
                    <button
                      onClick={() => setDefinitionExpanded(!definitionExpanded)}
                      className="w-full flex items-center justify-between pb-4 mb-4 border-b border-border text-left group focus:outline-none"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-300 group-hover:text-white flex items-center gap-2 transition">
                          <Code className="h-4.5 w-4.5 text-neutral-400 group-hover:text-white transition" />
                          Definition
                        </h3>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Target code block defining the reference coordinate.</p>
                      </div>
                      {definitionExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400 group-hover:text-white transition" /> : <ChevronDown className="h-4 w-4 text-neutral-400 group-hover:text-white transition" />}
                    </button>

                    {definitionExpanded && (
                      <div
                        className={`rounded border overflow-hidden transition-all duration-150 bg-[#0F1014] ${isFileExpanded ? "border-neutral-700 shadow-xl" : "border-neutral-900/60 hover:border-neutral-800"
                          }`}
                      >
                        <button
                          onClick={() => toggleFile(definitionFile.path, definitionFile)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none bg-neutral-950/45 border-b border-neutral-900/50"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <FileCode className={`h-4.5 w-4.5 flex-shrink-0 transition-colors ${isFileExpanded ? "text-white" : "text-neutral-500"
                              }`} />
                            <div className="min-w-0">
                              <span className="text-xs text-neutral-300 font-mono block truncate transition">
                                {definitionFile.path.split("/").pop()}
                              </span>
                              <span className="text-[9px] text-neutral-500 block truncate font-mono mt-0.2">
                                {definitionFile.path.split("/").slice(0, -1).join("/")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {isFileExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                          </div>
                        </button>

                        {isFileExpanded && (
                          <div className="bg-[#0A0F1D]">
                            {definitionFile.fullContent ? (
                              <div className="max-h-[22rem] overflow-y-auto scrollbar-thin relative bg-[#090D1A] code-viewport select-text">
                                <table className="w-full border-collapse text-[10.5px] font-mono leading-relaxed tracking-tight text-slate-300">
                                  <tbody>
                                    {definitionFile.fullContent.split(/\r?\n/).map((lineText, lineIdx) => {
                                      const prefixMatch = lineText.match(/^L(\d+): (.*)$/)
                                      let displayLineNum: string | number = lineIdx + 1
                                      let displayText = lineText
                                      let isHighlighted = false

                                      if (prefixMatch) {
                                        const actualNum = parseInt(prefixMatch[1], 10)
                                        displayLineNum = actualNum
                                        displayText = prefixMatch[2]
                                        isHighlighted = highlightLines.has(actualNum)
                                      } else {
                                        isHighlighted = highlightLines.has(lineIdx + 1)
                                      }

                                      const isSkipComment = lineText.startsWith("// ... [lines") && lineText.endsWith("] ...")
                                      if (isSkipComment) {
                                        displayLineNum = "..."
                                        displayText = lineText
                                      }

                                      return (
                                        <tr 
                                          key={lineIdx} 
                                          id={`line-${definitionFile.path}-${displayLineNum}`}
                                          className={`group transition-all ${
                                            isHighlighted 
                                              ? "bg-sky-500/10 border-l-2 border-sky-400 shadow-[inset_3px_0_0_0_rgba(56,189,248,0.2)] text-white font-medium" 
                                              : "hover:bg-slate-900/30"
                                          }`}
                                        >
                                          <td className={`w-9 select-none border-r border-slate-900 text-right pr-2.5 font-mono align-top py-0.3 ${
                                            isHighlighted ? "text-sky-300 font-bold" : "text-slate-600/70 group-hover:text-slate-500"
                                          }`}>
                                            {displayLineNum}
                                          </td>
                                          <td className="pl-3.5 whitespace-pre py-0.3 font-mono font-normal">
                                            {displayText || " "}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-3 text-[10.5px] font-mono text-slate-400 bg-[#090D1A]">
                                No content loaded.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* USES SECTION */}
              {(() => {
                const usageFiles = analysis.usages.files.filter(f => !f.isDefinition)
                if (usageFiles.length === 0) return null

                return (
                  <div className="flex flex-col flex-1">
                    <button
                      onClick={() => setUsesExpanded(!usesExpanded)}
                      className="w-full flex items-center justify-between pb-4 mb-4 border-b border-border text-left group focus:outline-none"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-300 group-hover:text-white flex items-center gap-2 transition">
                          <Code className="h-4.5 w-4.5 text-neutral-400 group-hover:text-white transition" />
                          Uses
                        </h3>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Codebase reference slices matching import structures.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {renderBadge(analysis.coverageDashboard.invocations, "INVOCATIONS")}
                        {usesExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400 group-hover:text-white transition" /> : <ChevronDown className="h-4 w-4 text-neutral-400 group-hover:text-white transition" />}
                      </div>
                    </button>

                    {usesExpanded && (
                      <div className="space-y-4">
                        {usageFiles.map((file, idx) => {
                          const isExpanded = !!expandedFiles[file.path]
                          const highlightLines = new Set(file.invocations.map(inv => Number(inv.line)))

                          return (
                            <div
                              key={idx}
                              className={`rounded border overflow-hidden transition-all duration-150 bg-[#0F1014] ${isExpanded ? "border-neutral-700 shadow-xl" : "border-neutral-900/60 hover:border-neutral-800"
                                }`}
                            >
                              <button
                                onClick={() => toggleFile(file.path, file)}
                                className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none bg-neutral-950/45 border-b border-neutral-900/50"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <FileCode className={`h-4.5 w-4.5 flex-shrink-0 transition-colors ${isExpanded ? "text-white" : "text-neutral-500"
                                    }`} />
                                  <div className="min-w-0">
                                    <span className="text-xs text-neutral-300 font-mono block truncate transition">
                                      {file.path.split("/").pop()}
                                    </span>
                                    <span className="text-[9px] text-neutral-500 block truncate font-mono mt-0.2">
                                      {file.path.split("/").slice(0, -1).join("/")}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <span className="text-[9px] px-1.5 py-0.2 rounded border border-neutral-900 bg-neutral-950/60 text-neutral-400 font-mono">
                                    import: {file.resolvedLocalName}
                                  </span>
                                  {isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="bg-[#0A0F1D] border-t border-slate-900">
                                  {file.fullContent ? (
                                    <div className="max-h-[30rem] overflow-y-auto scrollbar-thin relative bg-[#090D1A] code-viewport select-text">
                                      <table className="w-full border-collapse text-[10.5px] font-mono leading-relaxed tracking-tight text-slate-300">
                                        <tbody>
                                          {file.fullContent.split(/\r?\n/).map((lineText, lineIdx) => {
                                            const prefixMatch = lineText.match(/^L(\d+): (.*)$/)
                                            let displayLineNum: string | number = lineIdx + 1
                                            let displayText = lineText
                                            let isHighlighted = false

                                            if (prefixMatch) {
                                              const actualNum = parseInt(prefixMatch[1], 10)
                                              displayLineNum = actualNum
                                              displayText = prefixMatch[2]
                                              isHighlighted = highlightLines.has(actualNum)
                                            } else {
                                              isHighlighted = highlightLines.has(lineIdx + 1)
                                            }

                                            const isSkipComment = lineText.startsWith("// ... [lines") && lineText.endsWith("] ...")
                                            if (isSkipComment) {
                                              displayLineNum = "..."
                                              displayText = lineText
                                            }

                                            const inv = isHighlighted 
                                              ? file.invocations.find(i => String(i.line) === String(displayLineNum))
                                              : null
                                            return (
                                              <tr
                                                key={lineIdx}
                                                id={`line-${file.path}-${displayLineNum}`}
                                                className={`group transition-all ${
                                                  isHighlighted
                                                    ? "bg-sky-500/10 border-l-2 border-sky-400 text-white font-medium shadow-[inset_3px_0_0_0_rgba(56,189,248,0.2)]"
                                                    : "hover:bg-slate-900/30"
                                                }`}
                                              >
                                                <td className={`w-9 select-none border-r border-slate-900 text-right pr-2.5 font-mono align-top py-0.3 ${
                                                  isHighlighted ? "text-sky-300 font-bold" : "text-slate-600/70 group-hover:text-slate-500"
                                                }`}>
                                                  {displayLineNum}
                                                </td>
                                                <td className="pl-3.5 whitespace-pre py-0.3 font-mono font-normal">
                                                  {isHighlighted && inv?.kind && (
                                                    <span className="inline-block mr-2 select-none scale-75 origin-left animate-fade-in">
                                                      {renderKindPill(inv.kind)}
                                                    </span>
                                                  )}
                                                  {displayText || " "}
                                                </td>
                                              </tr>
                                            )
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="p-4 flex flex-col space-y-4">
                                      {file.invocations.map((inv, i) => (
                                        <div key={i} className="flex flex-col gap-1.5 transition-all duration-300">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-neutral-500 w-8 flex-shrink-0">L{inv.line}</span>
                                            {renderKindPill(inv.kind)}
                                          </div>
                                          <div className="ml-10 bg-[#06080F]/50 rounded border border-neutral-900/60 p-2 overflow-x-auto">
                                            <code className="text-[10.5px] font-mono text-neutral-300 whitespace-pre">
                                              {inv.snippet}
                                            </code>
                                          </div>
                                        </div>
                                      ))}
                                      {file.invocations.length === 0 && (
                                        <p className="text-[10px] text-neutral-500 italic">No specific invocations matched.</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}

            </div>

          </div>

        </main>
      )}

      {/* VIEW 4: ERROR SCREEN */}
      {view === "error" && (
        <main className="flex-1 max-w-xl mx-auto px-6 flex flex-col items-center justify-center pt-20 pb-20 relative z-10 w-full animate-fade-in">
          <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 mb-6">
            <AlertCircle className="h-10 w-10 text-rose-400" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              Analysis Failed
            </h2>
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              We encountered an issue processing the requested code reference.
            </p>
          </div>

          {/* ERROR DISPLAY CARD */}
          <div className="mt-8 w-full p-5 rounded-lg border border-rose-500/30 bg-[#140C0E]/90 shadow-2xl space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-[11px] font-mono uppercase font-semibold tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Error Details</span>
            </div>
            <p className="text-xs text-neutral-200 font-mono leading-relaxed select-text bg-[#0A0708] p-3 rounded border border-rose-950/80 whitespace-pre-wrap">
              {errorMessage || "Something went wrong"}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-md border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition flex items-center gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try Another Reference
            </button>
          </div>
        </main>
      )}

    </div>
  )
}
