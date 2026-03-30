'use client';

import { useState } from 'react';
import { analyzeCareer } from '@/actions/orchestrate';
import CareerAnalysisForm from '@/components/CareerAnalysisForm';
import AnalysisResult from '@/components/AnalysisResult';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { CareerAnalysisOutput } from '@/types';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CareerAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (resumeText: string, domain: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await analyzeCareer({
        resume_text: resumeText,
        domain: domain,
      });
      
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to analyze career data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
            AI Career Copilot
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your personal AI-powered career assistant. Get personalized insights, 
            skill analysis, and a complete roadmap to achieve your career goals.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {!result && !loading && (
            <CareerAnalysisForm onSubmit={handleAnalyze} />
          )}
          
          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}
          
          {error && (
            <ErrorMessage 
              message={error} 
              onRetry={handleReset} 
            />
          )}
          
          {result && !loading && !error && (
            <>
              <AnalysisResult data={result} />
              <div className="flex justify-center">
                <button
                  onClick={handleReset}
                  className="btn-secondary"
                >
                  Analyze Another Resume
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm border-t border-gray-200 pt-8">
          <p>Powered by Lamatic.ai - AI Career Assistant</p>
        </footer>
      </div>
    </main>
  );
}