
'use client';
import { useState } from 'react';
import AnalysisForm from '../components/AnalysisForm';
import SentimentCard from '../components/SentimentCard';
import ReportDashboard from '../components/ReportDashboard';
import { triggerGMapAnalysis } from '../lib/lamatic';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleRunReport = async (formData: any) => {
  setIsLoading(true);
  setData(null);
  try {
    const result = await triggerGMapAnalysis(formData);
    
    // Ensure these keys match your Lamatic Flow output variables exactly
    setData({
      report: result.report || result.markdown_report,
      business_average_rating: result.business_average_rating || 0,
      business_total_reviews_fetched: result.business_total_reviews_fetched || 0
    });
  } catch (e: any) {
    console.error("UI Error:", e);
    alert(e.message);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen px-6 py-12 lg:px-20 bg-[#050505]">
      {/* Header */}
      <header className="flex justify-between items-center mb-32 max-w-[1500px] mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-teal-400 rounded-sm skew-x-12" />
          <span className="font-black  tracking-tighter text-2xl italic text-white ">GMapReview AI</span>
        </div>
        <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/20">REPUTATION COPILOT V1.0</div>
      </header>

      <main className="max-w-[1500px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-48">
          <div className="flex-1 min-w-fit">
            <h1 className="text-8xl md:text-9xl lg:text-[11rem] font-black italic leading-[0.75] tracking-tighter uppercase mb-10 text-white">
              Speed <br /> 
              <span className="text-teal-400">Analysis.</span>
            </h1>
            <p className="text-white/40 max-w-sm text-lg font-light leading-relaxed">
              Real-time competitive benchmarking for local businesses using your Synchronous Lamatic Flow.
            </p>
          </div>
          
          <div className="w-full lg:w-[500px] shrink-0">
            <AnalysisForm onSubmit={handleRunReport} isLoading={isLoading} />
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-40 border-t border-white/5">
             <div className="w-px h-24 bg-gradient-to-b from-teal-400 to-transparent animate-bounce" />
             <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.5em] text-teal-400">Executing GraphQL Workflow...</p>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 border-t border-white/5 pt-20">
            <SentimentCard 
              rating={data.business_average_rating} 
              total={data.business_total_reviews_fetched} 
            />
            <div className="bg-white/[0.02] border border-white/5 p-12 rounded-[3rem]">
              <ReportDashboard markdown={data.report} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

