'use client';
import React, { useState } from 'react';

export default function Page() {
  const [ticketText, setTicketText] = useState('');
  const [loading, setLoading] = useState(false);
  const [triageData, setTriageData] = useState<any>(null);

  const executeFlow = async () => {
    const normalizedTicket = ticketText.trim();
    if (!normalizedTicket) {
      setTriageData({ error: "Please enter a ticket before processing." });
      return;
    }

    setLoading(true);
    setTriageData(null);
    
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_text: normalizedTicket })
      });
      
      const response = await res.json();
      const data = response.result || response;

      // Improved Rate Limit Detection
      const message = typeof data?.message === 'string' ? data.message.toLowerCase() : '';
      const isRateLimited = message.includes('quota') || message.includes('rate limit') || data?.status === 429;
      
      if (isRateLimited) {
        setTriageData({ error: "API Rate Limit: Free tier restricted. Please wait 60 seconds before testing the next ticket." });
      } else if (data.error) {
        setTriageData({ error: data.error });
      } else {
        setTriageData(data);
      }

    } catch (error) {
      console.error("Execution error:", error);
      setTriageData({ error: "Failed to connect to AI triage." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-100 dark:from-gray-950 dark:via-gray-900 dark:to-black text-gray-900 dark:text-gray-100 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto space-y-8 mt-10 md:mt-20">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-500/10 rounded-full mb-4 border border-blue-200 dark:border-blue-500/20">
            <span className="text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase px-3">AgentKit Challenge</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 pb-2">
            AI Support Triage Engine
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl mx-auto">
            Instantly categorize issues, analyze customer sentiment, and draft responses using Lamatic flows.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-xl dark:shadow-2xl">
          <label htmlFor="ticketText" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            Inbound Customer Ticket
          </label>
          <textarea 
            id="ticketText"
            className="w-full p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-sm transition-all duration-300"
            value={ticketText}
            onChange={(e) => setTicketText(e.target.value)}
            placeholder="I was overcharged by $50 on my invoice today and I am furious!"
            spellCheck="false"
          />
          
          <button 
            onClick={executeFlow}
            disabled={loading}
            className="mt-6 w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-800 dark:disabled:to-gray-900 disabled:text-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-md dark:shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] disabled:shadow-none flex justify-center items-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Ticket...
              </span>
            ) : 'Process Ticket'}
          </button>
        </div>

        {/* Error State */}
        {triageData?.error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-5 flex items-start gap-4">
            <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-full mt-0.5">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-red-800 dark:text-red-400 font-bold">Execution Error</h3>
              <p className="text-red-600 dark:text-red-300/80 text-sm mt-1">{triageData.error}</p>
            </div>
          </div>
        )}

        {/* Results Area */}
        {triageData && !triageData.error && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-md dark:shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] dark:shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">Category</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{triageData.category || 'N/A'}</p>
              </div>

              <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-md dark:shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] dark:shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">Sentiment</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{triageData.sentiment || 'N/A'}</p>
              </div>

              <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-md dark:shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)] dark:shadow-[0_0_10px_rgba(251,113,133,0.8)]"></div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">Urgency</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{triageData.urgency || 'N/A'}</p>
              </div>
            </div>

            {/* AI Draft Response */}
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-md dark:shadow-lg backdrop-blur-md">
              <div className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generated AI Draft
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-black/20">
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-300 font-medium">
                  {triageData.draft || JSON.stringify(triageData, null, 2)}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Subtle Credit Footer */}
        <div className="text-center pt-8 pb-4">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Built for the AgentKit Challenge by Yash Singhal
          </p>
        </div>
      </div>
    </div>
  );
}