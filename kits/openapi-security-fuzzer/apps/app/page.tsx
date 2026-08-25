"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldAlert, ShieldCheck, Play, ArrowRight, Code, ListFilter, AlertTriangle, FileText, UploadCloud, CheckCircle2, ChevronRight, Activity, Settings2, Shield, User, Download } from "lucide-react"
import { generatePayloads, executeTestsOnly, analyzeResultsOnly } from "@/actions/orchestrate"
import { TestPayload } from "@/lib/executor"

export default function SecurityFuzzerPage() {
  const [activeTab, setActiveTab] = useState<'specs' | 'payloads' | 'execute' | 'results'>('specs')
  
  // Specs State
  const [openapiSpec, setOpenapiSpec] = useState("")
  const [fileName, setFileName] = useState("No file selected")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPayloads, setGeneratedPayloads] = useState<TestPayload[]>([])
  
  // Execute State
  const [baseUrl, setBaseUrl] = useState("")
  const [authHeader, setAuthHeader] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResults, setExecutionResults] = useState<any>(null)
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisReport, setAnalysisReport] = useState<any>(null)
  
  // Error state
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setOpenapiSpec(event.target.result as string)
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setOpenapiSpec(event.target.result as string)
      }
    }
    reader.readAsText(file)
  }

  const handleGeneratePayloads = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!openapiSpec.trim()) {
      setError("Please provide an OpenAPI Specification")
      return
    }

    setIsGenerating(true)
    setError("")
    
    try {
      const response = await generatePayloads(openapiSpec)
      if (response.success && Array.isArray(response.data)) {
        setGeneratedPayloads(response.data)
        setActiveTab('payloads')
      } else {
        setError(response.error || "Failed to generate payloads. Please try again.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRunTests = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!baseUrl.trim()) {
      setError("Target Base URL is required to run tests.")
      return
    }

    setIsExecuting(true)
    setError("")
    setExecutionResults(null)
    
    try {
      const response = await executeTestsOnly(baseUrl, authHeader, generatedPayloads)
      if (response.success) {
        setExecutionResults(response.data)
      } else {
        setError(response.error || "Failed to execute tests.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsExecuting(false)
    }
  }

  const handleAnalyzeResults = async () => {
    if (!executionResults || generatedPayloads.length === 0 || !openapiSpec) return

    setIsAnalyzing(true)
    setError("")
    
    try {
      const response = await analyzeResultsOnly(openapiSpec, generatedPayloads, executionResults)
      if (response.success) {
        setAnalysisReport(response.data)
        setActiveTab('results')
      } else {
        setError(response.error || "Failed to analyze results.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getParsedPayloads = () => {
    return generatedPayloads.map(payload => {
      let parsedPayload = payload.payload;
      let parsedHeaders = payload.headers;
      
      if (typeof payload.payload === 'string') {
        try { parsedPayload = JSON.parse(payload.payload) } catch(e) {}
      }
      if (typeof payload.headers === 'string') {
        try { parsedHeaders = JSON.parse(payload.headers as string) } catch(e) {}
      }
      
      return {
        ...payload,
        payload: parsedPayload,
        headers: parsedHeaders
      }
    });
  }

  const handleExportPayloads = () => {
    if (generatedPayloads.length === 0) return
    const exportData = getParsedPayloads()
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "fuzzer-payloads.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const handleExportPostmanCollection = () => {
    if (generatedPayloads.length === 0) return

    const exportData = getParsedPayloads()

    const postmanCollection = {
      info: {
        name: "Fuzzer Generated Tests",
        description: "Security tests generated by FUZZER.IO",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: exportData.map(payload => ({
        name: `[${payload.category}] ${payload.test_id}`,
        request: {
          method: payload.method,
          header: Object.entries(payload.headers || {}).map(([key, value]) => ({
            key,
            value: value as string
          })),
          url: {
            raw: `{{baseUrl}}${payload.path}`,
            host: ["{{baseUrl}}"],
            path: payload.path.split('/').filter(p => p)
          },
          body: payload.payload && Object.keys(payload.payload).length > 0 ? {
            mode: "raw",
            raw: JSON.stringify(payload.payload, null, 2),
            options: {
              raw: {
                language: "json"
              }
            }
          } : undefined
        }
      }))
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(postmanCollection, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "fuzzer-postman-collection.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  // Helper to extract a clean preview of the YAML/JSON
  const getPreviewSpec = () => {
    if (!openapiSpec) return ""
    return openapiSpec.split('\n').slice(0, 15).join('\n') + (openapiSpec.split('\n').length > 15 ? '\n...' : '')
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 pb-24 font-sans selection:bg-indigo-500/30">
      {/* TOP HEADER */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800/50 flex items-center justify-center">
            <Shield className="w-4 h-4 text-slate-300" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white">FUZZER.IO</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
           <User className="w-4 h-4 text-slate-400" />
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-200 font-medium text-sm">{error}</p>
          </div>
        )}

        {/* TAB 1: SPECS */}
        {activeTab === 'specs' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Target Spec</h2>
              <p className="text-slate-400 text-sm">
                Review the active OpenAPI schema before initiating payload generation sequence.
              </p>
            </div>

            {/* Code Block Container */}
            <div className="rounded-xl border border-slate-800 bg-[#162032] overflow-hidden shadow-lg shadow-black/20">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/40">
                <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
                  <Code className="w-4 h-4" />
                  {fileName}
                </div>
                {openapiSpec && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                    VALID
                  </Badge>
                )}
              </div>
              <div className="p-0">
                <textarea
                  value={openapiSpec}
                  onChange={(e) => {
                    setOpenapiSpec(e.target.value)
                    if (fileName === "No file selected" && e.target.value) {
                      setFileName("manual-input.yaml")
                    } else if (!e.target.value) {
                      setFileName("No file selected")
                    }
                  }}
                  placeholder="// Paste your OpenAPI JSON or YAML spec here, or upload a file below."
                  className="w-full h-64 p-4 text-sm font-mono text-indigo-200/80 bg-transparent resize-y focus:outline-none focus:ring-0 border-0 placeholder:text-slate-600"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Upload Zone */}
            <div 
              className="border-2 border-dashed border-slate-700/50 hover:border-indigo-500/50 transition-colors rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-900/20"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json,.yaml,.yml" 
                onChange={handleFileUpload}
              />
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4">
                <UploadCloud className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Upload replacement spec</h3>
              <p className="text-slate-500 text-sm">JSON or YAML files only</p>
            </div>

            <Button
              onClick={() => handleGeneratePayloads()}
              disabled={!openapiSpec.trim() || isGenerating}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold text-lg border-0 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ANALYZING SPEC...
                </>
              ) : (
                <>
                  <Settings2 className="w-5 h-5 mr-2" />
                  GENERATE PAYLOADS
                </>
              )}
            </Button>
          </div>
        )}

        {/* TAB 2: PAYLOADS */}
        {activeTab === 'payloads' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div>
              <h2 className="text-3xl font-bold text-white mb-2">Generated Payloads</h2>
              <p className="text-slate-400 text-sm">
                Review the {generatedPayloads.length} test vectors generated for your API schema.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#162032] overflow-hidden">
               <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/40">
                  <span className="text-sm font-medium text-slate-300">Test Cases</span>
                  <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleExportPostmanCollection}
                        disabled={generatedPayloads.length === 0 || isGenerating}
                        className="h-8 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Postman
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleExportPayloads}
                        disabled={generatedPayloads.length === 0 || isGenerating}
                        className="h-8 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        JSON
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleGeneratePayloads()}
                        disabled={isGenerating}
                        className="h-8 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                      >
                        {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Settings2 className="w-3 h-3 mr-1" />}
                        Regenerate
                    </Button>
                  </div>
               </div>
               <div className="max-h-[500px] overflow-y-auto">
                 {generatedPayloads.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No payloads generated yet.</div>
                 ) : (
                    <div className="divide-y divide-slate-800/50">
                      {generatedPayloads.map((payload, idx) => (
                        <div key={idx} className="p-4 hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-mono text-[10px]">
                                {payload.method}
                              </Badge>
                              <span className="font-mono text-sm text-slate-300 truncate max-w-[200px] sm:max-w-xs">{payload.path}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700 text-slate-300">
                              {payload.category.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">{payload.objective}</p>
                        </div>
                      ))}
                    </div>
                 )}
               </div>
            </div>

            <Button
              onClick={() => setActiveTab('execute')}
              disabled={generatedPayloads.length === 0}
              className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold border-0"
            >
              PROCEED TO EXECUTION
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* TAB 3: EXECUTE */}
        {activeTab === 'execute' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Execute Tests</h2>
              <p className="text-slate-400 text-sm">
                Provide target environment credentials to launch the fuzzing sequence.
              </p>
            </div>

            <form onSubmit={handleRunTests} className="space-y-6">
              <div className="space-y-5 rounded-xl border border-slate-800 bg-[#162032] p-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Base URL</label>
                  <Input 
                    placeholder="https://api.example.com/v1" 
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="h-12 bg-slate-900/50 border-slate-700 text-white focus-visible:ring-indigo-500"
                    disabled={isExecuting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Authorization Header (Optional)</label>
                  <Input 
                    placeholder="Bearer token123..." 
                    value={authHeader}
                    onChange={(e) => setAuthHeader(e.target.value)}
                    className="h-12 bg-slate-900/50 border-slate-700 text-white focus-visible:ring-indigo-500 font-mono text-sm"
                    disabled={isExecuting}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!baseUrl.trim() || isExecuting}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-red-500/80 to-rose-600/80 hover:from-red-500 hover:to-rose-600 text-white font-semibold text-lg border-0 shadow-[0_0_20px_rgba(225,29,72,0.15)]"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    EXECUTING PAYLOADS...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    {executionResults ? "RE-EXECUTE ATTACK SEQUENCE" : "LAUNCH ATTACK SEQUENCE"}
                  </>
                )}
              </Button>
            </form>

            {/* Display Execution Results */}
            {executionResults && (
              <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Execution Complete</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {executionResults.length} Responses
                  </Badge>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#162032] overflow-hidden max-h-[400px] overflow-y-auto">
                  <div className="divide-y divide-slate-800/50">
                    {executionResults.map((res: any, idx: number) => {
                      const payload = generatedPayloads.find(p => p.test_id === res.test_id);
                      const isSuccess = res.status_code >= 200 && res.status_code < 300;
                      const isError = res.status_code >= 400;
                      
                      return (
                        <div key={idx} className="p-4 hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`font-mono text-[10px] ${
                                isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                isError ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {res.status_code || 'ERR'}
                              </Badge>
                              <span className="font-mono text-sm text-slate-300 truncate max-w-[200px] sm:max-w-xs">
                                {payload?.path || res.test_id}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">{res.response_time_ms}ms</span>
                          </div>
                          
                          <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800/50 overflow-x-auto">
                            <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap break-all">
                              {res.error ? `Error: ${res.error}` : res.response_body || 'No response body'}
                            </pre>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Button
                  onClick={handleAnalyzeResults}
                  disabled={isAnalyzing}
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold text-lg border-0 shadow-[0_0_20px_rgba(99,102,241,0.2)] mt-6"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ANALYZING RESPONSES...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5 mr-2" />
                      ANALYZE RESULTS
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RESULTS */}
        {activeTab === 'results' && analysisReport && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Audit Complete</h2>
                  <p className="text-slate-400 text-sm">Scan finished across {analysisReport?.summary?.total_tests || 0} endpoints.</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-[#162032] p-5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Risk Level</div>
                  <div className={`text-2xl font-bold ${
                    analysisReport?.summary?.risk_level?.toLowerCase() === 'high' ? 'text-red-400' :
                    analysisReport?.summary?.risk_level?.toLowerCase() === 'medium' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {analysisReport?.summary?.risk_level?.toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#162032] p-5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Findings</div>
                  <div className="text-2xl font-bold text-red-400">{analysisReport?.summary?.confirmed_findings || 0}</div>
                </div>
             </div>

             <div className="space-y-4 mt-8">
               <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Detailed Findings</h3>
                {analysisReport?.findings?.map((finding: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-[#162032] overflow-hidden">
                    <div className={`h-1 w-full ${
                      finding.severity?.toLowerCase() === 'high' || finding.severity?.toLowerCase() === 'critical' ? 'bg-red-500' :
                      finding.severity?.toLowerCase() === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Badge variant="outline" className="mb-2 bg-slate-800 border-slate-700 text-slate-300 text-[10px]">
                            {finding.category}
                          </Badge>
                          <h4 className="text-lg font-medium text-white font-mono text-sm break-all">
                            {finding.route}
                          </h4>
                        </div>
                        <Badge className={`${
                          finding.status?.toLowerCase() === 'confirmed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {finding.status?.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/50">
                          <span className="block text-xs font-medium text-slate-500 mb-1">Observed Behavior</span>
                          <span className="text-red-300">{finding.evidence?.observed_behavior || 'N/A'}</span>
                        </div>
                        {finding.recommendation && (
                          <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                            <span className="block text-xs font-medium text-indigo-400/70 mb-1">Recommendation</span>
                            <span className="text-indigo-200">{finding.recommendation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!analysisReport?.findings || analysisReport.findings.length === 0) && (
                  <div className="text-center py-12 text-slate-500 border border-slate-800 border-dashed rounded-xl">
                    No significant findings detected.
                  </div>
                )}
             </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#0B1019]/95 backdrop-blur-lg border-t border-slate-800/80 z-50 px-6 flex items-center justify-around md:justify-center md:gap-16">
        <button 
          onClick={() => setActiveTab('specs')}
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${activeTab === 'specs' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}
        >
          <FileText className="w-5 h-5 mb-1.5" />
          <span className="text-[10px] font-medium tracking-wide">Specs</span>
        </button>
        <button 
          onClick={() => setActiveTab('payloads')}
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${activeTab === 'payloads' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}
        >
          <Shield className="w-5 h-5 mb-1.5" />
          <span className="text-[10px] font-medium tracking-wide">Payloads</span>
        </button>
        <button 
          onClick={() => setActiveTab('execute')}
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${activeTab === 'execute' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}
        >
          <Play className="w-5 h-5 mb-1.5" />
          <span className="text-[10px] font-medium tracking-wide">Execute</span>
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          disabled={!analysisReport}
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${!analysisReport ? 'opacity-40 cursor-not-allowed' : ''} ${activeTab === 'results' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}
        >
          <Activity className="w-5 h-5 mb-1.5" />
          <span className="text-[10px] font-medium tracking-wide">Results</span>
        </button>
      </div>
    </div>
  )
}
