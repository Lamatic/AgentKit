"use client";

import { useState, useCallback, useRef } from "react";
import { analyzeWebsite, type WebReviveReport, type IssueItem } from "../actions/orchestrate";
import {
  Globe, Zap, Search, BarChart3, Layout, Users2, TrendingUp, Wand2,
  Type, Mail, Linkedin, FileText, Star, ChevronRight, Copy, Check,
  AlertCircle, Loader2, ArrowRight, Download, RefreshCw, Shield,
  Eye, Smartphone, Clock, Target, Lightbulb, Award, Activity,
  Building2, ExternalLink, ChevronDown, X
} from "lucide-react";

// ── Constants ───────────────────────────────────────────────────

const SERVICES = [
  "Website Redesign",
  "SEO Optimization",
  "Performance Optimization",
  "Branding & Identity",
  "Conversion Rate Optimization",
  "Full Digital Transformation",
];

const INDUSTRIES = [
  "E-Commerce", "SaaS / Tech", "Healthcare", "Real Estate",
  "Legal / Law Firm", "Restaurant / Food", "Consulting / Agency",
  "Education", "Finance", "Construction", "Retail", "Other"
];

const AGENTS = [
  { id: 1, name: "Website Analyzer", icon: Globe, desc: "Crawling homepage & extracting business info" },
  { id: 2, name: "SEO Audit", icon: Search, desc: "Checking meta tags, headings, schema markup" },
  { id: 3, name: "Performance Agent", icon: Zap, desc: "Measuring Core Web Vitals via PageSpeed" },
  { id: 4, name: "UI/UX Review", icon: Eye, desc: "Reviewing design, accessibility & hierarchy" },
  { id: 5, name: "Competitor Research", icon: Users2, desc: "Analyzing top competitors in the space" },
  { id: 6, name: "Conversion Audit", icon: Target, desc: "Evaluating CTAs, forms & trust signals" },
  { id: 7, name: "AI Redesign", icon: Wand2, desc: "Generating premium redesign suggestions" },
  { id: 8, name: "Copywriting", icon: Type, desc: "Crafting headline, copy & FAQ content" },
  { id: 9, name: "Sales Email", icon: Mail, desc: "Writing personalized cold outreach emails" },
  { id: 10, name: "LinkedIn Outreach", icon: Linkedin, desc: "Creating connection & DM messages" },
  { id: 11, name: "Proposal Generator", icon: FileText, desc: "Building complete business proposal" },
  { id: 12, name: "Final Report", icon: Star, desc: "Compiling scores & priority action plan" },
];

const TABS = [
  { id: "overview",     label: "Overview",     icon: Activity },
  { id: "seo",          label: "SEO",           icon: Search },
  { id: "performance",  label: "Performance",   icon: Zap },
  { id: "uiux",         label: "UI/UX",         icon: Eye },
  { id: "competitors",  label: "Competitors",   icon: Users2 },
  { id: "conversion",   label: "Conversion",    icon: Target },
  { id: "redesign",     label: "Redesign",      icon: Wand2 },
  { id: "copy",         label: "Copywriting",   icon: Type },
  { id: "email",        label: "Cold Email",    icon: Mail },
  { id: "linkedin",     label: "LinkedIn",      icon: Linkedin },
  { id: "proposal",     label: "Proposal",      icon: FileText },
];

// ── Helpers ─────────────────────────────────────────────────────

