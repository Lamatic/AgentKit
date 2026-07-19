'use client';

import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { submitProject } from '../actions/orchestrate';
import { Github, User, Mail, Check, MapPin, Award, Sparkles, AlertCircle, Globe } from 'lucide-react';
import MagneticButton from '../components/MagneticButton';
import TiltCard from '../components/TiltCard';

interface SubmissionResult {
  project_title: string;
  category: string;
  matched_sponsor: string;
  match_justification: string;
  breakout_table: string;
  tech_stack?: string;
}

const STEPS = [
  "Establishing connection",
  "Crawling GitHub repository",
  "Extracting tech stack",
  "Matching with sponsors"
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 12 } 
  }
};

export default function Home() {
  const [githubUrl, setGithubUrl] = useState('');
  const [hostedLink, setHostedLink] = useState('');
  const [builderName, setBuilderName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Array<'idle' | 'loading' | 'completed' | 'failed'>>(['idle', 'idle', 'idle', 'idle']);

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setResult(null);
    setStepStatuses(['loading', 'idle', 'idle', 'idle']);
    setActiveStep(0);

    // Step 0 ("Establishing connection") takes a fixed 1.5s
    const step0Timer = setTimeout(() => {
      setStepStatuses(['completed', 'loading', 'idle', 'idle']);
      setActiveStep(1);
    }, 1500);

    try {
      const data = await submitProject(githubUrl, builderName, contactEmail, hostedLink);
      clearTimeout(step0Timer);

      // When the promise resolves successfully, fast-forward through remaining steps
      setStepStatuses(['completed', 'completed', 'loading', 'idle']);
      setActiveStep(2);
      await new Promise(r => setTimeout(r, 600));

      setStepStatuses(['completed', 'completed', 'completed', 'loading']);
      setActiveStep(3);
      await new Promise(r => setTimeout(r, 600));

      setStepStatuses(['completed', 'completed', 'completed', 'completed']);
      await new Promise(r => setTimeout(r, 400));

      setResult(data);
    } catch (err: any) {
      clearTimeout(step0Timer);
      setStepStatuses(prev => {
        const next = [...prev];
        const activeIdx = next.findIndex(s => s === 'loading');
        if (activeIdx !== -1) {
          next[activeIdx] = 'failed';
        } else {
          next[activeStep] = 'failed';
        }
        return next;
      });
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const getTechPills = (techStackStr?: string) => {
    if (!techStackStr) {
      return ["Next.js", "React", "Tailwind CSS", "TypeScript"];
    }
    return techStackStr.split(',').map(tech => tech.trim()).filter(Boolean);
  };

  return (
    <main className="min-h-screen text-white px-6">
      <div className="max-w-6xl mx-auto">
        <motion.header 
          className="mb-16 pt-10 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="inline-block mb-4 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-semibold tracking-wide backdrop-blur-md">
            Next-Gen Showcase
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-500 pb-2">
            Elevate Your Project. <br/> Find Your Sponsor.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Submit your GitHub repository and let our AI agents instantly match you with the perfect sponsor and breakout session.
          </motion.p>
        </motion.header>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-5 gap-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 100, damping: 15 }}
        >
          {/* Submission Form Column */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-8 space-y-6">
              <h3 className="text-xl font-bold mb-4">Project Details</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">GitHub URL</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Github className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:bg-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hosted Demo URL (optional)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={hostedLink}
                    onChange={(e) => setHostedLink(e.target.value)}
                    placeholder="https://my-app.vercel.app"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:bg-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={builderName}
                    onChange={(e) => setBuilderName(e.target.value)}
                    placeholder="Avadhut Kaskar"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:bg-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:bg-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <MagneticButton 
                  onClick={handleSubmit}
                  disabled={Boolean(loading || !githubUrl || !builderName || !contactEmail)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 rounded-xl px-4 py-4 font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] disabled:shadow-none"
                >
                  {loading ? 'Analyzing Project...' : 'Submit Project'}
                </MagneticButton>
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
          </div>

          {/* Match Result Column */}
          <div className="lg:col-span-3 perspective-1000">
            {loading ? (
              <div className="glass-card rounded-2xl p-10 h-full flex flex-col justify-center space-y-8 min-h-[400px]">
                <div className="space-y-2 text-center mb-4">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-6"
                  />
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Agentic Analysis in Progress</h2>
                  <p className="text-sm text-gray-400">Please wait while our agents orchestrate a match...</p>
                </div>
                <div className="space-y-5 max-w-md mx-auto w-full">
                  {STEPS.map((step, index) => {
                    const status = stepStatuses[index];
                    const isCompleted = status === 'completed';
                    const isActive = status === 'loading';
                    const isFailed = status === 'failed';
                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                          isCompleted 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                            : isFailed
                              ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                              : isActive 
                                ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-pulse' 
                                : 'bg-white/5 border-white/10 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-5 h-5" />
                          ) : isFailed ? (
                            <AlertCircle className="w-5 h-5 text-red-400 animate-bounce" />
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                        <span className={`text-sm md:text-base transition-colors duration-500 ${
                          isCompleted 
                            ? 'text-gray-300 font-medium' 
                            : isFailed
                              ? 'text-red-400 font-semibold'
                              : isActive 
                                ? 'text-white font-bold tracking-wide' 
                                : 'text-gray-600'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : result ? (
              <TiltCard className="h-full">
                <div className="glass-card rounded-2xl p-8 space-y-8 h-full flex flex-col justify-between">
                  <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-white/10 pb-6">
                      <div>
                        <span className="text-xs text-blue-400 font-bold tracking-widest uppercase mb-2 block">{result.category || "Project Category"}</span>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">{result.project_title}</h2>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.25)] backdrop-blur-md">
                          <Sparkles className="w-4 h-4 text-blue-400" />
                          98% MATCH
                        </span>
                      </div>
                    </div>

                    {/* Tech Stack */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detected Stack</h4>
                      <div className="flex flex-wrap gap-2">
                        {getTechPills(result.tech_stack).map((tech, idx) => (
                          <span key={idx} className="bg-white/5 text-gray-200 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/10 transition-colors">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sponsor Box */}
                    <div className="relative overflow-hidden rounded-xl p-[1px] bg-gradient-to-br from-emerald-500/50 to-transparent">
                      <div className="absolute inset-0 bg-emerald-500/10 blur-xl"></div>
                      <div className="relative bg-[#030014]/80 backdrop-blur-xl rounded-xl p-6 h-full border border-emerald-500/20">
                        <div className="flex items-center space-x-2 mb-3">
                          <Award className="w-5 h-5 text-emerald-400" />
                          <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Sponsor Spotlight</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{result.matched_sponsor}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{result.match_justification}</p>
                      </div>
                    </div>

                    {/* Location Box */}
                    <div className="relative overflow-hidden rounded-xl p-[1px] bg-gradient-to-br from-yellow-500/50 to-transparent">
                      <div className="absolute inset-0 bg-yellow-500/10 blur-xl"></div>
                      <div className="relative bg-[#030014]/80 backdrop-blur-xl rounded-xl p-6 h-full border border-yellow-500/20 flex items-center space-x-5">
                        <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400 border border-yellow-500/20">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs text-yellow-500 font-bold uppercase tracking-widest block mb-1">Assigned Session</span>
                          <p className="text-xl font-bold text-white">{result.breakout_table}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            ) : (
              <div className="glass-card rounded-2xl p-10 h-full min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 .364l-.707 .707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-300 mb-2">Awaiting Submission</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Enter your project details on the left to initiate the AI matching process.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}