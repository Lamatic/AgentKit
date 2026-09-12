"use client";
import { useState } from 'react';

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);

  const generateProposal = async () => {
    setLoading(true);
    setProposal('');
    try {
      const res = await fetch('/api/proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
          freelancer_skills: skills,
        }),
      });
      
      const data = await res.json();
      setProposal(data.proposal);
    } catch (error) {
      console.error(error);
      setProposal("Something went wrong communicating with the server.");
    }
    setLoading(false);
  };

  return (
    <main className="p-8 max-w-2xl mx-auto min-h-screen bg-black">
      <h1 className="text-3xl font-bold mb-6 text-zinc-50">Freelance Proposal Tailor</h1>
      
      <div className="flex flex-col gap-4">
        <textarea 
          className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded text-white placeholder-zinc-400 shadow-sm focus:outline-none focus:border-blue-500"
          placeholder="Paste the Client's Job Description here..."
          rows={5}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        
        <textarea 
          className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded text-white placeholder-zinc-400 shadow-sm focus:outline-none focus:border-blue-500"
          placeholder="Enter your specific skills and experience..."
          rows={3}
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        
        <button 
          className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold px-6 py-3 rounded w-full sm:w-auto self-start"
          onClick={generateProposal}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Proposal'}
        </button>
      </div>

      {proposal && (
        <div className="mt-8 p-6 bg-zinc-900 rounded-lg text-zinc-100 whitespace-pre-wrap border border-zinc-700 shadow-lg">
          <h2 className="font-bold mb-4 text-xl border-b border-zinc-700 pb-2">Your Tailored Proposal:</h2>
          <p className="leading-relaxed">{proposal}</p>
        </div>
      )}
    </main>
  );
}