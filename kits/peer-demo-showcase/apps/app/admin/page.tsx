'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Loader2, Plus, LogOut, Trash2 } from 'lucide-react';
import { getSubmissions, getSponsors, addSponsor, deleteSubmission } from '../../actions/orchestrate';
import { logout } from '../../actions/auth';
import { toast } from 'sonner';
import Dropdown from '../../components/Dropdown';

interface Submission {
  id: string;
  project_title: string;
  category: string;
  matched_sponsor: string;
  breakout_table: string;
  builder_name?: string;
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [sponsors, setSponsors] = useState<string[]>([]);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorDesc, setNewSponsorDesc] = useState('');
  const [addingSponsor, setAddingSponsor] = useState(false);
  const [loading, setLoading] = useState(true);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);

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
        toast.error(err.message || 'Failed to load data.');
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
      toast.success(`Reassigned "${sub.project_title}" to ${newSponsor}`);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this project? This will remove it permanently from the database.");
    if (!confirmDelete) return;

    try {
      await deleteSubmission(id);
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
      toast.success("Project deleted successfully from database.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project.");
    }
  };

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorName.trim()) return;

    try {
      setAddingSponsor(true);
      await addSponsor(newSponsorName.trim(), newSponsorDesc.trim());
      toast.success(`Sponsor "${newSponsorName.trim()}" added successfully.`);
      setSponsors(prev => [...prev, newSponsorName.trim()]);
      setNewSponsorName('');
      setNewSponsorDesc('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to add sponsor.');
    } finally {
      setAddingSponsor(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 0.5rem;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 select-none mb-4 w-fit shadow-sm backdrop-blur-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Hub
            </Link>
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold">Admin Console</h1>
            </div>
            <p className="text-gray-400 text-sm">
              Manage showcase submissions and override sponsor matches.
            </p>
          </div>
          <div>
            <button
              onClick={() => logout()}
              className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-white/10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Add Sponsor Form (Glassmorphism card) */}
        {!loading && (
          <div className="mb-8 p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-visible">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Add New Sponsor
            </h2>
            <form onSubmit={handleAddSponsor} className="flex flex-col md:flex-row gap-3 relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Sponsor Name (e.g. Neon, Supabase)"
                  value={newSponsorName}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setNewSponsorName(val);
                    if (val.length > 1) {
                      setFetchingSuggestions(true);
                      try {
                        const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(val)}`);
                        if (res.ok) {
                          const data = await res.json();
                          setSuggestions(data);
                          setShowSuggestions(true);
                        }
                      } catch (err) {
                        console.error('Failed to fetch suggestions', err);
                      } finally {
                        setFetchingSuggestions(false);
                      }
                    } else {
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    // Timeout to allow click on suggestion to register before closing
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  disabled={addingSponsor}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden backdrop-blur-xl">
                    {suggestions.map((company, idx) => (
                      <li 
                        key={idx}
                        className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors"
                        onClick={() => {
                          setNewSponsorName(company.name);
                          if (!newSponsorDesc) {
                            setNewSponsorDesc(`Tech company at ${company.domain}`);
                          }
                          setShowSuggestions(false);
                        }}
                      >
                        {company.logo ? (
                          <img src={company.logo} alt={company.name} className="w-6 h-6 rounded-md object-contain bg-white" />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-xs font-bold">{company.name.charAt(0)}</div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{company.name}</span>
                          <span className="text-xs text-gray-400">{company.domain}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
          <div className="space-y-8">
            {/* Skeleton for Add Sponsor form area */}
            <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
              <div className="skeleton h-6 w-40 mb-4" />
              <div className="flex flex-col md:flex-row gap-3">
                <div className="skeleton h-11 flex-1" />
                <div className="skeleton h-11 flex-[2]" />
                <div className="skeleton h-11 w-36" />
              </div>
            </div>

            {/* Skeleton for submissions table */}
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
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="hover:bg-gray-800/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="skeleton w-40 h-4" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="skeleton w-20 h-4" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="skeleton w-24 h-6" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="skeleton w-16 h-4" />
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="skeleton w-28 h-8 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-xl">
            No submissions found.
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl overflow-visible pb-40">
            <div className="overflow-x-auto overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800/50 border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-5 px-6">Project Title</th>
                    <th className="py-5 px-6">Category</th>
                    <th className="py-5 px-6">Matched Sponsor</th>
                    <th className="py-5 px-6">Breakout Table</th>
                    <th className="py-5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {submissions.map((sub) => {
                    const sponsorOptions = sponsors.map((s) => ({ value: s, label: `Assign to ${s}` }));
                    return (
                      <tr key={sub.id} className="hover:bg-white/5 border-b border-white/5 hover:border-white/10 transition-all duration-200">
                        <td className="py-5 px-6">
                          <div className="font-bold text-white text-base leading-tight">
                            {sub.project_title}
                          </div>
                          {sub.builder_name && (
                            <div className="text-xs text-gray-500 font-medium mt-1">
                              by {sub.builder_name}
                            </div>
                          )}
                        </td>
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {sub.category}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {sub.matched_sponsor}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            {sub.breakout_table}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div className="flex items-center justify-end gap-3 relative z-40">
                            <Dropdown
                              value={sub.matched_sponsor}
                              onChange={(val) => handleSponsorChange(sub.id, val)}
                              options={sponsorOptions}
                              placeholder="Reassign sponsor"
                            />
                            <button
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all duration-200"
                              title="Delete submission"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