function ScoreGauge({ score, label, color = "#3b82f6", size = 100 }: {
  score: number; label: string; color?: string; size?: number;
}) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const grade = score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100" className="score-gauge">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
        <text x="50" y="46" textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="Inter">{score}</text>
        <text x="50" y="60" textAnchor="middle" fill={color} fontSize="10" fontWeight="600" fontFamily="Inter">{grade}</text>
      </svg>
      <span className="text-xs text-slate-400 text-center font-medium">{label}</span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    critical: "priority-critical", high: "priority-high",
    medium: "priority-medium", low: "priority-low"
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${map[priority] || "priority-medium"}`}>
      {priority}
    </span>
  );
}

function IssueCard({ issue, delay = 0 }: { issue: IssueItem; delay?: number }) {
  const [open, setOpen] = useState(false);
  const text = issue.detail || issue.suggestion || '';
  const fix = issue.fix || '';
  const impact = issue.impact || issue.estimatedGain || issue.expectedLift || '';

  return (
    <div className="issue-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <PriorityBadge priority={issue.priority} />
            <span className="text-sm font-semibold text-slate-200 truncate">{issue.title || issue.area}</span>
          </div>
          {text && <p className="text-xs text-slate-400 line-clamp-2">{text}</p>}
        </div>
        {(fix || impact) && (
          <button onClick={() => setOpen(!open)} className="text-slate-500 hover:text-slate-300 transition flex-shrink-0 mt-1">
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-2 animate-fade-in">
          {fix && (
            <div className="flex gap-2">
              <span className="text-xs font-semibold text-emerald-400 shrink-0">Fix:</span>
              <p className="text-xs text-slate-400">{fix}</p>
            </div>
          )}
          {impact && (
            <div className="flex gap-2">
              <span className="text-xs font-semibold text-amber-400 shrink-0">Impact:</span>
              <p className="text-xs text-slate-400">{impact}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="btn-secondary">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? "Copied!" : label}</span>
    </button>
  );
}

function MetricRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/40 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold font-mono ${good === true ? 'text-emerald-400' : good === false ? 'text-rose-400' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Tab Panels ──────────────────────────────────────────────────

function OverviewPanel({ data }: { data: WebReviveReport }) {
  const { websiteAnalysis, finalReport, seoAudit, performance, uiuxReview, conversionAudit } = data;
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Executive one-liner */}
      <div className="glass-card rounded-2xl p-6 border-l-4 border-blue-500">
        <p className="text-slate-300 italic text-sm leading-relaxed">"{finalReport.executiveOneLiner}"</p>
      </div>

      {/* Scores grid */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Audit Scores</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card-sm rounded-xl p-4 flex flex-col items-center gap-2">
            <ScoreGauge score={finalReport.overallScore} label="Overall" color="#8b5cf6" size={90} />
          </div>
          <div className="glass-card-sm rounded-xl p-4 flex flex-col items-center gap-2">
            <ScoreGauge score={seoAudit.score} label="SEO" color="#3b82f6" size={90} />
          </div>
          <div className="glass-card-sm rounded-xl p-4 flex flex-col items-center gap-2">
            <ScoreGauge score={performance.score} label="Performance" color="#f59e0b" size={90} />
          </div>
          <div className="glass-card-sm rounded-xl p-4 flex flex-col items-center gap-2">
            <ScoreGauge score={uiuxReview.uiScore} label="UI Design" color="#10b981" size={90} />
          </div>
          <div className="glass-card-sm rounded-xl p-4 flex flex-col items-center gap-2">
            <ScoreGauge score={uiuxReview.uxScore} label="UX" color="#06b6d4" size={90} />
          </div>
          <div className="glass-card-sm rounded-xl p-4 flex flex-col items-center gap-2">
            <ScoreGauge score={conversionAudit.score} label="Conversion" color="#f43f5e" size={90} />
          </div>
        </div>
      </div>

      {/* Business summary */}
      <div className="glass-card rounded-2xl p-6">
        <SectionHeader icon={Building2} title="Business Summary" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <MetricRow label="Business Name" value={websiteAnalysis.businessName} />
            <MetricRow label="Industry" value={websiteAnalysis.industry} />
            <MetricRow label="Contact Info" value={websiteAnalysis.contactInfo || 'Not found'} good={!!websiteAnalysis.contactInfo} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main Services</p>
            <div className="flex flex-wrap gap-2">
              {websiteAnalysis.mainServices.map((s, i) => (
                <span key={i} className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg">{s}</span>
              ))}
            </div>
            {websiteAnalysis.techStack.length > 0 && (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Tech Stack</p>
                <div className="flex flex-wrap gap-2">
                  {websiteAnalysis.techStack.map((t, i) => (
                    <span key={i} className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2.5 py-1 rounded-lg">{t}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800/40">
          <p className="text-sm text-slate-300 leading-relaxed">{websiteAnalysis.overallImpression}</p>
        </div>
      </div>

      {/* Priority fixes */}
      <div className="glass-card rounded-2xl p-6">
        <SectionHeader icon={AlertCircle} title="Priority Action Plan" subtitle={`${finalReport.priorityFixes.length} fixes identified`} />
        <div className="space-y-3">
          {finalReport.priorityFixes.slice(0, 6).map((fix, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40 hover:border-slate-700/60 transition">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-400">#{fix.rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-semibold text-slate-200">{fix.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    fix.urgency === 'immediate' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25' :
                    fix.urgency === 'short-term' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' :
                    'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                  }`}>{fix.urgency}</span>
                </div>
                <p className="text-xs text-slate-400">{fix.estimatedImpact}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <p className="text-sm text-emerald-300 leading-relaxed">
            <span className="font-semibold">Business Impact: </span>
            {finalReport.estimatedBusinessImpact}
          </p>
        </div>
      </div>
    </div>
  );
}

