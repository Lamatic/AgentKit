'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, AlertCircle, Loader2, Plus } from 'lucide-react';
import { getSubmissions, getSponsors, addSponsor } from '../../actions/orchestrate';

interface Submission {
  id: string;
  project_title: string;
  category: string;
  matched_sponsor: string;
  breakout_table: string;
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [sponsors, setSponsors] = useState<string[]>([]);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorDesc, setNewSponsorDesc] = useState('');
  const [addingSponsor, setAddingSponsor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [submissionsData, sponsorsData] = await Promise.all([
          getSubmissions(),
          getSponsors()
        ]);
        setSubmissions(submissionsData);
        setSponsors(sponsorsData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSponsorChange = (id: string, newSponsor: string) => {
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, matched_sponsor: newSponsor } : sub
      )
    );
    
    const sub = submissions.find(s => s.id === id);
    if (sub) {
      setNotification(`Reassigned "${sub.project_title}" to ${newSponsor}`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorName.trim()) return;

    try {
      setAddingSponsor(true);
      await addSponsor(newSponsorName.trim(), newSponsorDesc.trim());
      setNotification(`Sponsor "${newSponsorName.trim()}" added successfully.`);
      setSponsors(prev => [...prev, newSponsorName.trim()]);
      setNewSponsorName('');
      setNewSponsorDesc('');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add sponsor.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setAddingSponsor(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors gap-1.5 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Hub
            </Link>
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold">Admin Console</h1>
            </div>
            <p className="text-gray-400 text-sm">
              Manage showcase submissions and override sponsor matches.
            </p>
          </div>
        </header>

        {/* Action Notifications */}
        {notification && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center space-x-3 text-blue-400 animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{notification}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Add Sponsor Form (Glassmorphism card) */}
        {!loading && (
          <div className="mb-8 p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Add New Sponsor
            </h2>
            <form onSubmit={handleAddSponsor} className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Sponsor Name (e.g. Neon, Supabase)"
                value={newSponsorName}
                onChange={(e) => setNewSponsorName(e.target.value)}
                disabled={addingSponsor}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors flex-1"
              />
              <input
                type="text"
                placeholder="Sponsor Description (optional)"
                value={newSponsorDesc}
                onChange={(e) => setNewSponsorDesc(e.target.value)}
                disabled={addingSponsor}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors flex-2"
              />
              <button
                type="submit"
                disabled={addingSponsor || !newSponsorName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-6 py-3 text-sm font-semibold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {addingSponsor ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Sponsor
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-400 text-sm">Loading submissions from Lamatic...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-xl">
            No submissions found.
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800/50 border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">Project Title</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Matched Sponsor</th>
                    <th className="py-4 px-6">Breakout Table</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">
                        {sub.project_title}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700/50">
                          {sub.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {sub.matched_sponsor}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-yellow-400 text-sm font-semibold">
                          {sub.breakout_table}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <select
                          value={sub.matched_sponsor}
                          onChange={(e) => handleSponsorChange(sub.id, e.target.value)}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {sponsors.map((sponsor) => (
                            <option key={sponsor} value={sponsor}>
                              Assign to {sponsor}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
