"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { analyzeWebsite, type WebReviveReport } from "../actions/orchestrate";
import { 
  Loader2, Copy, Check, ExternalLink, FileText, 
  Search, Zap, Layers, BarChart3, Target, Mail 
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL").min(1, "URL is required"),
  businessName: z.string().optional(),
  industry: z.string().optional(),
  targetService: z.string().default("Website Redesign"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebReviveReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      businessName: "",
      industry: "",
      targetService: "Website Redesign",
    },
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await analyzeWebsite({
        url: values.url.trim(),
        businessName: values.businessName,
        industry: values.industry === "none" ? "" : values.industry,
        targetService: values.targetService,
      });

      if (res.success && res.data) {
        setResult(res.data);
        setActiveTab("overview");
      } else {
        setError(res.error || "Analysis failed. Please check your WEBREVIVE_FLOW_ID in .env.local");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans antialiased">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">WebRevive AI</span>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">v1.0</span>
          </div>
          {result && (
            <button
              onClick={() => { setResult(null); setError(null); form.reset(); }}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-3 py-1.5 rounded transition"
            >
              New Audit
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {!result ? (
          <div className="max-w-xl mx-auto space-y-6 py-12">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Website Audit & Cold Outreach</h1>
              <p className="text-sm text-zinc-400">
                Enter a business website URL to run a complete analysis and generate personalized outreach materials.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-sm">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Website URL *</FormLabel>
                      <FormControl>
                        <Input
                          id="website-url"
                          type="url"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition"
                          placeholder="https://example.com"
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Business Name</FormLabel>
                        <FormControl>
                          <Input
                            id="business-name"
                            type="text"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition"
                            placeholder="Optional"
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Industry</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"} disabled={loading}>
                          <FormControl>
                            <SelectTrigger id="industry" className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition">
                              <SelectValue placeholder="Select Industry (Optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-950 border border-zinc-850 text-zinc-200">
                            <SelectItem value="none">Select Industry (Optional)</SelectItem>
                            <SelectItem value="E-Commerce">E-Commerce</SelectItem>
                            <SelectItem value="SaaS / Tech">SaaS / Tech</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Real Estate">Real Estate</SelectItem>
                            <SelectItem value="Legal / Law Firm">Legal / Law Firm</SelectItem>
                            <SelectItem value="Restaurant / Food">Restaurant / Food</SelectItem>
                            <SelectItem value="Consulting / Agency">Consulting / Agency</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Construction">Construction</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="targetService"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Target Service</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                        <FormControl>
                          <SelectTrigger id="target-service" className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition">
                            <SelectValue placeholder="Website Redesign" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-950 border border-zinc-850 text-zinc-200">
                          <SelectItem value="Website Redesign">Website Redesign</SelectItem>
                          <SelectItem value="SEO Optimization">SEO Optimization</SelectItem>
                          <SelectItem value="Performance Optimization">Performance Optimization</SelectItem>
                          <SelectItem value="Branding & Copywriting">Branding & Copywriting</SelectItem>
                          <SelectItem value="Conversion Optimization">Conversion Optimization</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <button
                  type="submit"
                  id="analyze-btn"
                  disabled={loading || !form.watch("url")?.trim()}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold py-2.5 rounded text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Website (12 agents running)...</span>
                    </>
                  ) : (
                    <span>Analyze Website</span>
                  )}
                </button>
              </form>
            </Form>

            {error && (
              <div className="bg-red-950/20 border border-red-900/50 p-4 rounded text-sm space-y-2">
                <p className="text-red-400 font-semibold">Error occurred during analysis:</p>
                <p className="text-xs text-zinc-400 font-mono bg-zinc-950/80 p-2.5 rounded border border-zinc-900 break-all">{error}</p>
                <p className="text-xs text-zinc-500">
                  Ensure your <code className="bg-zinc-900 px-1 rounded">WEBREVIVE_FLOW_ID</code> is correctly set in <code className="bg-zinc-900 px-1 rounded">.env.local</code> and the flow has been deployed.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Results Dashboard */
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{result.websiteAnalysis.businessName || "Website Audit"}</h2>
                  <span className="text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded font-bold font-mono">
                    Overall Score: {result.finalReport.overallScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <a href={form.getValues("url")} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-200 flex items-center gap-1">
                    {form.getValues("url")} <ExternalLink className="w-3 h-3" />
                  </a>
                  {result.websiteAnalysis.industry && (
                    <>
                      <span>·</span>
                      <span>{result.websiteAnalysis.industry}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(result.coldEmail.body, "top-email")}
                  className="bg-zinc-800 hover:bg-zinc-700 text-xs px-3 py-1.5 rounded transition flex items-center gap-1.5"
                >
                  {copiedKey === "top-email" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Cold Email</span>
                </button>
                <button
                  onClick={() => { setResult(null); setError(null); form.reset(); }}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs px-3 py-1.5 rounded font-semibold transition"
                >
                  New Audit
                </button>
              </div>
            </div>

            {/* Tabs Nav */}
            <div role="tablist" className="flex gap-1 border-b border-zinc-800 overflow-x-auto pb-px">
              {[
                { id: "overview", label: "Overview", icon: Layers },
                { id: "seo", label: "SEO Audit", icon: Search },
                { id: "performance", label: "Performance", icon: Zap },
                { id: "uiux", label: "UI/UX & Redesign", icon: Layers },
                { id: "competitors", label: "Competitors", icon: BarChart3 },
                { id: "conversion", label: "Conversion", icon: Target },
                { id: "outreach", label: "Outreach Campaign", icon: Mail },
                { id: "proposal", label: "Business Proposal", icon: FileText },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    id={`tab-${t.id}`}
                    role="tab"
                    aria-selected={activeTab === t.id}
                    aria-controls={`panel-${t.id}`}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition -mb-px ${
                      activeTab === t.id
                        ? "border-zinc-200 text-zinc-100"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg space-y-6">
              {activeTab === "overview" && (
                <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Executive Summary</h3>
                    <p className="text-sm leading-relaxed text-zinc-200 bg-zinc-950 p-4 rounded border border-zinc-800 italic">
                      "{result.finalReport.executiveOneLiner}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "SEO Score", score: result.seoAudit.score },
                      { label: "Performance", score: result.performance.score },
                      { label: "UI Design", score: result.uiuxReview.uiScore },
                      { label: "UX / Layout", score: result.uiuxReview.uxScore },
                    ].map((item, i) => (
                      <div key={i} className="bg-zinc-950 p-4 rounded border border-zinc-800 text-center space-y-1">
                        <span className="text-xs text-zinc-400">{item.label}</span>
                        <p className="text-2xl font-bold font-mono">{item.score}/100</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Priority Action Items</h3>
                    <div className="space-y-2">
                      {(result.finalReport.priorityFixes || []).map((f, i) => (
                        <div key={i} className="bg-zinc-950 p-3.5 rounded border border-zinc-850 flex items-start gap-3">
                          <span className="text-xs font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 w-6 h-6 flex items-center justify-center rounded shrink-0">
                            #{f.rank}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-zinc-200">{f.title}</p>
                              <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold capitalize">
                                {f.urgency}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">{f.estimatedImpact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.finalReport.estimatedBusinessImpact && (
                    <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded text-sm text-emerald-300">
                      <span className="font-bold">Business Outcome Estimate: </span>
                      {result.finalReport.estimatedBusinessImpact}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "seo" && (
                <div id="panel-seo" role="tabpanel" aria-labelledby="tab-seo" className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded border border-zinc-800">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase">Tags & Metadata</h4>
                      {[
                        { label: "Meta Title", present: result.seoAudit.metaTitle.present, note: result.seoAudit.metaTitle.note },
                        { label: "Meta Description", present: result.seoAudit.metaDescription.present, note: result.seoAudit.metaDescription.note },
                        { label: "H1 Headings", present: result.seoAudit.h1.present, note: result.seoAudit.h1.note },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between text-xs py-1 border-b border-zinc-900 last:border-0">
                          <span className="text-zinc-400">{item.label}</span>
                          <span className={item.present ? "text-emerald-400 font-semibold" : "text-red-400"}>
                            {item.present ? "Present" : "Missing"}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase">Indexing & Media</h4>
                      {[
                        { label: "Open Graph Tags", present: result.seoAudit.openGraph.present, note: result.seoAudit.openGraph.note },
                        { label: "Structured Schema", present: result.seoAudit.structuredData.present, note: result.seoAudit.structuredData.note },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between text-xs py-1 border-b border-zinc-900 last:border-0">
                          <span className="text-zinc-400">{item.label}</span>
                          <span className={item.present ? "text-emerald-400 font-semibold" : "text-red-400"}>
                            {item.present ? "Configured" : "Missing"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">SEO Recommendations</h3>
                    <div className="space-y-2">
                      {(result.seoAudit.issues || []).map((issue, i) => (
                        <div key={i} className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold capitalize">
                              {issue.priority}
                            </span>
                            <span className="text-sm font-semibold text-zinc-200">{issue.title || issue.area}</span>
                          </div>
                          <p className="text-xs text-zinc-400">{issue.detail || issue.suggestion}</p>
                          {issue.fix && (
                            <p className="text-xs text-zinc-500"><strong className="text-zinc-400">Suggested Fix:</strong> {issue.fix}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "performance" && (
                <div id="panel-performance" role="tabpanel" aria-labelledby="tab-performance" className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-950 p-4 rounded border border-zinc-800 font-mono text-center">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">FCP</span>
                      <span className="text-lg font-bold text-zinc-200">{result.performance.fcp}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">LCP</span>
                      <span className="text-lg font-bold text-zinc-200">{result.performance.lcp}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">CLS</span>
                      <span className="text-lg font-bold text-zinc-200">{result.performance.cls}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">TBT</span>
                      <span className="text-lg font-bold text-zinc-200">{result.performance.tbt}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Speed Audits</h3>
                    <div className="space-y-2">
                      {(result.performance.suggestions || []).map((item, i) => (
                        <div key={i} className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-zinc-850 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold capitalize">
                              {item.priority}
                            </span>
                            <span className="text-sm font-semibold text-zinc-200">{item.title}</span>
                          </div>
                          <p className="text-xs text-zinc-400">{item.detail}</p>
                          {item.estimatedGain && (
                            <p className="text-xs text-emerald-400">Estimated Gain: {item.estimatedGain}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "uiux" && (
                <div id="panel-uiux" role="tabpanel" aria-labelledby="tab-uiux" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Redesign Concept</h4>
                        <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-2">
                          <p className="text-xs text-zinc-400 font-semibold">Hero Section Concept</p>
                          <p className="text-sm text-zinc-300 leading-relaxed">{result.redesignSuggestions.heroSection}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Visual Palette</h4>
                        <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-2 font-mono text-xs">
                          <div className="flex gap-2">
                            <span className="text-zinc-500">Primary:</span>
                            <span className="text-zinc-200">{result.redesignSuggestions.colorPalette.primary}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-zinc-500">Secondary:</span>
                            <span className="text-zinc-200">{result.redesignSuggestions.colorPalette.secondary}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-zinc-500">Accent:</span>
                            <span className="text-zinc-200">{result.redesignSuggestions.colorPalette.accent}</span>
                          </div>
                          <p className="text-xs text-zinc-400 font-sans mt-2 pt-2 border-t border-zinc-900">
                            {result.redesignSuggestions.colorPalette.rationale}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Structure & Ordering</h4>
                        <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-1.5 text-xs">
                          {(result.redesignSuggestions.sectionOrder || []).map((section, idx) => (
                            <div key={idx} className="flex gap-2 py-0.5 border-b border-zinc-900/60 last:border-0">
                              <span className="text-zinc-500 w-4">{idx + 1}.</span>
                              <span className="text-zinc-300">{section}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">AI Image Mockup Prompt</h4>
                        <div className="bg-zinc-950 p-3 rounded border border-zinc-850 flex items-start gap-3 justify-between">
                          <p className="text-xs text-zinc-400 leading-relaxed select-all">
                            {result.redesignSuggestions.imagePrompt}
                          </p>
                          <button
                            onClick={() => handleCopy(result.redesignSuggestions.imagePrompt, "mockup-prompt")}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] px-2 py-1 rounded transition shrink-0"
                          >
                            {copiedKey === "mockup-prompt" ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">UI/UX Recommendations</h3>
                    <div className="space-y-2">
                      {(result.uiuxReview.recommendations || []).map((item, i) => (
                        <div key={i} className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-1">
                          <p className="text-xs font-semibold text-zinc-200">{item.area || item.title}</p>
                          <p className="text-xs text-zinc-400">{item.suggestion || item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "competitors" && (
                <div id="panel-competitors" role="tabpanel" aria-labelledby="tab-competitors" className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Competitor Profiles</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {(result.competitors.list || []).map((c, i) => (
                        <div key={i} className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-3">
                          <div>
                            <p className="text-sm font-bold text-zinc-200">{c.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{c.website}</p>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div>
                              <span className="text-[10px] text-zinc-500 block font-semibold">Strengths</span>
                              <p className="text-zinc-300">{(c.strengths || []).join(", ")}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 block font-semibold">Weaknesses</span>
                              <p className="text-zinc-300">{(c.weaknesses || []).join(", ")}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-500 uppercase">Competitive Angle / Pitch</h4>
                      <p className="text-sm text-zinc-300 mt-1">{result.competitors.competitiveAdvantage}</p>
                    </div>
                    {(result.competitors.gapOpportunities || []).length > 0 && (
                      <div className="pt-2 border-t border-zinc-900">
                        <span className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Identified Gap Opportunities</span>
                        <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                          {(result.competitors.gapOpportunities || []).map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "conversion" && (
                <div id="panel-conversion" role="tabpanel" aria-labelledby="tab-conversion" className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded border border-zinc-800 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Lead capture forms</span>
                      <p className="text-zinc-200 font-semibold">{result.conversionAudit.leadForms.present ? `Yes — ${result.conversionAudit.leadForms.quality}` : "No/Missing"}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Trust & Social proof</span>
                      <p className="text-zinc-200 font-semibold">{result.conversionAudit.trustSignals.present || result.conversionAudit.socialProof.present ? "Yes" : "No/Missing"}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Conversion Improvements</h3>
                    <div className="space-y-2">
                      {(result.conversionAudit.recommendations || []).map((item, i) => (
                        <div key={i} className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-1">
                          <p className="text-xs font-semibold text-zinc-200">{item.title}</p>
                          <p className="text-xs text-zinc-400">{item.detail}</p>
                          {item.expectedLift && (
                            <p className="text-xs text-emerald-400 font-mono">Expected Outcome: {item.expectedLift}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "outreach" && (
                <div id="panel-outreach" role="tabpanel" aria-labelledby="tab-outreach" className="space-y-6">
                  {/* Cold Email */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase">Personalized Cold Email</h3>
                      <button
                        onClick={() => handleCopy(`Subject: ${result.coldEmail.subject}\n\n${result.coldEmail.body}`, "email-copy")}
                        className="bg-zinc-800 hover:bg-zinc-700 text-xs px-2.5 py-1 rounded transition flex items-center gap-1"
                      >
                        {copiedKey === "email-copy" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Email Sequence</span>
                      </button>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-3">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono">Subject Line</span>
                        <p className="text-sm font-semibold text-zinc-200 mt-0.5">{result.coldEmail.subject}</p>
                      </div>
                      <div className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-mono bg-zinc-900/30 p-4 rounded border border-zinc-850/50">
                        {result.coldEmail.body}
                      </div>
                    </div>
                  </div>

                  {/* LinkedIn outreach */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase">LinkedIn Sequence</h3>
                      <button
                        onClick={() => handleCopy(result.linkedinOutreach.connectionRequest, "li-copy")}
                        className="bg-zinc-800 hover:bg-zinc-700 text-xs px-2.5 py-1 rounded transition flex items-center gap-1"
                      >
                        {copiedKey === "li-copy" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Connect Req</span>
                      </button>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-4">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono">Connection Request (Max 300 chars)</span>
                        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/30 p-3 rounded border border-zinc-850 mt-1 select-all">
                          {result.linkedinOutreach.connectionRequest}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono">First Follow-up Message</span>
                        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/30 p-3 rounded border border-zinc-850 mt-1 select-all">
                          {result.linkedinOutreach.firstMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "proposal" && (
                <div id="panel-proposal" role="tabpanel" aria-labelledby="tab-proposal" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase">Client Proposal Document</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(JSON.stringify(result.proposal, null, 2), "proposal-copy")}
                        className="bg-zinc-800 hover:bg-zinc-700 text-xs px-2.5 py-1 rounded transition flex items-center gap-1"
                      >
                        {copiedKey === "proposal-copy" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy JSON</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs px-2.5 py-1 rounded transition"
                      >
                        Print Proposal
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-6 rounded border border-zinc-800 space-y-6 max-h-[600px] overflow-y-auto font-sans leading-relaxed text-sm text-zinc-300">
                    <div>
                      <h2 className="text-base font-bold text-zinc-100 mb-2">1. Executive Summary</h2>
                      <p>{result.proposal.executiveSummary}</p>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-100 mb-2">2. Problems Identified</h2>
                      <ul className="list-disc list-inside space-y-1">
                        {(result.proposal.problemsFound || []).map((p, i) => (
                          <li key={i} className="text-zinc-300">{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-100 mb-2">3. Proposed Scope & Solutions</h2>
                      <ul className="list-disc list-inside space-y-1">
                        {(result.proposal.proposedSolutions || []).map((s, i) => (
                          <li key={i} className="text-zinc-300">{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-100 mb-2">4. Project Timeline</h2>
                      <div className="space-y-3">
                        {(result.proposal.timeline || []).map((t, i) => (
                          <div key={i} className="border-l-2 border-zinc-800 pl-4 py-1 space-y-1">
                            <p className="font-semibold text-zinc-200">{t.phase} ({t.duration})</p>
                            <p className="text-xs text-zinc-400">Deliverables: {(t.deliverables || []).join(", ")}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-100 mb-2">5. Budget Estimate</h2>
                      <p className="text-lg font-mono font-bold text-zinc-100">
                        ${result.proposal.estimatedCost.min.toLocaleString()} - ${result.proposal.estimatedCost.max.toLocaleString()} {result.proposal.estimatedCost.currency}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">{result.proposal.estimatedCost.notes}</p>
                    </div>

                    <div className="pt-4 border-t border-zinc-900">
                      <p className="text-xs text-zinc-400 italic">Maintenance plan: {result.proposal.maintenancePlan}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
