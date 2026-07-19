'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, Award, Flame, Loader2, AlertCircle, Github, Globe } from 'lucide-react';
import { getSubmissions, upvoteProject } from '../../actions/orchestrate';

interface GalleryProject {
  id: string;
  project_title: string;
  category: string;
  matched_sponsor: string;
  tech_stack: string[];
  description: string;
  upvotes: number;
  hasUpvoted?: boolean;
  github_url?: string;
  hosted_link?: string;
}

export default function GalleryPage() {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getSubmissions();
        const formatted = data.map((sub) => {
          let techStackArr: string[] = [];
          if (sub.tech_stack) {
            techStackArr = sub.tech_stack.split(',').map((t: string) => t.trim()).filter(Boolean);
          }
          return {
            id: sub.id,
            project_title: sub.project_title,
            category: sub.category,
            matched_sponsor: sub.matched_sponsor,
            tech_stack: techStackArr,
            description: sub.description || 'No description provided.',
            upvotes: sub.upvotes || 0,
            hasUpvoted: false,
            github_url: sub.github_url,
            hosted_link: sub.hosted_link
          };
        });
        setProjects(formatted);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load gallery projects.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpvote = async (id: string) => {
    // Optimistic UI update
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === id) {
          const isUpvoted = !project.hasUpvoted;
          return {
            ...project,
            upvotes: project.upvotes + (isUpvoted ? 1 : -1),
            hasUpvoted: isUpvoted,
          };
        }
        return project;
      })
    );

    try {
      await upvoteProject(id);
    } catch (err) {
      console.error('Failed to persist upvote:', err);
      // Revert state on error
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id === id) {
            const isUpvoted = !project.hasUpvoted;
            return {
              ...project,
              upvotes: project.upvotes + (isUpvoted ? 1 : -1),
              hasUpvoted: isUpvoted,
            };
          }
          return project;
        })
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <header className="mb-10">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors gap-1.5 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Link>
          <div className="flex items-center space-x-2">
            <Flame className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold">Project Showcase Gallery</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Browse submitted projects and support your favorite hacker submissions.
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Interactive Leaderboard Chart */}
        {!loading && projects.length > 0 && (
          <div className="mb-10 p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              Top Upvoted Leaderboard
            </h2>
            <div className="space-y-4 max-w-3xl">
              {projects
                .slice()
                .sort((a, b) => b.upvotes - a.upvotes)
                .slice(0, 3)
                .map((project, index) => {
                  const maxUpvotes = Math.max(...projects.map(p => p.upvotes), 1);
                  const percentage = (project.upvotes / maxUpvotes) * 100;
                  return (
                    <div key={project.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-500 text-xs w-4">#{index + 1}</span>
                          <span className="font-bold text-white text-base">{project.project_title}</span>
                          <span className="text-xs text-gray-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">{project.matched_sponsor}</span>
                        </div>
                        <span className="font-bold text-orange-400 text-sm">{project.upvotes} upvotes</span>
                      </div>
                      <div className="w-full bg-black/40 border border-white/5 h-3 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ type: "spring", stiffness: 60, damping: 15 }}
                          className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-400 text-sm">Loading projects from Lamatic...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-xl">
            No projects found in the gallery.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between hover:border-gray-700 transition-all shadow-lg"
              >
                <div className="space-y-4">
                  {/* Category & Sponsor */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                      {project.category}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Award className="w-3.5 h-3.5" />
                      {project.matched_sponsor}
                    </span>
                  </div>

                  {/* Project Title */}
                  <div>
                    <h2 className="text-xl font-bold text-white">{project.project_title}</h2>
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed line-clamp-3">
                      {project.description}
                    </p>
                  </div>

                  {/* Tech Stack Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {project.tech_stack.map((tech) => (
                      <span 
                        key={tech} 
                        className="bg-gray-800/80 text-gray-300 border border-gray-700/50 rounded-md px-2 py-0.5 text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer with Upvote Button & GitHub / Demo Link */}
                <div className="border-t border-gray-800/80 mt-6 pt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleUpvote(project.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      project.hasUpvoted 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                        : 'bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white border border-gray-700/50'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 transition-transform duration-200 ${project.hasUpvoted ? 'scale-110 fill-current' : ''}`} />
                    <span>Upvote ({project.upvotes})</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white border border-gray-700/50 transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        <span>Code</span>
                      </a>
                    )}
                    {project.hosted_link && (
                      <a
                        href={project.hosted_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/35 text-blue-400 hover:text-white border border-blue-500/20 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
