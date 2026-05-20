'use client'

import { useState } from 'react'
import { runInterviewCoach, type InterviewCoachResult } from '@/actions/orchestrate'

type Tab = 'technical' | 'behavioral' | 'company' | 'plan'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'technical',  label: 'Technical Questions', emoji: '💻' },
  { id: 'behavioral', label: 'Behavioral Questions', emoji: '🧠' },
  { id: 'company',    label: 'Company Insights',     emoji: '🏢' },
  { id: 'plan',       label: '30-60-90 Day Plan',    emoji: '🗓️' },
]

const EXP_LEVELS = [
  { value: 'fresher', label: 'Fresher / Intern' },
  { value: 'junior',  label: 'Junior (0–2 yrs)' },
  { value: 'mid',     label: 'Mid-level (2–5 yrs)' },
  { value: 'senior',  label: 'Senior (5+ yrs)' },
]

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0)
    return <p className="text-slate-400 italic text-sm">No data available.</p>

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 items-start">
          <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">
            {i + 1}
          </span>
          <span className="text-slate-700 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function PlanSection({ title, emoji, items }: { title: string; emoji: string; items: string[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h4>
      <BulletList items={items} />
    </div>
  )
}

export default function InterviewCoach() {
  const [jobRole,          setJobRole]          = useState('')
  const [company,          setCompany]          = useState('')
  const [background,       setBackground]       = useState('')
  const [experienceLevel,  setExperienceLevel]  = useState('fresher')
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [result,           setResult]           = useState<InterviewCoachResult | null>(null)
  const [activeTab,        setActiveTab]        = useState<Tab>('technical')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jobRole.trim() || !company.trim() || !background.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)

    const res = await runInterviewCoach({ jobRole, company, background, experienceLevel })

    setLoading(false)
    if (!res.success || !res.data) {
      setError(res.error ?? 'Something went wrong. Please try again.')
      return
    }
    setResult(res.data)
    setActiveTab('technical')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full">
          <span>🤖</span> Powered by Lamatic AgentKit
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          AI Interview Coach
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Tell us the role, company, and your background — and get a fully personalized
          interview prep kit in seconds.
        </p>
      </div>

      {/* ── Form ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Job Role */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Target Role <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={jobRole}
              onChange={e => setJobRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Company <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Google, Lamatic.ai"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Experience Level */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Experience Level</label>
          <div className="flex flex-wrap gap-2">
            {EXP_LEVELS.map(lvl => (
              <button
                key={lvl.value}
                type="button"
                onClick={() => setExperienceLevel(lvl.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  experienceLevel === lvl.value
                    ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-brand-400'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Your Background <span className="text-red-400">*</span>
          </label>
          <textarea
            value={background}
            onChange={e => setBackground(e.target.value)}
            rows={4}
            placeholder="e.g. B.Tech IT student, 1 year React + Node.js experience, built a healthcare app, GSSoC Top 50 contributor, Oracle AI certified..."
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-400">
            The more detail you give, the more personalized your prep will be.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-semibold rounded-xl transition-all text-sm shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Generating your interview prep kit…
            </>
          ) : (
            <>✨ Generate My Interview Prep Kit</>
          )}
        </button>
      </form>

      {/* ── Results ── */}
      {result && (
        <div className="animate-fade-in space-y-4">

          {/* Quick summary banner */}
          {result.quickSummary && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-4 text-brand-800 text-sm leading-relaxed">
              <span className="font-semibold">🎯 Overview: </span>
              {result.quickSummary}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-700 bg-brand-50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.emoji}</span> {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'technical' && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-800 mb-4">
                    Technical Questions for {jobRole} at {company}
                  </h3>
                  <BulletList items={result.technicalQuestions} />
                </div>
              )}

              {activeTab === 'behavioral' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">
                    Behavioral Questions + STAR Answer Tips
                  </h3>
                  <BulletList items={result.behavioralQuestions} />
                  {(result.answerTips?.length ?? 0) > 0 && (
                    <>
                      <h4 className="font-medium text-slate-700 mt-4">
                        💡 Answer Tips
                      </h4>
                      <BulletList items={result.answerTips} />
                    </>
                  )}
                </div>
              )}

              {activeTab === 'company' && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-800 mb-4">
                    What You Should Know About {company}
                  </h3>
                  <BulletList items={result.companyInsights} />
                </div>
              )}

              {activeTab === 'plan' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 mb-2">
                    Your 30-60-90 Day Plan at {company}
                  </h3>
                  <PlanSection
                    title="First 30 Days — Learn & Observe"
                    emoji="🌱"
                    items={result.ninetyDayPlan.first30}
                  />
                  <PlanSection
                    title="Days 31–60 — Contribute & Build"
                    emoji="🔨"
                    items={result.ninetyDayPlan.next30}
                  />
                  <PlanSection
                    title="Days 61–90 — Own & Impact"
                    emoji="🚀"
                    items={result.ninetyDayPlan.final30}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Reset button */}
          <div className="text-center">
            <button
              onClick={() => setResult(null)}
              className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
            >
              ← Prep for a different role
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pb-4">
        Built with ❤️ by{' '}
        <a
          href="https://github.com/piyushkumar0707"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-600 transition-colors"
        >
          Piyush Kumar Singh
        </a>{' '}
        · Powered by{' '}
        <a
          href="https://lamatic.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-600 transition-colors"
        >
          Lamatic AgentKit
        </a>
      </footer>
    </div>
  )
}