function SeoPanel({ data }: { data: WebReviveReport }) {
  const { seoAudit } = data;
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 flex flex-col items-center gap-3">
          <ScoreGauge score={seoAudit.score} label="SEO Score" color="#3b82f6" size={100} />
        </div>
        <div className="glass-card rounded-xl p-5 col-span-2 space-y-1">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Technical Checks</h3>
          {[
            { label: "Meta Title", ...seoAudit.metaTitle },
            { label: "Meta Description", ...seoAudit.metaDescription },
            { label: "H1 Tag", present: seoAudit.h1.present, quality: seoAudit.h1.present ? 'good' : 'missing', note: seoAudit.h1.note },
            { label: "Open Graph", ...seoAudit.openGraph, quality: seoAudit.openGraph.present ? 'good' : 'missing' },
            { label: "Structured Data", ...seoAudit.structuredData, quality: seoAudit.structuredData.present ? 'good' : 'missing' },
          ].map((check, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/30 last:border-0">
              <span className="text-sm text-slate-300">{check.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 max-w-[200px] text-right truncate">{check.note}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  check.quality === 'good' ? 'bg-emerald-400' :
                  check.quality === 'fair' ? 'bg-amber-400' : 'bg-rose-400'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Issues Found ({seoAudit.issues.length})
        </h3>
        <div className="space-y-3">
          {seoAudit.issues.map((issue, i) => <IssueCard key={i} issue={issue} delay={i * 50} />)}
        </div>
      </div>

      {seoAudit.quickWins.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Quick Wins</h3>
          </div>
          <div className="space-y-2">
            {seoAudit.quickWins.map((win, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-300">{win}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PerformancePanel({ data }: { data: WebReviveReport }) {
  const { performance } = data;
  const gradeColor: Record<string, string> = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#f43f5e' };
  const isGood = (val: string, metric: 'fcp' | 'lcp' | 'cls' | 'tbt') => {
    const n = parseFloat(val);
    if (isNaN(n)) return undefined;
    if (metric === 'fcp') return n <= 1.8;
    if (metric === 'lcp') return n <= 2.5;
    if (metric === 'cls') return n <= 0.1;
    if (metric === 'tbt') return n <= 200;
    return undefined;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-6 flex flex-col items-center gap-3">
          <ScoreGauge score={performance.score} label="Performance" color={gradeColor[performance.grade] || '#f59e0b'} size={100} />
          <div className="text-center">
            <div style={{ color: gradeColor[performance.grade] }} className="text-4xl font-black">{performance.grade}</div>
            <p className="text-xs text-slate-400">Mobile Grade</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 col-span-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Core Web Vitals</h3>
          <MetricRow label="First Contentful Paint (FCP)" value={performance.fcp} good={isGood(performance.fcp, 'fcp')} />
          <MetricRow label="Largest Contentful Paint (LCP)" value={performance.lcp} good={isGood(performance.lcp, 'lcp')} />
          <MetricRow label="Cumulative Layout Shift (CLS)" value={performance.cls} good={isGood(performance.cls, 'cls')} />
          <MetricRow label="Total Blocking Time (TBT)" value={performance.tbt} good={isGood(performance.tbt, 'tbt')} />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Performance Suggestions
        </h3>
        <div className="space-y-3">
          {performance.suggestions.map((s, i) => <IssueCard key={i} issue={s} delay={i * 50} />)}
        </div>
      </div>
    </div>
  );
}

function UiuxPanel({ data }: { data: WebReviveReport }) {
  const { uiuxReview } = data;
  const sections = [
    { label: "Hero Section", ...uiuxReview.heroSection },
    { label: "Navigation", ...uiuxReview.navigation },
    { label: "Typography", ...uiuxReview.typography },
    { label: "Color Palette", ...uiuxReview.colorPalette },
    { label: "Mobile Responsiveness", ...uiuxReview.mobileResponsiveness },
    { label: "Call to Action", ...uiuxReview.callToAction },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "UI Design", score: uiuxReview.uiScore, color: '#10b981' },
          { label: "UX", score: uiuxReview.uxScore, color: '#06b6d4' },
          { label: "Accessibility", score: uiuxReview.accessibilityScore, color: '#8b5cf6' },
        ].map((g, i) => (
          <div key={i} className="glass-card rounded-xl p-5 flex flex-col items-center gap-2">
            <ScoreGauge score={g.score} label={g.label} color={g.color} size={90} />
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Section Analysis</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {sections.map((s, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-200">{s.label}</span>
                <span className={`text-sm font-bold ${s.score >= 70 ? 'text-emerald-400' : s.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {s.score}/100
                </span>
              </div>
              <div className="progress-track mb-2">
                <div className="progress-fill" style={{ width: `${s.score}%` }} />
              </div>
              <p className="text-xs text-slate-400">{s.notes}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Recommendations</h3>
        <div className="space-y-3">
          {uiuxReview.recommendations.map((r, i) => <IssueCard key={i} issue={r} delay={i * 40} />)}
        </div>
      </div>
    </div>
  );
}

function CompetitorsPanel({ data }: { data: WebReviveReport }) {
  const { competitors } = data;
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6">
        <SectionHeader icon={Users2} title="Competitive Landscape" subtitle={`${competitors.list.length} competitors analyzed`} />
        <div className="space-y-4">
          {competitors.list.map((c, i) => (
            <div key={i} className="competitor-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-200">{c.name}</p>
                  <a href={c.website} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5">
                    {c.website} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <span className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-lg font-medium">
                  #{i + 1}
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-1">Strengths</p>
                  <ul className="space-y-1">
                    {c.strengths.slice(0, 3).map((s, j) => (
                      <li key={j} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">+</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-rose-400 mb-1">Weaknesses</p>
                  <ul className="space-y-1">
                    {c.weaknesses.slice(0, 3).map((w, j) => (
                      <li key={j} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="text-rose-400 mt-0.5">−</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/40">
                <p className="text-xs text-amber-300"><span className="font-semibold">Differentiator: </span>{c.differentiator}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-300">Gap Opportunities</h3>
        </div>
        <div className="space-y-2">
          {competitors.gapOpportunities.map((g, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <Star className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-300">{g}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
          <p className="text-sm text-blue-300"><span className="font-semibold">Your pitch angle: </span>{competitors.competitiveAdvantage}</p>
        </div>
      </div>
    </div>
  );
}

function ConversionPanel({ data }: { data: WebReviveReport }) {
  const { conversionAudit } = data;
  const ctaColor = conversionAudit.ctaEffectiveness === 'strong' ? 'text-emerald-400' :
    conversionAudit.ctaEffectiveness === 'moderate' ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-6 flex flex-col items-center gap-4">
          <ScoreGauge score={conversionAudit.score} label="Conversion Score" color="#f43f5e" size={110} />
        </div>
        <div className="glass-card rounded-xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Conversion Elements</h3>
          <MetricRow label="Lead Forms" value={conversionAudit.leadForms.present ? `Present — ${conversionAudit.leadForms.quality}` : 'Not found'} good={conversionAudit.leadForms.present} />
          <MetricRow label="Trust Signals" value={conversionAudit.trustSignals.present ? 'Found' : 'Missing'} good={conversionAudit.trustSignals.present} />
          <MetricRow label="Social Proof" value={conversionAudit.socialProof.present ? 'Found' : 'Missing'} good={conversionAudit.socialProof.present} />
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-slate-400">CTA Effectiveness</span>
            <span className={`text-sm font-semibold capitalize ${ctaColor}`}>{conversionAudit.ctaEffectiveness}</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Conversion Recommendations</h3>
        <div className="space-y-3">
          {conversionAudit.recommendations.map((r, i) => <IssueCard key={i} issue={r} delay={i * 50} />)}
        </div>
      </div>
    </div>
  );
}

function RedesignPanel({ data }: { data: WebReviveReport }) {
  const { redesignSuggestions: r } = data;
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6">
        <SectionHeader icon={Wand2} title="AI Redesign Strategy" />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Hero Section</p>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 rounded-xl p-4 border border-slate-800/40">{r.heroSection}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Navigation</p>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 rounded-xl p-4 border border-slate-800/40">{r.navigationRedesign}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Color Palette</p>
              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/40 space-y-2">
                {[
                  { label: 'Primary', color: r.colorPalette.primary },
                  { label: 'Secondary', color: r.colorPalette.secondary },
                  { label: 'Accent', color: r.colorPalette.accent },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-slate-700/50" style={{ background: c.color }} />
                    <div>
                      <p className="text-xs text-slate-400">{c.label}</p>
                      <p className="text-xs font-mono text-slate-200">{c.color}</p>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/40">{r.colorPalette.rationale}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Typography</p>
              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/40 space-y-2">
                <MetricRow label="Heading Font" value={r.typography.heading} />
                <MetricRow label="Body Font" value={r.typography.body} />
                <p className="text-xs text-slate-400 pt-1">{r.typography.rationale}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glow-divider" />

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recommended Page Structure</p>
            <ol className="space-y-2">
              {r.sectionOrder.map((s, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                  <span className="text-sm text-slate-300">{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Animation Ideas</p>
              <div className="space-y-1.5">
                {r.animationIdeas.map((a, i) => (
                  <p key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />{a}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Premium Features</p>
              <div className="space-y-1.5">
                {r.premiumFeatures.map((f, i) => (
                  <p key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <Award className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />{f}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {r.imagePrompt && (
          <div className="mt-6 p-4 rounded-xl bg-violet-500/5 border border-violet-500/15">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider">AI Mockup Prompt</p>
              <CopyButton text={r.imagePrompt} label="Copy Prompt" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{r.imagePrompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CopywritingPanel({ data }: { data: WebReviveReport }) {
  const { copywriting: c } = data;
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <SectionHeader icon={Type} title="AI-Generated Copywriting" />

        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/5 to-violet-500/5 border border-blue-500/10 text-center">
          <h2 className="text-2xl font-black text-white mb-2">{c.headline}</h2>
          <p className="text-slate-300 text-sm mb-4">{c.subheadline}</p>
          <div className="flex items-center justify-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold">{c.primaryCTA}</span>
            <span className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium">{c.secondaryCTA}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About Section</p>
            <p className="text-sm text-slate-300 leading-relaxed">{c.aboutSection}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Value Propositions</p>
            <ul className="space-y-2">
              {c.valueProps.map((v, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <Shield className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />{v}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {c.faqItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">FAQ Section</p>
            <div className="space-y-3">
              {c.faqItems.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/30">
                  <p className="text-sm font-semibold text-slate-200 mb-1">Q: {item.q}</p>
                  <p className="text-sm text-slate-400">A: {item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/20 flex items-center justify-between">
          <p className="text-xs text-slate-400 italic">Footer tagline: "{c.footerTagline}"</p>
          <CopyButton text={`${c.headline}\n\n${c.subheadline}\n\nCTA: ${c.primaryCTA}`} label="Copy Hero Copy" />
        </div>
      </div>
    </div>
  );
}

function EmailPanel({ data }: { data: WebReviveReport }) {
  const { coldEmail } = data;
  const [activeEmail, setActiveEmail] = useState<'main' | 'follow1' | 'follow2'>('main');

  const emails = {
    main: { label: "Initial Email", subject: coldEmail.subject, body: coldEmail.body },
    follow1: { label: "Follow-up (3 days)", subject: coldEmail.followUp3Days.subject, body: coldEmail.followUp3Days.body },
    follow2: { label: "Final Follow-up (7 days)", subject: coldEmail.followUp7Days.subject, body: coldEmail.followUp7Days.body },
  };

  const current = emails[activeEmail];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6">
        <SectionHeader icon={Mail} title="Personalized Cold Email Sequence" subtitle="3-email outreach campaign" />

        <div className="flex gap-2 mb-5 flex-wrap">
          {(Object.entries(emails) as [keyof typeof emails, typeof emails.main][]).map(([key, val]) => (
            <button key={key} onClick={() => setActiveEmail(key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${activeEmail === key
                ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                : 'bg-slate-900/50 border border-slate-800/50 text-slate-400 hover:text-slate-200'}`}>
              {val.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <span className="text-xs font-semibold text-slate-500">Subject:</span>
            <span className="text-sm font-semibold text-slate-200 flex-1">{current.subject}</span>
            <CopyButton text={current.subject} label="Copy" />
          </div>
          <div className="email-preview">{current.body}</div>
          <div className="flex justify-end gap-2">
            <CopyButton text={`Subject: ${current.subject}\n\n${current.body}`} label="Copy Full Email" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedinPanel({ data }: { data: WebReviveReport }) {
  const { linkedinOutreach: l } = data;
  const messages = [
    { title: "Connection Request", text: l.connectionRequest, note: "Max 300 characters" },
    { title: "First Message", text: l.firstMessage, note: "After connecting" },
    { title: "Follow-up Message", text: l.followUpMessage, note: "If no reply" },
    { title: "Short Pitch", text: l.shortPitch, note: "2-3 sentence DM" },
  ];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6">
        <SectionHeader icon={Linkedin} title="LinkedIn Outreach Sequence" />
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/40 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{m.title}</p>
                  <p className="text-xs text-slate-500">{m.note}</p>
                </div>
                <CopyButton text={m.text} label="Copy" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 rounded-xl p-4 border border-slate-800/30">{m.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProposalPanel({ data, url }: { data: WebReviveReport; url: string }) {
  const { proposal: p } = data;

  const fullProposalText = `
WEBSITE IMPROVEMENT PROPOSAL
For: ${data.websiteAnalysis.businessName}
URL: ${url}
Service: ${p.executiveSummary}

EXECUTIVE SUMMARY
${p.executiveSummary}

PROBLEMS FOUND
${p.problemsFound.map((prob, i) => `${i + 1}. ${prob}`).join('\n')}

PROPOSED SOLUTIONS
${p.proposedSolutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

PROJECT GOALS
${p.projectGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

TIMELINE
${p.timeline.map(t => `• ${t.phase} (${t.duration})\n  Deliverables: ${t.deliverables.join(', ')}`).join('\n\n')}

INVESTMENT
Estimated: $${p.estimatedCost.min.toLocaleString()} – $${p.estimatedCost.max.toLocaleString()} ${p.estimatedCost.currency}
${p.estimatedCost.notes}

MAINTENANCE
${p.maintenancePlan}

WHY WORK WITH US
${p.whyUs}

NEXT STEP
${p.callToAction}
`.trim();

  const printProposal = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Proposal – ${data.websiteAnalysis.businessName}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;line-height:1.7;color:#111;}
      h1{font-size:1.8rem;margin-bottom:4px;}h2{margin-top:2rem;font-size:1.1rem;text-transform:uppercase;letter-spacing:.1em;color:#555;}
      p,li{font-size:0.95rem;}ul,ol{margin:0.5rem 0 1rem;}pre{white-space:pre-wrap;font-family:inherit;}</style>
      </head><body><pre>${fullProposalText}</pre></body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader icon={FileText} title="Business Proposal" subtitle={`For ${data.websiteAnalysis.businessName}`} />
          <div className="flex gap-2">
            <CopyButton text={fullProposalText} label="Copy Proposal" />
            <button onClick={printProposal} className="btn-secondary">
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Executive Summary</p>
            <p className="text-sm text-slate-300 leading-relaxed">{p.executiveSummary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
              <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3">Problems Found</p>
              <ul className="space-y-2">
                {p.problemsFound.map((prob, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <X className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />{prob}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Proposed Solutions</p>
              <ul className="space-y-2">
                {p.proposedSolutions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Project Timeline</p>
            <div className="space-y-3">
              {p.timeline.map((t, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </div>
                    {i < p.timeline.length - 1 && <div className="w-px h-6 bg-slate-800 mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-200">{t.phase}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{t.duration}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {t.deliverables.map((d, j) => (
                        <span key={j} className="text-xs bg-slate-800/60 border border-slate-700/40 text-slate-400 px-2 py-0.5 rounded-lg">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Investment Range</p>
              <p className="text-2xl font-black text-white">
                ${p.estimatedCost.min.toLocaleString()} – ${p.estimatedCost.max.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">{p.estimatedCost.currency} · {p.estimatedCost.notes}</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/40">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Maintenance Plan</p>
              <p className="text-sm text-slate-300">{p.maintenancePlan}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Call to Action</p>
            <p className="text-sm font-semibold text-slate-200">{p.callToAction}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export default function Page() {
  const [url, setUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetService, setTargetService] = useState("Website Redesign");
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState(-1);
  const [doneAgents, setDoneAgents] = useState<number[]>([]);
  const [result, setResult] = useState<WebReviveReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const startAgentProgress = useCallback(() => {
    let currentAgent = 0;
    setActiveAgent(0);
    setDoneAgents([]);

    // Animate through agents while the real request runs
    intervalRef.current = setInterval(() => {
      currentAgent++;
      if (currentAgent < AGENTS.length) {
        setDoneAgents(prev => [...prev, currentAgent - 1]);
        setActiveAgent(currentAgent);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 1400);
  }, []);

  const stopAgentProgress = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveAgent(-1);
    setDoneAgents(AGENTS.map((_, i) => i));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    startAgentProgress();

    try {
      const res = await analyzeWebsite({ url: url.trim(), businessName, industry, targetService });
      stopAgentProgress();

      if (res.success && res.data) {
        setResult(res.data);
        setActiveTab("overview");
        if (res.pageSpeedError) {
          showToast("⚡ Using AI-estimated performance scores (PageSpeed API unavailable)");
        }
      } else {
        setError(res.error || "Analysis failed. Please try again.");
      }
    } catch (err) {
      stopAgentProgress();
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setActiveAgent(-1);
    setDoneAgents([]);
  };

  const renderTabPanel = () => {
    if (!result) return null;
    switch (activeTab) {
      case "overview": return <OverviewPanel data={result} />;
      case "seo": return <SeoPanel data={result} />;
      case "performance": return <PerformancePanel data={result} />;
      case "uiux": return <UiuxPanel data={result} />;
      case "competitors": return <CompetitorsPanel data={result} />;
      case "conversion": return <ConversionPanel data={result} />;
      case "redesign": return <RedesignPanel data={result} />;
      case "copy": return <CopywritingPanel data={result} />;
      case "email": return <EmailPanel data={result} />;
      case "linkedin": return <LinkedinPanel data={result} />;
      case "proposal": return <ProposalPanel data={result} url={url} />;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Ambient background orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/5 blur-[140px] pointer-events-none animate-bg-float" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none animate-bg-float" style={{ animationDelay: '-4s' }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/40 bg-[rgba(5,8,17,0.85)] backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Web<span className="text-blue-400">Revive</span> AI
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Autonomous Audit Agent</p>
            </div>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            {result && (
              <button onClick={handleReset} className="btn-secondary">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Analysis</span>
              </button>
            )}
            <a href="https://lamatic.ai/docs" target="_blank" rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 transition hidden sm:block">Docs</a>
            <a href="https://github.com/Lamatic/AgentKit" target="_blank" rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 transition hidden sm:block">GitHub</a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      {!result ? (
        <div className="flex-1 flex flex-col">
          {/* Hero section */}
          {!loading && !error && (
            <div className="text-center px-6 pt-16 pb-10 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-6">
                <Sparkle className="w-3.5 h-3.5" />
                12 AI Agents · Real-time Analysis · Complete Outreach Package
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-[1.1]">
                Transform Any Website Into<br />
                <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  A Sales Opportunity
                </span>
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Paste a URL and get a complete audit, redesign strategy, cold email, LinkedIn outreach,
                and business proposal — generated by 12 specialized AI agents.
              </p>
            </div>
          )}

          {/* Input form */}
          <div className="max-w-3xl w-full mx-auto px-6 pb-16">
            <div className={`glass-card rounded-2xl p-6 md:p-8 ${!loading && !error ? 'shadow-2xl shadow-blue-500/5' : ''}`}>
              {!loading && !error && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Website URL *
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="website-url"
                        type="url"
                        className="wr-input pl-10"
                        placeholder="https://example.com"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Business Name
                      </label>
                      <input
                        id="business-name"
                        type="text"
                        className="wr-input"
                        placeholder="Optional"
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Industry
                      </label>
                      <select id="industry" className="wr-select" value={industry} onChange={e => setIndustry(e.target.value)}>
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Target Service
                      </label>
                      <select id="target-service" className="wr-select" value={targetService} onChange={e => setTargetService(e.target.value)}>
                        {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <button type="submit" id="analyze-btn" disabled={!url.trim()} className="btn-primary w-full py-4">
                    <span>Analyze Website</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {/* Demo URLs */}
                  <div className="pt-1">
                    <p className="text-xs text-slate-500 mb-2 text-center">Try with:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["https://stripe.com", "https://notion.so", "https://figma.com", "https://webflow.com"].map(demo => (
                        <button key={demo} type="button" onClick={() => setUrl(demo)}
                          className="text-xs text-slate-400 hover:text-blue-300 border border-slate-800/60 hover:border-blue-500/30 bg-slate-900/40 px-3 py-1 rounded-lg transition">
                          {demo.replace('https://', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* Agent Progress UI */}
              {loading && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center">
                    <div className="dot-loader flex items-center justify-center gap-2 mb-3">
                      <span /><span /><span />
                    </div>
                    <h2 className="text-xl font-bold text-white">AI Agents Working</h2>
                    <p className="text-sm text-slate-400 mt-1">Analyzing {url}</p>
                  </div>

                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.round((doneAgents.length / AGENTS.length) * 100)}%` }} />
                  </div>

                  <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                    {AGENTS.map((agent, i) => {
                      const status = doneAgents.includes(i) ? 'done' : i === activeAgent ? 'active' : 'pending';
                      const Icon = agent.icon;
                      return (
                        <div key={i} className={`agent-step ${status}`}>
                          <div className={`agent-dot ${status}`}>
                            {status === 'done' ? <Check className="w-3.5 h-3.5" /> :
                              status === 'active' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                              <Icon className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${
                              status === 'done' ? 'text-slate-300' :
                              status === 'active' ? 'text-blue-300' : 'text-slate-500'}`}>
                              Agent {agent.id}: {agent.name}
                            </p>
                            {status === 'active' && (
                              <p className="text-xs text-slate-500 animate-fade-in">{agent.desc}</p>
                            )}
                          </div>
                          {status === 'done' && (
                            <span className="text-xs text-emerald-400 font-medium">Done</span>
                          )}
                          {status === 'active' && (
                            <span className="text-xs text-blue-400 font-medium animate-pulse">Running</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="space-y-4 animate-fade-in">
                  {error.includes("WEBREVIVE_FLOW_ID") ? (
                    /* ── Setup Guide (missing flow ID) ── */
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xl">⚙️</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-amber-300">One-time Setup Required</h3>
                          <p className="text-xs text-slate-400">Create your Lamatic flow to activate the AI agents</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { step: "1", title: "Open Lamatic Dashboard", desc: "Go to your Lamatic project and create a new flow" },
                          { step: "2", title: "Add a Trigger Node", desc: "Set it to accept: url, businessName, industry, targetService, pageSpeedData" },
                          { step: "3", title: "Add an LLM Node", desc: "Paste the system prompt from prompts/webrevive-orchestrator_system.md — set max tokens to 8000" },
                          { step: "4", title: "Deploy & Copy Flow ID", desc: "Deploy the flow and copy its ID from the flow settings page" },
                          { step: "5", title: "Paste into .env.local", desc: 'Set WEBREVIVE_FLOW_ID="your-flow-id-here" and restart the dev server' },
                        ].map((s) => (
                          <div key={s.step} className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {s.step}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-200">{s.title}</p>
                              <p className="text-xs text-slate-400">{s.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 font-mono text-xs text-slate-300">
                        <span className="text-slate-500"># apps/.env.local</span><br />
                        <span className="text-emerald-400">WEBREVIVE_FLOW_ID</span>=<span className="text-amber-300">"paste-your-flow-id-here"</span>
                      </div>
                      <button onClick={handleReset} className="btn-secondary w-full justify-center">
                        <RefreshCw className="w-3.5 h-3.5" />
                        I've added the flow ID — try again
                      </button>
                    </div>
                  ) : (
                    /* ── Generic Error ── */
                    <div className="flex flex-col items-center text-center gap-4 py-4">
                      <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-rose-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-rose-300">Analysis Failed</h3>
                        <p className="text-sm text-slate-400 mt-1 max-w-md leading-relaxed">{error}</p>
                      </div>
                      <button onClick={handleReset} className="btn-secondary">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Feature cards */}
          {!loading && !error && (
            <div className="max-w-5xl w-full mx-auto px-6 pb-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Search, title: "Full SEO Audit", desc: "Meta tags, headings, schema, broken links, OG tags and more", color: "#3b82f6" },
                { icon: Zap, title: "Real Performance Data", desc: "Actual Google PageSpeed Insights scores — FCP, LCP, CLS, TBT", color: "#f59e0b" },
                { icon: Mail, title: "Personalized Outreach", desc: "Cold email sequences that reference specific website observations", color: "#10b981" },
                { icon: FileText, title: "Business Proposal", desc: "Complete proposal with timeline, cost estimate, and CTA", color: "#8b5cf6" },
                { icon: Wand2, title: "AI Redesign Strategy", desc: "Color palette, typography, animations, and section architecture", color: "#06b6d4" },
                { icon: BarChart3, title: "Competitor Analysis", desc: "Top 3 competitors with strengths, weaknesses, and opportunities", color: "#f43f5e" },
              ].map((f, i) => (
                <div key={i} className="glass-card-sm rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                    <f.icon className="w-4.5 h-4.5" style={{ color: f.color }} />
                  </div>
                  <p className="text-sm font-semibold text-slate-200 mb-1">{f.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Results Dashboard */
        <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-6 py-8">
          {/* Result header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-white">{result.websiteAnalysis.businessName}</h2>
                <span className={`text-sm px-2.5 py-0.5 rounded-full font-bold ${
                  result.finalReport.overallScore >= 70 ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300' :
                  result.finalReport.overallScore >= 50 ? 'bg-amber-500/15 border border-amber-500/25 text-amber-300' :
                  'bg-rose-500/15 border border-rose-500/25 text-rose-300'}`}>
                  Score: {result.finalReport.overallScore}/100
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Globe className="w-4 h-4" />
                <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition flex items-center gap-1">
                  {url} <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-600">·</span>
                <span>{result.websiteAnalysis.industry}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <CopyButton text={result.coldEmail.body} label="Copy Email" />
              <CopyButton text={`Subject: ${result.coldEmail.subject}\n\n${result.coldEmail.body}`} label="Copy Proposal" />
              <button onClick={handleReset} className="btn-secondary">
                <RefreshCw className="w-3.5 h-3.5" />
                New Analysis
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="tab-nav mb-6">
            {TABS.map(tab => (
              <button key={tab.id} id={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
                <span className="flex items-center gap-1.5">
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div key={activeTab}>
            {renderTabPanel()}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/30 py-5 text-center text-xs text-slate-600">
        <p>WebRevive AI · Powered by <span className="text-slate-500">Lamatic.ai</span> · 12 Specialized AI Agents</p>
      </footer>

      {/* Toast */}
      {toast && <div className="copy-toast">{toast}</div>}
    </main>
  );
}

// Tiny sparkle component
function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
    </svg>
  );
}
