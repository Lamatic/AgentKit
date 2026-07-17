'use client';

import { useState } from 'react';
import { submitProject } from '../actions/orchestrate';

interface SubmissionResult {
  project_title: string;
  category: string;
  matched_sponsor: string;
  match_justification: string;
  breakout_table: string;
}

export default function Home() {
  const [githubUrl, setGithubUrl] = useState('');
  const [builderName, setBuilderName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await submitProject(githubUrl, builderName, contactEmail);
      setResult(data);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Peer Demo Showcase Hub</h1>
        <p className="text-gray-400 mb-8">
          Submit your project and get instantly matched with a sponsor.
        </p>

        <div className="bg-gray-900 rounded-xl p-6 space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">GitHub URL</label>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Your Name</label>
            <input
              type="text"
              value={builderName}
              onChange={(e) => setBuilderName(e.target.value)}
              placeholder="Avadhut Kaskar"
              className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !githubUrl || !builderName || !contactEmail}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg px-4 py-3 font-semibold transition-colors"
          >
            {loading ? 'Analyzing your project...' : 'Submit Project'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {result && (
          <div className="bg-gray-900 rounded-xl p-6 space-y-4 border border-blue-800">
            <h2 className="text-xl font-bold text-blue-400">Match Found</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Project</p>
                <p className="text-lg font-semibold">{result.project_title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                <p>{result.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Matched Sponsor</p>
                <p className="text-green-400 font-semibold">{result.matched_sponsor}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Why</p>
                <p className="text-gray-300 text-sm">{result.match_justification}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Assigned Session</p>
                <p className="text-yellow-400">{result.breakout_table}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}