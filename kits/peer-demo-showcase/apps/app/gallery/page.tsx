'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowLeft, ThumbsUp, Award, Flame, Search, ChevronLeft, ChevronRight, Github, Globe, Tag, Filter, Trophy, Clock, Users, User, Crown, Sparkles } from 'lucide-react';
import { getSubmissions, upvoteProject, getEventConfig } from '../../actions/orchestrate';
import { toast } from 'sonner';
import Dropdown from '../../components/Dropdown';

interface GalleryProject {
  id: string;
  project_title: string;
  category: string;
  matched_sponsor: string;
  tech_stack: string[];
  description: string;
  builder_name?: string;
  upvotes: number;
  hasUpvoted?: boolean;
  github_url?: string;
  hosted_link?: string;
  status?: string;
}

const ITEMS_PER_PAGE = 9;

const SkeletonCard = () => (
  <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between h-[320px]">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="skeleton w-16 h-4" />
        <div className="skeleton w-24 h-6 rounded-full" />
      </div>
      <div>
        <div className="skeleton w-3/4 h-6 mb-3" />
        <div className="skeleton w-full h-3 mb-2" />
        <div className="skeleton w-2/3 h-3" />
      </div>
      <div className="flex flex-wrap gap-1.5 pt-2">
        <div className="skeleton w-12 h-5 rounded" />
        <div className="skeleton w-16 h-5 rounded" />
        <div className="skeleton w-10 h-5 rounded" />
      </div>
    </div>
    <div className="border-t border-gray-800/80 mt-6 pt-4 flex items-center justify-between">
      <div className="skeleton w-28 h-9 rounded-lg" />
      <div className="flex gap-1.5">
        <div className="skeleton w-16 h-8 rounded-lg" />
        <div className="skeleton w-16 h-8 rounded-lg" />
      </div>
    </div>
  </div>
);

