'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { analyzeSystemDesign } from '@/actions/orchestrate';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, Check, Github, Zap, Database, Network, AlertCircle, Coffee } from 'lucide-react';

const formSchema = z.object({
  systemDesign: z.string().min(10, {
    message: 'Please enter a system design specification (at least 10 characters).',
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Helper function to render analysis results
function renderAnalysisResults(result: string | object) {
  try {
    let data: any = result;
    if (typeof result === 'string') {
      data = JSON.parse(result);
    }

    const issues = Array.isArray(data.issues) ? data.issues : [];
    const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
    const summary = typeof data.summary === 'string' ? data.summary : data.summary?.summary || '';

    return (
      <div className="space-y-8">
        {/* Summary Section */}
        {summary && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur-lg opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="relative bg-gradient-to-br from-blue-50 via-blue-50/50 to-white border border-blue-200/40 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-blue-950 mb-3">Analysis Summary</h3>
                  <p className="text-blue-700 leading-relaxed text-sm">{summary}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Issues Section */}
        {issues.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
              <h3 className="text-lg font-bold text-red-950">Critical Issues</h3>
              <span className="ml-auto inline-flex items-center justify-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                {issues.length} found
              </span>
            </div>
            <div className="grid gap-3">
              {issues.map((issue: any, idx: number) => {
                const issueText = typeof issue === 'string' ? issue : issue.description || issue;
                return (
                  <div
                    key={idx}
                    className="group relative bg-gradient-to-r from-red-50/50 to-orange-50/30 border border-red-200/50 rounded-xl p-4 hover:border-red-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-red-500/50 transition-all duration-300">
                        <span className="text-white font-bold text-sm">!</span>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-red-900 text-sm leading-relaxed font-medium">{issueText}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
              <h3 className="text-lg font-bold text-green-950">Recommendations</h3>
              <span className="ml-auto inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                {recommendations.length} actions
              </span>
            </div>
            <div className="grid gap-3">
              {recommendations.map((rec: any, idx: number) => {
                const recText = typeof rec === 'string' ? rec : rec.suggestion || rec;
                return (
                  <div
                    key={idx}
                    className="group relative bg-gradient-to-r from-green-50/50 to-emerald-50/30 border border-green-200/50 rounded-xl p-4 hover:border-green-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-green-500/50 transition-all duration-300">
                        <span className="text-white font-bold text-sm">✓</span>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-green-900 text-sm leading-relaxed font-medium">{recText}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fallback if no structured data */}
        {!summary && issues.length === 0 && recommendations.length === 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
            <p className="text-gray-600 font-medium mb-3">Response:</p>
            <pre className="whitespace-pre-wrap text-gray-700 font-mono text-xs leading-relaxed max-h-96 overflow-y-auto bg-white/50 p-4 rounded-lg border border-gray-200">
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
        <p className="text-gray-600 font-medium mb-3">Response:</p>
        <pre className="whitespace-pre-wrap text-gray-700 font-mono text-xs leading-relaxed max-h-96 overflow-y-auto bg-white/50 p-4 rounded-lg border border-gray-200">
          {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  }
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show429, setShow429] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemDesign: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeSystemDesign(values.systemDesign);
      
      // Check if response has an error
      if (!response.success && response.error) {
        const errorMessage = response.error;
        
        // Check if it's a 429 error
        if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests')) {
          setShow429(true);
        } else {
          setError(errorMessage);
        }
        return;
      }
      
      // Ensure result is a string
      const resultData = typeof response.result === 'string' 
        ? response.result 
        : JSON.stringify(response.result, null, 2);
      
      setResult(resultData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze system design';
      
      // Check if it's a 429 error
      if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests')) {
        setShow429(true);
      } else {
        setError(errorMessage);
      }
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      {/* 429 Error Modal */}
      {show429 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm mx-4 p-8 text-center animate-bounce">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <AlertCircle className="w-16 h-16 text-red-600" />
                <Coffee className="w-8 h-8 text-orange-600 absolute bottom-0 right-0 bg-white rounded-full p-1" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Whoa there, speed racer!</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              You're analyzing systems faster than we can handle! The AI needs a coffee break. Please wait a moment and try again.
            </p>
            <p className="text-sm text-gray-500 mb-6">Error: Too many requests (429)</p>
            <button
              onClick={() => setShow429(false)}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-lg"
            >
              Take a Breath & Try Again
            </button>
          </div>
        </div>
      )}
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="https://lamatic.ai" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/lamatic-logo.png" alt="Lamatic" className="h-8" />
          </a>

          {/* Right side - GitHub Link */}
          <a
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 py-8 flex-1 flex flex-col">
        <div className="mx-auto max-w-3xl">

          {/* Hero Section */}
          {!result && (
            <div className="mb-6 text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-black mb-2 leading-tight">
                Analyze Your <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">System Design</span>
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                AI-powered insights on architecture, performance & reliability
              </p>
            </div>
          )}

          {/* Form Card */}
          {!result && (
            <div className="mb-6 flex-1 flex flex-col">
              <div className="bg-white border border-gray-200/60 rounded-2xl p-7 shadow-lg flex-1 flex flex-col">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Textarea
                      placeholder="Describe your system design. E.g., Design a scalable e-commerce platform with 1M concurrent users, real-time inventory, and global CDN..."
                      className="resize-none bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl h-24 px-4 py-3 text-sm transition-all duration-300"
                      {...form.register('systemDesign')}
                    />
                    {form.formState.errors.systemDesign && (
                      <p className="text-sm text-red-600 mt-3 font-medium flex items-center gap-2">
                        <span>⚠️</span> {form.formState.errors.systemDesign.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-red-600 via-red-600 to-orange-600 hover:from-red-700 hover:via-red-700 hover:to-orange-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-red-600/50 disabled:opacity-60 disabled:cursor-not-allowed border-0 group relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></span>
                    <span className="relative flex items-center justify-center gap-3">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span className="text-xs">Analyze</span>
                        </>
                      )}
                    </span>
                  </Button>

                  {error && (
                    <div className="bg-red-50 border border-red-200/50 text-red-700 px-3 py-2 rounded text-xs font-medium transition-all duration-300 flex items-start gap-2">
                      <span>⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}
                </form>

                {/* Quick Start Examples */}
                <div className="mt-4 pt-4 border-t border-gray-200/40">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Examples</p>
                  <div className="grid gap-2">
                    {[
                      { text: 'Build a real-time messaging app supporting 5 million concurrent users. Requirements: sub-100ms messages, 99.99% uptime, 100+ regions', icon: Network },
                      { text: 'E-commerce payment system handling 50K orders/second. Must support 3-region failover, strong consistency, PCI compliance, and 24-hour settlement batches', icon: Database },
                      { text: 'Live video streaming platform for 1M concurrent viewers. Need 2-second latency, adaptive bitrate streaming, multi-codec support, and CDN distribution', icon: Zap },
                    ].map((example, idx) => {
                      const Icon = example.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => form.setValue('systemDesign', example.text)}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 bg-gray-50 border border-gray-200/60 rounded-lg"
                        >
                          <div className="flex items-start gap-2">
                            <Icon className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="font-medium text-xs leading-snug">{example.text}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div className="flex-1 flex flex-col">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-black mb-3">Analysis Results</h2>
              </div>
              <div className="bg-white border border-gray-200/60 rounded-2xl p-7 shadow-lg mb-4 overflow-y-auto flex-1">
                {renderAnalysisResults(result)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={copyToClipboard}
                  className="h-10 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg group"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Results
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setResult(null);
                    form.reset();
                  }}
                  className="h-10 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze Another
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
