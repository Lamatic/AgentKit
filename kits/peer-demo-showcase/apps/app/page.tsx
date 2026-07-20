'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { submitProject } from '../actions/orchestrate';
import { Github, User, Mail, Check, MapPin, Award, Sparkles, AlertCircle, Globe, Twitter, Linkedin, Link2 } from 'lucide-react';
import MagneticButton from '../components/MagneticButton';
import TiltCard from '../components/TiltCard';
import { toast } from 'sonner';
import { GooeyText } from '../components/ui/gooey-text-morphing';
import { EnterpriseAIPipeline } from '../components/ui/ai-agent-pipeline';
import SponsorMarquee from '../components/SponsorMarquee';
import WaveBackground from '../components/WaveBackground';

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
  const [activeStep, setActiveStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Array<'idle' | 'loading' | 'completed' | 'failed'>>(['idle', 'idle', 'idle', 'idle']);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!githubUrl.startsWith('https://github.com/')) {
      errors.githubUrl = 'GitHub URL must start with https://github.com/';
    }

    if (hostedLink && !hostedLink.startsWith('http://') && !hostedLink.startsWith('https://')) {
      errors.hostedLink = 'Hosted link must start with http:// or https://';
    }

    if (!builderName.trim()) {
      errors.builderName = 'Builder name is required';
    } else if (builderName.trim().length > 100) {
      errors.builderName = 'Builder name must be 100 characters or fewer';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach((msg) => toast.error(msg));
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    setLoading(true);
    setValidationErrors({});
    setResult(null);
    setError('');
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
      toast.success('Project matched successfully!');
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
      toast.error(err.message || 'Something went wrong. Please try again.');
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

  function handleShareTwitter() {
    if (!result) return;
    const text = encodeURIComponent(
      `🚀 Just submitted "${result.project_title}" built with ${getTechPills(result.tech_stack).slice(0, 3).join(', ')} and got matched with ${result.matched_sponsor}! #buildinpublic`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  function handleShareLinkedIn() {
    if (!result) return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
  }

  function handleCopyLink() {
    if (!result) return;
    const text = `🚀 "${result.project_title}" — matched with ${result.matched_sponsor} at ${result.breakout_table}!`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link copied!');
    });
  }

  return (
    <main className="min-h-screen text-white px-6 relative overflow-x-hidden">
      {/* Hero Background Grid Mesh & Glows */}
      <div className="absolute inset-0 top-0 left-0 right-0 h-[600px] overflow-hidden pointer-events-none select-none -z-10">
        <div className="grid-mesh absolute inset-0 w-full h-full opacity-60"></div>
        <div className="absolute top-10 left-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute top-20 right-1/4 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2.5s' }}></div>
      </div>
      
      <WaveBackground />

      <div className="max-w-6xl mx-auto">
        <motion.header 
          className="mb-16 pt-10 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="h-[180px] md:h-[240px] flex items-center justify-center mb-6 relative">
            <GooeyText
              texts={["Elevate Your\nProject.", "Find Your\nSponsor.", "Showcase Your\nTech."]}
              morphTime={1}
              cooldownTime={1.5}
              className="font-extrabold tracking-tighter"
              textClassName="text-white font-extrabold tracking-tighter text-4xl sm:text-5xl md:text-[52pt] whitespace-pre-line leading-none"
            />
          </motion.div>
          <motion.p variants={itemVariants} className="text-sm md:text-base font-mono text-gray-400/80 max-w-2xl mx-auto leading-relaxed tracking-tight border-t border-white/5 pt-6 mt-6">
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
                    onChange={(e) => { setGithubUrl(e.target.value); setValidationErrors(prev => { const n = { ...prev }; delete n.githubUrl; return n; }); }}
                    placeholder="https://github.com/username/repo"
                    className={`w-full bg-white/5 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:bg-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all ${validationErrors.githubUrl ? 'border-red-500/50' : 'border-white/10'}`}
                  />
                </div>
                {validationErrors.githubUrl && <p className="text-red-400 text-xs mt-1">{validationErrors.githubUrl}</p>}
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
                    onChange={(e) => { setHostedLink(e.target.value); setValidationErrors(prev => { const n = { ...prev }; delete n.hostedLink; return n; }); }}
                    placeholder="https://my-app.vercel.app"
                    className={`w-full bg-white/5 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:bg-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all ${validationErrors.hostedLink ? 'border-red-500/50' : 'border-white/10'}`}
                  />
                </div>
                {validationErrors.hostedLink && <p className="text-red-400 text-xs mt-1">{validationErrors.hostedLink}</p>}
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
                    onChange={(e) => { setBuilderName(e.target.value); setValidationErrors(prev => { const n = { ...prev }; delete n.builderName; return n; }); }}
                    placeholder="Avadhut Kaskar"
                    className={`w-full bg-white/5 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:bg-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all ${validationErrors.builderName ? 'border-red-500/50' : 'border-white/10'}`}
                  />
                </div>
                {validationErrors.builderName && <p className="text-red-400 text-xs mt-1">{validationErrors.builderName}</p>}
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
                    onChange={(e) => { setContactEmail(e.target.value); setValidationErrors(prev => { const n = { ...prev }; delete n.contactEmail; return n; }); }}
                    placeholder="you@example.com"
                    className={`w-full bg-white/5 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:bg-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all ${validationErrors.contactEmail ? 'border-red-500/50' : 'border-white/10'}`}
                  />
                </div>
                {validationErrors.contactEmail && <p className="text-red-400 text-xs mt-1">{validationErrors.contactEmail}</p>}
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
            </div>
          </div>

          {/* Match Result Column */}
          <div className="lg:col-span-3 perspective-1000 flex items-center justify-center">
            {!result ? (
              <EnterpriseAIPipeline
                loading={loading}
                activeStep={activeStep}
                stepStatuses={stepStatuses}
                githubUrl={githubUrl}
                result={result}
                error={error}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full relative group h-full flex flex-col justify-between"
              >
                {/* Background ambient matching glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-blue-500/5 to-purple-500/15 rounded-2xl blur-3xl opacity-100 pointer-events-none select-none -z-10" />
                <TiltCard className="h-full w-full">
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

                    {/* Social Sharing */}
                    <div className="border-t border-white/10 pt-6">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">Share your win</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleShareTwitter}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/5 text-gray-300 border border-white/10 hover:bg-sky-500/10 hover:text-sky-400 hover:border-sky-500/30 transition-all"
                        >
                          <Twitter className="w-3.5 h-3.5" />
                          Twitter / X
                        </button>
                        <button
                          onClick={handleShareLinkedIn}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/5 text-gray-300 border border-white/10 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                          LinkedIn
                        </button>
                        <button
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/5 text-gray-300 border border-white/10 hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30 transition-all"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
            )}
          </div>
        </motion.div>
        
        {/* Sponsor Marquee */}
        <SponsorMarquee />
      </div>
    </main>
  );
}