'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Loader2, Plus, LogOut, Trash2, Trophy, Clock, CheckCircle2, Award, Calendar, UserPlus, UserCheck, Star } from 'lucide-react';
import { getSubmissions, getSponsors, addSponsor, deleteSubmission, updateProjectStatus, updateProjectSponsor, getEventConfig, setEventConfig, manageJudges, getScores, JudgeScore } from '../../actions/orchestrate';
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
  status?: string;
}

const MANAGED_SPONSORS: Array<{ name: string; domain: string; logo: string }> = [
  { name: 'Google Cloud', domain: 'cloud.google.com', logo: 'https://logo.clearbit.com/cloud.google.com' },
  { name: 'Vercel', domain: 'vercel.com', logo: 'https://logo.clearbit.com/vercel.com' },
  { name: 'Supabase', domain: 'supabase.com', logo: 'https://logo.clearbit.com/supabase.com' },
  { name: 'Neon', domain: 'neon.tech', logo: 'https://logo.clearbit.com/neon.tech' },
  { name: 'Stitch', domain: 'stitch.com', logo: 'https://logo.clearbit.com/stitch.com' },
  { name: 'MongoDB', domain: 'mongodb.com', logo: 'https://logo.clearbit.com/mongodb.com' },
  { name: 'Resend', domain: 'resend.com', logo: 'https://logo.clearbit.com/resend.com' },
  { name: 'Lamatic.ai', domain: 'lamatic.ai', logo: 'https://logo.clearbit.com/lamatic.ai' },
  { name: 'OpenAI', domain: 'openai.com', logo: 'https://logo.clearbit.com/openai.com' },
  { name: 'GitHub', domain: 'github.com', logo: 'https://logo.clearbit.com/github.com' },
  { name: 'Anthropic', domain: 'anthropic.com', logo: 'https://logo.clearbit.com/anthropic.com' },
  { name: 'Stripe', domain: 'stripe.com', logo: 'https://logo.clearbit.com/stripe.com' },
  { name: 'Cloudflare', domain: 'cloudflare.com', logo: 'https://logo.clearbit.com/cloudflare.com' },
  { name: 'PostHog', domain: 'posthog.com', logo: 'https://logo.clearbit.com/posthog.com' },
  { name: 'Pinecone', domain: 'pinecone.io', logo: 'https://logo.clearbit.com/pinecone.io' },
  { name: 'LangChain', domain: 'langchain.com', logo: 'https://logo.clearbit.com/langchain.com' }
];

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [sponsors, setSponsors] = useState<string[]>([]);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorDesc, setNewSponsorDesc] = useState('');
  const [addingSponsor, setAddingSponsor] = useState(false);
  const [loading, setLoading] = useState(true);

  // Event Config & Deadline state
  const [deadline, setDeadline] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);
  
  // Winner Declaration Timer state
  const [winnerDeclarationTime, setWinnerDeclarationTime] = useState('');
  const [savingWinnerTimer, setSavingWinnerTimer] = useState(false);

  // Judges state
  const [judges, setJudges] = useState<any[]>([]);
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgePassword, setNewJudgePassword] = useState('');
  const [addingJudge, setAddingJudge] = useState(false);

  // Judge Scores state
  const [scores, setScores] = useState<JudgeScore[]>([]);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [submissionsData, sponsorsData, configData, judgeList, scoreList] = await Promise.all([
          getSubmissions(),
          getSponsors(),
          getEventConfig(),
          manageJudges('list'),
          getScores()
        ]);
        setSubmissions(submissionsData);
        setSponsors(sponsorsData);
        const formatIsoToLocalInput = (isoStr?: string) => {
          if (!isoStr) return '';
          const d = new Date(isoStr);
          if (isNaN(d.getTime())) return '';
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setDeadline(formatIsoToLocalInput(configData.submission_deadline));
        setWinnerDeclarationTime(formatIsoToLocalInput(configData.winner_declaration_time));
        setJudges((judgeList as any[]) || []);
        setScores(scoreList || []);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto logout after 15 minutes of inactivity or leaving the app
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        toast.info('Logged out due to inactivity.');
        logout();
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, []);

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadline || !deadline.trim()) {
      toast.error('Please select or enter a valid deadline date.');
      return;
    }
    const dateObj = new Date(deadline);
    if (isNaN(dateObj.getTime())) {
      toast.error('Invalid deadline date format. Please select a valid date.');
      return;
    }
    try {
      setSavingDeadline(true);
      const isoDate = dateObj.toISOString();
      await setEventConfig('submission_deadline', isoDate);
      toast.success('Submission deadline updated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save deadline.');
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleSaveWinnerTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winnerDeclarationTime || !winnerDeclarationTime.trim()) {
      toast.error('Please select or enter a valid winner declaration date.');
      return;
    }
    const dateObj = new Date(winnerDeclarationTime);
    if (isNaN(dateObj.getTime())) {
      toast.error('Invalid winner declaration date format. Please select a valid date.');
      return;
    }
    try {
      setSavingWinnerTimer(true);
      const isoDate = dateObj.toISOString();
      await setEventConfig('winner_declaration_time', isoDate);
      toast.success('Winner declaration countdown timer updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save winner declaration time.');
    } finally {
      setSavingWinnerTimer(false);
    }
  };

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeName.trim() || !newJudgePassword) return;

    try {
      setAddingJudge(true);
      const res: any = await manageJudges('add', { name: newJudgeName.trim(), password: newJudgePassword });
      setJudges((prev) => [...prev, res.judge]);
      setNewJudgeName('');
      setNewJudgePassword('');
      toast.success(`Judge account for "${newJudgeName.trim()}" created.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add judge account.');
    } finally {
      setAddingJudge(false);
    }
  };

  const handleRemoveJudge = async (id: string) => {
    try {
      await manageJudges('remove', { id });
      setJudges((prev) => prev.filter((j) => j.id !== id));
      toast.success('Judge account removed.');
    } catch (err: any) {
      toast.error('Failed to remove judge account.');
    }
  };

  const handleSponsorChange = async (id: string, newSponsor: string) => {
    const sub = submissions.find((s) => s.id === id);
    try {
      await updateProjectSponsor(id, newSponsor);
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, matched_sponsor: newSponsor } : item
        )
      );
      if (sub) {
        toast.success(`Reassigned "${sub.project_title}" to ${newSponsor}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reassign sponsor.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateProjectStatus(id, newStatus);
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === id ? { ...sub, status: newStatus } : sub))
      );
      toast.success(`Project status updated to "${newStatus.replace('_', ' ')}"`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
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
                    if (val.trim().length > 1) {
                      setFetchingSuggestions(true);
                      try {
                        const queryLower = val.toLowerCase().trim();
                        const matches = MANAGED_SPONSORS.filter(
                          (s) => s.name.toLowerCase().includes(queryLower) || s.domain.toLowerCase().includes(queryLower)
                        );

                        if (matches.length > 0) {
                          setSuggestions(matches);
                          setShowSuggestions(true);
                        } else {
                          setSuggestions([]);
                          setShowSuggestions(false);
                          toast.info('No matching managed sponsor found. You can enter custom details below.', { id: 'sponsor-lookup-notice' });
                        }
                      } catch (err) {
                        console.error('Failed to fetch sponsor suggestions', err);
                        setSuggestions([]);
                        setShowSuggestions(false);
                        toast.error('Sponsorship lookup unavailable. You can enter the sponsor name manually.');
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
                    <th className="py-5 px-6">Recommended Track</th>
                    <th className="py-5 px-6">Breakout Table</th>
                    <th className="py-5 px-6">Status</th>
                    <th className="py-5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {submissions.map((sub) => {
                    const sponsorOptions = sponsors.map((s) => ({ value: s, label: `Assign to ${s}` }));
                    const statusOptions = [
                      { value: 'submitted', label: 'Status: Submitted' },
                      { value: 'under_review', label: 'Status: Under Review' },
                      { value: 'shortlisted', label: 'Status: Shortlisted' },
                      { value: 'winner', label: 'Status: Winner 🏆' },
                    ];
                    const currentStatus = sub.status || 'submitted';
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
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            currentStatus === 'winner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]' :
                            currentStatus === 'shortlisted' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                            currentStatus === 'under_review' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                            'bg-gray-800 text-gray-400 border border-gray-700/50'
                          }`}>
                            {currentStatus === 'winner' && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                            {currentStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div className="flex items-center justify-end gap-3 relative z-40">
                            <Dropdown
                              value={sub.matched_sponsor}
                              onChange={(val) => handleSponsorChange(sub.id, val)}
                              options={sponsorOptions}
                              placeholder="Change track"
                            />
                            <Dropdown
                              value={currentStatus}
                              onChange={(val) => handleStatusChange(sub.id, val)}
                              options={statusOptions}
                              placeholder="Status"
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

        {/* Admin Event Settings & Judge Management Row */}
        {!loading && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Event Settings / Deadline Config */}
            <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Submission Deadline Settings
              </h2>
              <form onSubmit={handleSaveDeadline} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Event Cutoff Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Submissions and re-submissions will be automatically disabled across the platform after this cutoff time.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={savingDeadline}
                  className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {savingDeadline ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Deadline</span>}
                </button>
              </form>

              {/* Winner Declaration Timer */}
              <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 text-amber-300">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Winner Declaration Timer
                </h3>
                <form onSubmit={handleSaveWinnerTimer} className="space-y-3">
                  <input
                    type="datetime-local"
                    value={winnerDeclarationTime}
                    onChange={(e) => setWinnerDeclarationTime(e.target.value)}
                    className="w-full bg-black/40 border border-amber-500/20 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50"
                  />
                  <button
                    type="submit"
                    disabled={savingWinnerTimer}
                    className="w-full py-2.5 rounded-xl font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {savingWinnerTimer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Set Winner Declaration Timer</span>}
                  </button>
                </form>
              </div>
            </div>

            {/* Manage Judge Accounts */}
            <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                Manage Judge Accounts ({judges.length})
              </h2>

              <form onSubmit={handleAddJudge} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Judge Name (e.g. Sarah)"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  type="password"
                  placeholder="Access Password"
                  value={newJudgePassword}
                  onChange={(e) => setNewJudgePassword(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={addingJudge}
                  className="sm:col-span-2 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-colors"
                >
                  Create Judge Account
                </button>
              </form>

              {/* Active Judges List */}
              <div className="space-y-2 pt-2 border-t border-white/10 max-h-[140px] overflow-y-auto">
                {judges.map((j) => (
                  <div key={j.id} className="flex items-center justify-between bg-black/40 border border-white/5 px-3 py-2 rounded-xl text-xs">
                    <span className="font-semibold text-gray-200 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      {j.name}
                    </span>
                    <button
                      onClick={() => handleRemoveJudge(j.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Judge Scores Summary Leaderboard */}
        {!loading && (
          <div className="mt-12 p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                Judge Evaluation Leaderboard
              </h2>
              <span className="text-xs text-gray-400">Ranked by Average Weighted Score</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800/50 border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">Rank</th>
                    <th className="py-4 px-6">Project Title</th>
                    <th className="py-4 px-6">Track</th>
                    <th className="py-4 px-6">Evaluations</th>
                    <th className="py-4 px-6">Avg Score</th>
                    <th className="py-4 px-6 text-right">Quick Award</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-sm">
                  {submissions
                    .map((sub) => {
                      const projScores = scores.filter((s) => s.project_id === sub.id);
                      let avg = 0;
                      if (projScores.length > 0) {
                        const sum = projScores.reduce((acc, s) => acc + (s.innovation * 0.3 + s.execution * 0.3 + s.impact * 0.2 + s.presentation * 0.2), 0);
                        avg = parseFloat((sum / projScores.length).toFixed(1));
                      }
                      return { ...sub, avgScore: avg, evalCount: projScores.length };
                    })
                    .sort((a, b) => b.avgScore - a.avgScore)
                    .map((item, idx) => (
                      <tr key={item.id} className="hover:bg-white/5 border-b border-white/5">
                        <td className="py-4 px-6 font-bold">
                          {idx === 0 ? <span className="text-amber-400 text-base">🥇 #1</span> :
                           idx === 1 ? <span className="text-gray-300 text-base">🥈 #2</span> :
                           idx === 2 ? <span className="text-amber-600 text-base">🥉 #3</span> :
                           <span className="text-gray-500">#{idx + 1}</span>}
                        </td>
                        <td className="py-4 px-6 font-bold text-white">{item.project_title}</td>
                        <td className="py-4 px-6 text-xs text-emerald-400">{item.matched_sponsor}</td>
                        <td className="py-4 px-6 text-xs text-gray-400">{item.evalCount} judge(s)</td>
                        <td className="py-4 px-6 font-extrabold text-amber-400 text-base">{item.avgScore > 0 ? `${item.avgScore} pts` : 'N/A'}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleStatusChange(item.id, 'winner')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black transition-all"
                          >
                            Mark Winner 🏆
                          </button>
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
