'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { analyzeSystemDesign } from '@/actions/orchestrate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronRight, Copy, Check } from 'lucide-react';

const formSchema = z.object({
  systemDesign: z.string().min(10, {
    message: 'Please enter a system design specification (at least 10 characters).',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
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

    try {
      const response = await analyzeSystemDesign(values.systemDesign);
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

  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      {/* Header - Minimal */}
      <header className="border-b border-gray-200 py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Lamatic Logo */}
            <img 
              src="https://lamatic.ai/logo.svg" 
              alt="Lamatic" 
              className="w-7 h-7"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.parentElement!.innerHTML = '<svg class="w-7 h-7" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="8" height="8" fill="#dc2626" rx="1.5" /><rect x="15" y="2" width="8" height="8" fill="#dc2626" rx="1.5" /><rect x="28" y="2" width="8" height="8" fill="#dc2626" rx="1.5" /><rect x="2" y="15" width="8" height="8" fill="#dc2626" rx="1.5" /><rect x="15" y="15" width="8" height="8" fill="#dc2626" rx="1.5" /><rect x="28" y="15" width="8" height="8" fill="#dc2626" rx="1.5" /><rect x="2" y="28" width="8" height="8" fill="#dc2626" rx="1.5" /><rect x="15" y="28" width="8" height="8" fill="#dc2626" rx="1.5" /><rect x="28" y="28" width="8" height="8" fill="#dc2626" rx="1.5" /></svg>';
              }}
            />
            <span className="font-bold text-lg text-red-600">Lamatic</span>
          </div>
          <span className="text-xs text-gray-500">System Design Analyzer</span>
        </div>
      </header>

      {/* Main Content - No Scroll */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input */}
        <div className="flex-1 flex flex-col border-r border-gray-200 p-6 overflow-hidden">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-black">Analyze Design</h2>
            <p className="text-xs text-gray-600">Describe your system architecture</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <label className="text-xs font-semibold text-black mb-2">System Design</label>
              <Textarea
                placeholder="e.g., Design a scalable social media platform with 1M concurrent users..."
                className="flex-1 resize-none bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600"
                {...form.register('systemDesign')}
              />
              {form.formState.errors.systemDesign && (
                <p className="text-xs text-red-600 mt-1">
                  {form.formState.errors.systemDesign.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Right Panel - Results/Examples */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {!result ? (
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-black mb-3">Quick Examples</h3>
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {[
                    'Design a distributed cache like Redis',
                    'Build a real-time notification system',
                    'Create a URL shortener service',
                    'Design a video streaming platform',
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => form.setValue('systemDesign', example)}
                      className="w-full text-left text-xs p-2 rounded bg-gray-100 hover:bg-red-50 border border-gray-300 hover:border-red-300 text-black hover:text-red-600 transition-all"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-black">Analysis Result</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-7 px-2 gap-1 text-xs border-gray-300 text-black hover:bg-red-50 hover:text-red-600"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50 p-3 rounded border border-gray-300">
                <p className="text-xs text-black leading-relaxed whitespace-pre-wrap font-mono">
                  {result}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null);
                  form.reset();
                }}
                className="mt-3 h-8 text-xs border-gray-300 text-black hover:bg-gray-100"
              >
                Analyze Another Design
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
