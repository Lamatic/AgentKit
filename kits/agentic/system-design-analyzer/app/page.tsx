'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { analyzeSystemDesign } from '@/actions/orchestrate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Zap, ChevronRight, Copy, Check } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              System Design Analyzer
            </h1>
          </div>
          <div className="text-sm text-gray-600">
            Powered by <span className="font-semibold">Lamatic</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Analyze Your System Designs
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get AI-powered insights and recommendations for your system architecture. Enter your design
              specification and receive comprehensive analysis.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-gray-200">
                <CardHeader>
                  <CardTitle>Enter System Design</CardTitle>
                  <CardDescription>
                    Describe your system architecture, components, and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        System Design Specification
                      </label>
                      <Textarea
                        placeholder="e.g., Design a dashboard system that handles 1M concurrent users with real-time updates..."
                        className="resize-none"
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
                      className="w-full h-12 text-base font-semibold"
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
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {error}
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Result Section */}
              {result && (
                <Card className="mt-8 shadow-lg border-gray-200">
                  <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Analysis Results</CardTitle>
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
                        className="gap-2"
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
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-6 rounded-lg border border-gray-200 font-mono text-sm leading-relaxed">
                        {result}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-gray-200 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Example Designs</CardTitle>
                  <CardDescription>Click to try these examples</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {exampleDesigns.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(example)}
                      className="w-full text-left p-3 text-sm rounded-lg bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 transition-colors text-gray-700 hover:text-red-700 font-medium"
                    >
                      {example}
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Features Card */}
              <Card className="mt-6 shadow-lg border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Real-time Analysis</p>
                      <p className="text-xs text-gray-600">Get instant insights</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">AI-Powered</p>
                      <p className="text-xs text-gray-600">Advanced recommendations</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Comprehensive</p>
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
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-600">
          <p>
            Powered by{' '}
            <a href="https://lamatic.ai" className="font-semibold text-gray-900 hover:text-red-600">
              Lamatic AI
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
