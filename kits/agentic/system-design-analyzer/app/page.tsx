'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { analyzeSystemDesign } from '@/actions/orchestrate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Zap, ChevronRight, Copy, Check, Github, Linkedin } from 'lucide-react';

const formSchema = z.object({
  systemDesign: z.string().min(10, {
    message: 'Please enter a system design specification (at least 10 characters).',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setStatus(null);

    try {
      const response = await analyzeSystemDesign(values.systemDesign);
      setStatus(response.status);
      setResult(response.result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze system design';
      setError(errorMessage);
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

  const exampleDesigns = [
    'Design a scalable distributed cache system like Redis',
    'Build a real-time notification system for a mobile app',
    'Create a URL shortener service like bit.ly',
    'Design a video streaming platform like YouTube',
  ];

  const handleExampleClick = (example: string) => {
    form.setValue('systemDesign', example);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Lamatic Logo SVG */}
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="10" height="10" fill="#dc2626" rx="2" />
              <rect x="18" y="4" width="10" height="10" fill="#dc2626" rx="2" />
              <rect x="4" y="18" width="10" height="10" fill="#dc2626" rx="2" />
              <rect x="18" y="18" width="10" height="10" fill="#dc2626" rx="2" />
            </svg>
            <div>
              <h1 className="text-xl font-bold text-red-600">
                Lamatic
              </h1>
              <p className="text-xs text-gray-600">System Design Analyzer</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/Lamatic/AgentKit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-red-600 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <a 
              href="https://lamatic.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-red-600 transition-colors"
            >
              <span className="font-semibold text-sm">Lamatic</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h2 className="text-5xl sm:text-6xl font-black tracking-tight mb-6 text-black">
              Analyze Your System <span className="text-red-600">Designs</span>
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
              Get AI-powered insights and recommendations for your system architecture. Enter your design
              specification and receive comprehensive, actionable analysis powered by Lamatic.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-gray-300 bg-white">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-black">Enter System Design</CardTitle>
                  <CardDescription className="text-gray-600">
                    Describe your system architecture, components, and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-black mb-3">
                        System Design Specification
                      </label>
                      <Textarea
                        placeholder="e.g., Design a dashboard system that handles 1M concurrent users with real-time updates..."
                        className="resize-none bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600"
                        rows={8}
                        {...form.register('systemDesign')}
                      />
                      {form.formState.errors.systemDesign && (
                        <p className="text-sm text-red-600 mt-2">
                          {form.formState.errors.systemDesign.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Analyze Design
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Result Section */}
              {result && (
                <Card className="mt-8 shadow-lg border-gray-300 bg-white">
                  <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-black">Analysis Results</CardTitle>
                        {status && (
                          <CardDescription className="mt-2">
                            Status: <span className="font-semibold text-green-600">{status}</span>
                          </CardDescription>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="gap-2 border-gray-300 text-black hover:bg-gray-100 hover:text-red-600"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-6">
                    <div className="whitespace-pre-wrap text-black bg-gray-100 p-6 rounded-lg border border-gray-300 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
                      {result}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-gray-300 bg-white sticky top-24">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-black text-lg">Example Designs</CardTitle>
                  <CardDescription className="text-gray-600">Click to try these examples</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {exampleDesigns.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(example)}
                      className="w-full text-left p-3 text-sm rounded-lg bg-gray-100 hover:bg-red-50 border border-gray-300 hover:border-red-300 transition-all duration-300 text-black hover:text-red-600 font-medium"
                    >
                      {example}
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Features Card */}
              <Card className="mt-6 shadow-lg border-gray-300 bg-white">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-black text-lg">Features</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-black">Real-time Analysis</p>
                      <p className="text-xs text-gray-600">Get instant insights</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-black">AI-Powered</p>
                      <p className="text-xs text-gray-600">Advanced recommendations</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-black">Comprehensive</p>
                      <p className="text-xs text-gray-600">Complete system review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-black mb-4">Lamatic</h3>
              <p className="text-gray-600 text-sm">AI Agent Infrastructure for Modern Teams</p>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-3 text-sm">Product</h4>
              <ul className="space-y-2">
                <li><a href="https://lamatic.ai/product/build" className="text-gray-600 hover:text-red-600 text-sm transition-colors">Build</a></li>
                <li><a href="https://lamatic.ai/product/deploy" className="text-gray-600 hover:text-red-600 text-sm transition-colors">Deploy</a></li>
                <li><a href="https://lamatic.ai/product/optimize" className="text-gray-600 hover:text-red-600 text-sm transition-colors">Optimize</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-3 text-sm">Company</h4>
              <ul className="space-y-2">
                <li><a href="https://lamatic.ai/about" className="text-gray-600 hover:text-red-600 text-sm transition-colors">About</a></li>
                <li><a href="https://lamatic.ai/docs" className="text-gray-600 hover:text-red-600 text-sm transition-colors">Docs</a></li>
                <li><a href="https://lamatic.ai/pricing" className="text-gray-600 hover:text-red-600 text-sm transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-3 text-sm">Connect</h4>
              <div className="flex gap-4">
                <a href="https://github.com/Lamatic" className="text-gray-600 hover:text-red-600 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com/company/lamatic" className="text-gray-600 hover:text-red-600 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-gray-600 text-sm">
            <p>© 2024 Lamatic. Powered by AgentKit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
