'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Trophy, Award, Star, CheckCircle, LogOut, Loader2, Sparkles, MessageSquare, Github, ExternalLink, Globe } from 'lucide-react';
import { getSubmissions, getScores, submitScore, JudgeScore } from '../../actions/orchestrate';
import { judgeLogout } from '../../actions/auth';
import { toast } from 'sonner';

interface Project {
  id: string;
  project_title: string;
  category: string;
  matched_sponsor: string;
  breakout_table: string;
  description: string;
  builder_name: string;
  tech_stack: string;
  status?: string;
  github_url?: string;
  hosted_link?: string;
}

export default function JudgeDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [scores, setScores] = useState<JudgeScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJudgeName, setActiveJudgeName] = useState('Judge');

  // Active scoring form state per project
  const [evaluations, setEvaluations] = useState<Record<string, { innovation: number; execution: number; impact: number; presentation: number; notes: string }>>({});
  const [submittingProject, setSubmittingProject] = useState<string | null>(null);

  useEffect(() => {
    // Read judge name from cookie if available
    const match = document.cookie.match(/(?:^|; )judge_name=([^;]*)/);
    if (match && match[1]) {
      setActiveJudgeName(decodeURIComponent(match[1]));
    }

    async function loadData() {
      try {
        setLoading(true);
        const [allSubmissions, allScores] = await Promise.all([getSubmissions(), getScores()]);
        // Filter shortlisted projects
        const shortlisted = allSubmissions.filter((p: any) => p.status === 'shortlisted' || p.status === 'winner');
        setProjects(shortlisted);
        setScores(allScores);

        // Pre-fill default scores
        const initialEvals: Record<string, any> = {};
        shortlisted.forEach((p: any) => {
          initialEvals[p.id] = { innovation: 8, execution: 8, impact: 8, presentation: 8, notes: '' };
        });
        setEvaluations(initialEvals);
      } catch (err: any) {
        toast.error('Failed to load judge evaluations.');
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
        judgeLogout();
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

  const handleScoreChange = (projectId: string, field: string, value: any) => {
    setEvaluations((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [field]: value,
      },
    }));
  };

  const handleScoreSubmit = async (projectId: string) => {
    const evalData = evaluations[projectId];
    if (!evalData) return;

    try {
      setSubmittingProject(projectId);
      await submitScore(
        projectId,
        activeJudgeName,
        evalData.innovation,
        evalData.execution,
        evalData.impact,
        evalData.presentation,
        evalData.notes
      );
      toast.success(`Evaluation for project submitted!`);
      const updatedScores = await getScores();
      setScores(updatedScores);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit score');
    } finally {
      setSubmittingProject(null);
    }
  };

  const calculateWeightedScore = (innov: number, exec: number, imp: number, pres: number) => {
    return (innov * 0.3 + exec * 0.3 + imp * 0.2 + pres * 0.2).toFixed(1);
  };

  return (
    <main className="min-h-screen bg-[#030014] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 select-none mb-3 w-fit backdrop-blur-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Hub
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Judge Evaluation Dashboard</h1>
                <p className="text-xs text-purple-400 font-medium">Logged in as: <span className="text-white font-bold">{activeJudgeName}</span></p>
              </div>
            </div>
          </div>

          <button
            onClick={() => judgeLogout()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-xs font-semibold text-gray-300 transition-all w-fit"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Shortlisted Projects List */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 space-y-3">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
            <p className="text-sm">Fetching shortlisted finalists for judging...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
            No shortlisted projects available for evaluation yet.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Shortlisted Finalists ({projects.length})
              </h2>
              <span className="text-xs text-gray-400">Scoring Rubric: Innovation (30%) + Execution (30%) + Impact (20%) + Presentation (20%)</span>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {projects.map((project) => {
                const evalData = evaluations[project.id] || { innovation: 8, execution: 8, impact: 8, presentation: 8, notes: '' };
                const weightedTotal = calculateWeightedScore(evalData.innovation, evalData.execution, evalData.impact, evalData.presentation);
                const projectScores = scores.filter((s) => s.project_id === project.id);
                const isScoredByMe = projectScores.some((s) => s.judge_name === activeJudgeName);

                return (
                  <div key={project.id} className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-md">
                            {project.category}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md">
                            {project.matched_sponsor} Track
                          </span>
                        </div>
                        <h3 className="text-3xl font-extrabold text-white">{project.project_title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">{project.description}</p>
                        
                        {/* Links Section */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-semibold text-gray-200 hover:text-white transition-all group"
                            >
                              <Github className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                              <span>GitHub Repository</span>
                              <ExternalLink className="w-3 h-3 text-gray-500" />
                            </a>
                          )}
                          {project.hosted_link && (
                            <a
                              href={project.hosted_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-all group"
                            >
                              <Globe className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                              <span>Live Demo</span>
                              <ExternalLink className="w-3 h-3 text-emerald-500" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center min-w-[140px]">
                        <span className="text-xs text-purple-400 uppercase font-bold tracking-wider block mb-1">Score Calculation</span>
                        <span className="text-3xl font-black text-white">{weightedTotal}</span>
                        <span className="text-[10px] text-gray-400 block mt-1">out of 10.0</span>
                      </div>
                    </div>

                    {/* Criteria Sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-black/40 border border-white/5 p-6 rounded-2xl">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Innovation (30%)</label>
                          <span className="text-sm font-extrabold text-purple-400">{evalData.innovation}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={evalData.innovation}
                          onChange={(e) => handleScoreChange(project.id, 'innovation', parseInt(e.target.value))}
                          className="w-full accent-purple-500 bg-gray-800 rounded-lg h-2 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Execution (30%)</label>
                          <span className="text-sm font-extrabold text-blue-400">{evalData.execution}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={evalData.execution}
                          onChange={(e) => handleScoreChange(project.id, 'execution', parseInt(e.target.value))}
                          className="w-full accent-blue-500 bg-gray-800 rounded-lg h-2 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Impact (20%)</label>
                          <span className="text-sm font-extrabold text-emerald-400">{evalData.impact}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={evalData.impact}
                          onChange={(e) => handleScoreChange(project.id, 'impact', parseInt(e.target.value))}
                          className="w-full accent-emerald-500 bg-gray-800 rounded-lg h-2 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Presentation (20%)</label>
                          <span className="text-sm font-extrabold text-yellow-400">{evalData.presentation}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={evalData.presentation}
                          onChange={(e) => handleScoreChange(project.id, 'presentation', parseInt(e.target.value))}
                          className="w-full accent-yellow-500 bg-gray-800 rounded-lg h-2 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Qualitative Notes & Submit Action */}
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Judge Notes & Feedback</label>
                      <textarea
                        rows={2}
                        value={evalData.notes}
                        onChange={(e) => handleScoreChange(project.id, 'notes', e.target.value)}
                        placeholder="Write constructive evaluation feedback for this project..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50"
                      />

                      <div className="flex items-center justify-between pt-2">
                        {isScoredByMe ? (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Evaluated by {activeJudgeName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Not yet evaluated by you</span>
                        )}

                        <button
                          onClick={() => handleScoreSubmit(project.id)}
                          disabled={submittingProject === project.id}
                          className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 text-sm"
                        >
                          {submittingProject === project.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4 fill-current" />
                              <span>{isScoredByMe ? 'Update Evaluation' : 'Submit Evaluation'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Existing Scores Audit Row */}
                    {projectScores.length > 0 && (
                      <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Submitted Judge Feedback ({projectScores.length})</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {projectScores.map((score) => {
                            const total = calculateWeightedScore(score.innovation, score.execution, score.impact, score.presentation);
                            return (
                              <div key={score.id} className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1.5 text-xs">
                                <div className="flex justify-between items-center font-bold">
                                  <span className="text-purple-300">{score.judge_name}</span>
                                  <span className="text-amber-400 font-extrabold text-sm">{total} pts</span>
                                </div>
                                <div className="text-gray-400">
                                  Innov: {score.innovation} | Exec: {score.execution} | Imp: {score.impact} | Pres: {score.presentation}
                                </div>
                                {score.notes && (
                                  <p className="text-gray-300 italic pt-1 border-t border-white/5">{score.notes}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