export default function GalleryPage() {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSponsor, setSelectedSponsor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'mostliked' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [deadlineNotice, setDeadlineNotice] = useState('');
  const [winnerCountdownText, setWinnerCountdownText] = useState('');
  const [areWinnersDeclared, setAreWinnersDeclared] = useState(false);
  // Event Timers state
  const [rawSubmissionDeadline, setRawSubmissionDeadline] = useState<string | null>(null);
  const [rawWinnerTime, setRawWinnerTime] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [data, config] = await Promise.all([getSubmissions(), getEventConfig()]);
        
        if (config.submission_deadline) {
          setRawSubmissionDeadline(config.submission_deadline);
        }
        if (config.winner_declaration_time) {
          setRawWinnerTime(config.winner_declaration_time);
        }

        // Read upvoted IDs from localStorage
        let upvotedIds: string[] = [];
        try {
          const stored = localStorage.getItem('showcase_upvoted_ids');
          if (stored) upvotedIds = JSON.parse(stored);
        } catch (e) {}

        let declared = false;
        const formatted = data.map((sub: any) => {
          let techStackArr: string[] = [];
          if (sub.tech_stack) {
            techStackArr = sub.tech_stack.split(',').map((t: string) => t.trim()).filter(Boolean);
          }
          if (sub.status === 'winner') {
            declared = true;
          }
          return {
            id: sub.id,
            project_title: sub.project_title,
            category: sub.category,
            matched_sponsor: sub.matched_sponsor,
            tech_stack: techStackArr,
            description: sub.description || 'No description provided.',
            builder_name: sub.builder_name || '',
            upvotes: sub.upvotes || 0,
            hasUpvoted: upvotedIds.includes(sub.id?.toString()),
            github_url: sub.github_url,
            hosted_link: sub.hosted_link,
            status: sub.status || 'submitted'
          };
        });

        setProjects(formatted);
        if (declared) {
          setAreWinnersDeclared(true);
          try {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
          } catch (e) {}
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load gallery projects.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Dynamic 1-second interval for submission deadline countdown
  useEffect(() => {
    if (!rawSubmissionDeadline) return;
    const initialDiff = new Date(rawSubmissionDeadline).getTime() - Date.now();
    let wasActiveBeforeExpiry = initialDiff > 0;
    let hasReloaded = false;

    const updateSubmissionTimer = () => {
      const target = new Date(rawSubmissionDeadline).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setDeadlineNotice('00:00:00 - Submissions Closed');
        if (wasActiveBeforeExpiry && !hasReloaded) {
          hasReloaded = true;
          window.location.reload();
        }
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      const pad = (n: number) => n.toString().padStart(2, '0');
      setDeadlineNotice(`Submissions Close: ${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    };

    updateSubmissionTimer();
    const interval = setInterval(updateSubmissionTimer, 1000);
    return () => clearInterval(interval);
  }, [rawSubmissionDeadline]);

  // Dynamic 1-second interval for winner declaration countdown
  useEffect(() => {
    if (!rawWinnerTime) return;
    const initialDiff = new Date(rawWinnerTime).getTime() - Date.now();
    let wasActiveBeforeExpiry = initialDiff > 0;
    let hasReloaded = false;

    const updateWinnerTimer = () => {
      const target = new Date(rawWinnerTime).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setWinnerCountdownText('🎉 Top 3 Winners Officially Declared!');
        setAreWinnersDeclared(true);
        if (wasActiveBeforeExpiry && !hasReloaded) {
          hasReloaded = true;
          window.location.reload();
        }
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      const pad = (n: number) => n.toString().padStart(2, '0');
      setWinnerCountdownText(`🏆 Winners In: ${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    };

    updateWinnerTimer();
    const interval = setInterval(updateWinnerTimer, 1000);
    return () => clearInterval(interval);
  }, [rawWinnerTime]);

  const handleUpvote = async (id: string) => {
    // Read upvoted IDs from localStorage
    let upvotedIds: string[] = [];
    try {
      const stored = localStorage.getItem('showcase_upvoted_ids');
      if (stored) upvotedIds = JSON.parse(stored);
    } catch (e) {}

    const target = projects.find((p) => p.id === id);
    if (!target) return;

    if (upvotedIds.includes(id) || target.hasUpvoted) {
      toast.error('You have already upvoted this project!');
      return;
    }

    // Update localStorage
    const newUpvotedIds = [...upvotedIds, id];
    try {
      localStorage.setItem('showcase_upvoted_ids', JSON.stringify(newUpvotedIds));
    } catch (e) {}

    // Optimistic UI update
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === id) {
          return {
            ...project,
            upvotes: project.upvotes + 1,
            hasUpvoted: true,
          };
        }
        return project;
      })
    );

    try {
      await upvoteProject(id, target.upvotes);
      toast.success('Vote registered!');
    } catch (err) {
      toast.error('Failed to persist upvote');
      // Revert state on error
      try {
        localStorage.setItem('showcase_upvoted_ids', JSON.stringify(upvotedIds));
      } catch (e) {}
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id === id) {
            return {
              ...project,
              upvotes: project.upvotes - 1,
              hasUpvoted: false,
            };
          }
          return project;
        })
      );
    }
  };

  // Unique categories and sponsors for dropdowns
  const categories = ['all', ...Array.from(new Set(projects.map((p) => p.category))).filter(Boolean)];
  const sponsors = ['all', ...Array.from(new Set(projects.map((p) => p.matched_sponsor))).filter(Boolean)];

  // Chain filtering
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tech_stack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSponsor = selectedSponsor === 'all' || p.matched_sponsor === selectedSponsor;
    const matchesStatus = selectedStatus === 'all' || (p.status || 'submitted') === selectedStatus;
    return matchesSearch && matchesCategory && matchesSponsor && matchesStatus;
  });

  // Handle filter changes (reset page to 1)
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setCurrentPage(1);
  };

  const handleSponsorChange = (val: string) => {
    setSelectedSponsor(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setCurrentPage(1);
  };

  // Sort calculations
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'mostliked') {
      return b.upvotes - a.upvotes;
    }
    const indexA = projects.findIndex((p) => p.id === a.id);
    const indexB = projects.findIndex((p) => p.id === b.id);
    if (sortBy === 'newest') {
      return indexB - indexA;
    }
    return indexA - indexB;
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / ITEMS_PER_PAGE));
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Dropdown Options
  const categoryOptions = categories.map((cat) => ({
    value: String(cat),
    label: String(cat === 'all' ? 'All Categories' : cat),
  }));
  const sponsorOptions = sponsors.map((spon) => ({
    value: String(spon),
    label: String(spon === 'all' ? 'All Tracks' : spon),
  }));
  const statusFilterOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'winner', label: 'Winners 🏆' },
  ];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'mostliked', label: 'Most Upvotes' },
    { value: 'oldest', label: 'Oldest First' },
  ];

  return (
    <main className="min-h-screen bg-[#030014] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <header className="mb-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 select-none mb-4 w-fit shadow-sm backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Hub
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
              <h1 className="text-3xl font-bold">Project Showcase Gallery</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {winnerCountdownText && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-md backdrop-blur-sm animate-pulse">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  {winnerCountdownText}
                </span>
              )}
              {deadlineNotice && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-md w-fit">
                  <Clock className="w-4 h-4 text-purple-400 animate-pulse" />
                  {deadlineNotice}
                </span>
              )}
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Browse submitted projects and support your favorite hacker submissions.
          </p>
        </header>

        {/* Filters and Search Bar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md relative z-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects by name, description, or stack..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <Dropdown
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={categoryOptions}
              icon={<Tag className="w-4 h-4" />}
            />
            <Dropdown
              value={selectedSponsor}
              onChange={handleSponsorChange}
              options={sponsorOptions}
              icon={<Award className="w-4 h-4" />}
            />
            <Dropdown
              value={selectedStatus}
              onChange={handleStatusChange}
              options={statusFilterOptions}
              icon={<Trophy className="w-4 h-4" />}
            />
            <Dropdown
              value={sortBy}
              onChange={(val) => {
                setSortBy(val as any);
                setCurrentPage(1);
              }}
              options={sortOptions}
              icon={<Filter className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Top 3 Winners Showcase Podium (Animated) */}
        {!loading && areWinnersDeclared && projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="mb-12 p-8 rounded-3xl bg-gradient-to-b from-amber-500/10 via-purple-500/5 to-transparent border-2 border-amber-500/40 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden space-y-6"
          >
            {/* Sparkle background ambient glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/20 rounded-2xl border border-amber-500/40 text-amber-300">
                  <Crown className="w-7 h-7 animate-bounce" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    Official Showcase Winners 🏆
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  </h2>
                  <p className="text-xs text-amber-200/80 font-medium">Top 3 Finalist Teams & Champion Projects</p>
                </div>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Official Declaration
              </span>
            </div>

            {/* Podium Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {(() => {
                const winnerProjects = projects
                  .filter((p) => p.status === 'winner')
                  .slice(0, 3);

                if (winnerProjects.length === 0) {
                  return (
                    <div className="col-span-3 text-center py-8 bg-black/40 border border-white/10 rounded-xl text-amber-200/70 text-sm">
                      Official winners have not been declared yet. Check back when the winner declaration countdown expires!
                    </div>
                  );
                }

                const podiumStyles = [
                  {
                    rank: '🥇 1st Place Champion',
                    badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black',
                    border: 'border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.3)]',
                    glow: 'from-amber-500/20 to-yellow-500/5'
                  },
                  {
                    rank: '🥈 2nd Place Runner-Up',
                    badgeBg: 'bg-gradient-to-r from-slate-300 to-gray-400 text-black',
                    border: 'border-slate-300/50 shadow-[0_0_20px_rgba(203,213,225,0.2)]',
                    glow: 'from-slate-400/15 to-gray-500/5'
                  },
                  {
                    rank: '🥉 3rd Place Finalist',
                    badgeBg: 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100',
                    border: 'border-amber-700/50 shadow-[0_0_20px_rgba(180,83,9,0.2)]',
                    glow: 'from-amber-700/15 to-amber-900/5'
                  }
                ];

                return winnerProjects.map((p, idx) => {
                  const style = podiumStyles[idx] || podiumStyles[2];
                  const isTeam = p.builder_name && (p.builder_name.includes(',') || p.builder_name.toLowerCase().includes('team') || p.builder_name.includes('&'));

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.15, type: 'spring' }}
                      className={`bg-gradient-to-b ${style.glow} bg-black/60 border-2 ${style.border} p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
                    >
                      <div className="space-y-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider ${style.badgeBg}`}>
                          {style.rank}
                        </span>
                        <Link href={`/project/${p.id}`} className="block">
                          <h3 className="text-xl font-extrabold text-white group-hover:text-amber-300 transition-colors">
                            {p.project_title}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/10 mt-4 space-y-3">
                        {p.builder_name && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-200 font-semibold">
                            {isTeam ? <Users className="w-3.5 h-3.5 text-amber-400" /> : <User className="w-3.5 h-3.5 text-amber-400" />}
                            <span>{p.builder_name}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            {p.matched_sponsor}
                          </span>
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 fill-current" /> {p.upvotes}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </motion.div>
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
                  const maxUpvotes = Math.max(...projects.map((p) => p.upvotes), 1);
                  const percentage = (project.upvotes / maxUpvotes) * 100;
                  return (
                    <div key={project.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-500 text-xs w-4">#{index + 1}</span>
                          <Link href={`/project/${project.id}`} className="font-bold text-white text-base hover:text-blue-400 transition-colors">
                            {project.project_title}
                          </Link>
                          <span className="text-xs text-gray-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                            {project.matched_sponsor}
                          </span>
                        </div>
                        <span className="font-bold text-orange-400 text-sm">{project.upvotes} upvotes</span>
                      </div>
                      <div className="w-full bg-black/40 border border-white/5 h-3 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                          className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Project Cards Grid / Loading states */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : paginatedProjects.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-xl">
            No projects match your current filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProjects.map((project) => {
                const isWinner = project.status === 'winner';
                return (
                  <div
                    key={project.id}
                    className={`bg-gray-900 rounded-xl p-6 flex flex-col justify-between transition-all duration-300 ${
                      isWinner
                        ? 'border-2 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:shadow-[0_0_35px_rgba(245,158,11,0.3)]'
                        : 'border border-gray-800 hover:border-gray-700 hover:shadow-2xl hover:shadow-blue-500/5'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Category, Status & Sponsor */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                          {project.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {project.status && project.status !== 'submitted' && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              project.status === 'winner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              project.status === 'shortlisted' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {project.status === 'winner' && <Trophy className="w-3 h-3 text-amber-400" />}
                              {project.status.replace('_', ' ')}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Award className="w-3.5 h-3.5" />
                            {project.matched_sponsor}
                          </span>
                        </div>
                      </div>

                    {/* Project Title & Builder/Team */}
                    <div>
                      <Link href={`/project/${project.id}`} className="group inline-block">
                        <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                          {project.project_title}
                        </h2>
                      </Link>
                      {project.builder_name && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-purple-300 font-medium">
                          {(project.builder_name.includes(',') || project.builder_name.toLowerCase().includes('team') || project.builder_name.includes('&')) ? (
                            <Users className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-gray-400" />
                          )}
                          <span>{project.builder_name}</span>
                        </div>
                      )}
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
                      <ThumbsUp
                        className={`w-4 h-4 transition-transform duration-200 ${
                          project.hasUpvoted ? 'scale-110 fill-current' : ''
                        }`}
                      />
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
              );
            })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl p-2 text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-400">
                  Page <span className="text-white font-bold">{currentPage}</span> of{' '}
                  <span className="text-white font-bold">{totalPages}</span>
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl p-2 text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
