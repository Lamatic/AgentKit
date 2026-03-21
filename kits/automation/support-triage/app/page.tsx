'use client';
import React, { useState } from 'react';
import { lamaticClient } from './utils';

export default function Page() {
  const [ticketText, setTicketText] = useState('I was overcharged by $50 on my invoice today and I am furious!');
  const [loading, setLoading] = useState(false);
  const [triageData, setTriageData] = useState<any>(null);

  const executeFlow = async () => {
    setLoading(true);
    setTriageData(null);
    
    try {
      const response = await lamaticClient.executeFlow(
        process.env.NEXT_PUBLIC_LAMATIC_FLOW_ID as string, 
        { ticket_text: ticketText }
      );
      
      const data = response.result || response;

      // Intercept the quota error before it breaks the UI
      if (data.message && data.message.includes('quota')) {
        setTriageData({ error: "API Rate Limit: Free tier restricted. Please wait 60 seconds before testing the next ticket." });
      } else {
        setTriageData(data);
      }

    } catch (error) {
      console.error("Execution error:", error);
      setTriageData({ error: "Failed to connect to AI triage." });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">AI Support Triage Engine</h1>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Customer Ticket</label>
          <textarea 
            className="w-full p-4 bg-gray-900 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows={4}
            value={ticketText}
            onChange={(e) => setTicketText(e.target.value)}
          />
        </div>

        <button 
          onClick={executeFlow}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 font-semibold py-3 px-4 rounded-lg transition-all"
        >
          {loading ? 'Analyzing Ticket...' : 'Process Ticket'}
        </button>

        {triageData && !triageData.error && (
          <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg space-y-6 mt-8 shadow-xl">
            <div className="grid grid-cols-3 gap-4 border-b border-gray-800 pb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Category</p>
                <p className="font-semibold text-blue-400">{triageData.category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sentiment</p>
                <p className="font-semibold text-rose-400">{triageData.sentiment || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Urgency</p>
                <p className="font-semibold text-amber-400">{triageData.urgency || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">AI Email Draft</p>
              <div className="bg-gray-950 p-4 rounded border border-gray-800">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-300">
                  {triageData.draft || JSON.stringify(triageData, null, 2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {triageData?.error && (
          <div className="p-4 bg-red-900/50 border border-red-800 text-red-200 rounded-lg">
            {triageData.error}
          </div>
        )}
      </div>
    </div>
  );
}