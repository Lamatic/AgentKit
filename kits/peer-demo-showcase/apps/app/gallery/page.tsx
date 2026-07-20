'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, Award, Flame, Search, ChevronLeft, ChevronRight, Github, Globe, Tag, Filter } from 'lucide-react';
import { getSubmissions, upvoteProject } from '../../actions/orchestrate';
import { toast } from 'sonner';
import Dropdown from '../../components/Dropdown';

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
  const [sortBy, setSortBy] = useState<'newest' | 'mostliked' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

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
        toast.error(err.message || 'Failed to load gallery projects.');
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
      toast.success('Vote registered!');
    } catch (err) {
      toast.error('Failed to persist upvote');
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
    return matchesSearch && matchesCategory && matchesSponsor;
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
    value: cat,
    label: cat === 'all' ? 'All Categories' : cat,
  }));
  const sponsorOptions = sponsors.map((spon) => ({
    value: spon,
    label: spon === 'all' ? 'All Sponsors' : spon,
  }));
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
          <div className="flex items-center space-x-2">
            <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
            <h1 className="text-3xl font-bold">Project Showcase Gallery</h1>
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
          <div className="flex flex-col sm:flex-row gap-3">
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
              {paginatedProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between hover:border-gray-700 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300"
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
                      <Link href={`/project/${project.id}`} className="group inline-block">
                        <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                          {project.project_title}
                        </h2>
                      </Link>
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
              ))}
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
