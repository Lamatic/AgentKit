'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, Award, Github, Globe, MapPin, Mail, User, Sparkles, Loader2, Trophy, RefreshCw, Edit3, X } from 'lucide-react';
import { getSubmissions, upvoteProject, resubmitProject } from '../../../actions/orchestrate';
import { toast } from 'sonner';

interface Project {
  id: string;
  project_title: string;
  category: string;
  matched_sponsor: string;
  breakout_table: string;
  tech_stack: string;
  description: string;
  builder_name: string;
  contact_email: string;
  github_url: string;
  hosted_link: string;
  upvotes: number;
  hasUpvoted?: boolean;
  status?: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateGithubUrl, setUpdateGithubUrl] = useState('');
  const [updateHostedLink, setUpdateHostedLink] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        const allProjects = await getSubmissions();
        const found = allProjects.find((p: any) => p.id === id);
        
        let upvotedIds: string[] = [];
        try {
          const stored = localStorage.getItem('showcase_upvoted_ids');
          if (stored) upvotedIds = JSON.parse(stored);
        } catch (e) {}

        if (found) {
          setProject({
            ...found,
            hasUpvoted: upvotedIds.includes(found.id?.toString()),
          });
          setUpdateGithubUrl(found.github_url || '');
          setUpdateHostedLink(found.hosted_link || '');
        } else {
          toast.error('Project not found.');
        }
      } catch (err: any) {
        toast.error('Failed to load project details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchProject();
    }
  }, [id]);

  const handleUpvote = async () => {
    if (!project) return;

    let upvotedIds: string[] = [];
    try {
      const stored = localStorage.getItem('showcase_upvoted_ids');
      if (stored) upvotedIds = JSON.parse(stored);
    } catch (e) {}

    if (upvotedIds.includes(project.id) || project.hasUpvoted) {
      toast.error('You have already upvoted this project!');
      return;
    }

    const originalProject = { ...project };

    // Update localStorage
    try {
      localStorage.setItem('showcase_upvoted_ids', JSON.stringify([...upvotedIds, project.id]));
    } catch (e) {}

    setProject({
      ...project,
      upvotes: project.upvotes + 1,
      hasUpvoted: true,
    });

    try {
      await upvoteProject(project.id, project.upvotes);
      toast.success('Vote registered!');
    } catch (err) {
      toast.error('Failed to save upvote');
      try {
        localStorage.setItem('showcase_upvoted_ids', JSON.stringify(upvotedIds));
      } catch (e) {}
      setProject(originalProject);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    if (!updateGithubUrl.startsWith('https://github.com/')) {
      toast.error('GitHub URL must start with https://github.com/');
      return;
    }

    try {
      setResubmitting(true);
      const newMatch = await resubmitProject(
        project.id,
        updateGithubUrl,
        project.builder_name,
        project.contact_email,
        updateHostedLink
      );
      setProject({
        ...project,
        github_url: updateGithubUrl,
        hosted_link: updateHostedLink,
        category: newMatch.category,
        matched_sponsor: newMatch.matched_sponsor,
        breakout_table: newMatch.breakout_table,
        tech_stack: newMatch.tech_stack || project.tech_stack,
        description: newMatch.match_justification || project.description,
        status: 'submitted'
      });
      setShowUpdateModal(false);
      toast.success('Project resubmitted & AI track re-calculated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update submission');
    } finally {
      setResubmitting(false);
    }
  };

  const getTechPills = (techStackStr?: string) => {
    if (!techStackStr) return [];
    return techStackStr.split(',').map((t) => t.trim()).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm">Fetching project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-card max-w-md p-8 rounded-2xl border border-white/10 space-y-6">
          <h2 className="text-2xl font-bold text-red-400">Project Not Found</h2>
          <p className="text-gray-400">The project details could not be retrieved. It may have been removed or doesn't exist.</p>
          <Link href="/gallery" className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-all text-sm justify-center w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Return to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#030014] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/gallery"
          className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 select-none mb-6 w-fit shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Gallery
        </Link>

        {/* Hero Card */}
        <div className="glass-card rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-xs text-blue-400 font-extrabold tracking-widest uppercase px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
              {project.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Award className="w-4 h-4" />
              Recommended Track: {project.matched_sponsor}
            </span>
            {project.status && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                project.status === 'winner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]' :
                project.status === 'shortlisted' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                project.status === 'under_review' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                'bg-gray-800 text-gray-400 border border-gray-700/50'
              }`}>
                {project.status === 'winner' && <Trophy className="w-4 h-4 text-amber-400" />}
                Status: {project.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-500">
            {project.project_title}
          </h1>

          {/* Description */}
          <div className="text-gray-300 text-lg leading-relaxed mb-8 space-y-4">
            <p>{project.description || 'No description provided.'}</p>
          </div>

          {/* Tech Stack */}
          {project.tech_stack && (
            <div className="mb-8 border-t border-white/10 pt-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Built With</h4>
              <div className="flex flex-wrap gap-2.5">
                {getTechPills(project.tech_stack).map((tech) => (
                  <span
                    key={tech}
                    className="bg-white/5 text-gray-200 border border-white/10 rounded-xl px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer details (Breakout Session, Builder Info) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/10 pt-6">
            <div className="flex items-center space-x-4 bg-yellow-500/5 border border-yellow-500/10 p-5 rounded-2xl">
              <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-yellow-500 font-bold uppercase tracking-widest block mb-1">Breakout Session</span>
                <p className="text-base font-bold text-white">{project.breakout_table}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-blue-400 font-bold uppercase tracking-widest block mb-1">Created By</span>
                <p className="text-base font-bold text-white">{project.builder_name || 'Anonymous Hacker'}</p>
                {project.contact_email && (
                  <a href={`mailto:${project.contact_email}`} className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 mt-1 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    {project.contact_email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={handleUpvote}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold tracking-wide transition-all ${
              project.hasUpvoted
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <ThumbsUp className={`w-5 h-5 ${project.hasUpvoted ? 'fill-current' : ''}`} />
            <span>Upvote Project ({project.upvotes})</span>
          </button>

          <button
            onClick={() => setShowUpdateModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Update Submission</span>
          </button>

          <div className="flex flex-1 gap-4">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:border-gray-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg"
              >
                <Github className="w-5 h-5" />
                <span>Code</span>
              </a>
            )}
            {project.hosted_link && (
              <a
                href={project.hosted_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 py-4 rounded-2xl font-bold transition-all shadow-lg"
              >
                <Globe className="w-5 h-5" />
                <span>Demo</span>
              </a>
            )}
          </div>
        </div>

        {/* Update Submission Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="bg-[#0c0a1d] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Update Submission</h3>
                  <p className="text-xs text-gray-400">Re-submit your code repo or live link to re-trigger AI track matching.</p>
                </div>
              </div>

              <form onSubmit={handleResubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    GitHub Repository URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={updateGithubUrl}
                    onChange={(e) => setUpdateGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Hosted Live Demo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={updateHostedLink}
                    onChange={(e) => setUpdateHostedLink(e.target.value)}
                    placeholder="https://my-demo-app.vercel.app"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 py-3 rounded-xl font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resubmitting}
                    className="flex-1 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {resubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Re-analyzing...</span>
                      </>
                    ) : (
                      <span>Save & Re-Match</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
