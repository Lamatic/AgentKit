'use client';

import React, { useState } from 'react';
import { Hexagon, GitBranch, ScanSearch, TriangleAlert, Table2, Check, ArrowRight } from 'lucide-react';

// ── Example specs (breaking scenario) for quick reviewer demo ──────────────
const EXAMPLE_V1 = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'User Service API', version: '1.0.0' },
  paths: {
    '/users/{id}': {
      get: {
        summary: 'Get user details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'User found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}, null, 2);

const EXAMPLE_V2_BREAKING = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'User Service API', version: '2.0.0' },
  paths: {
    '/users/{id}': {
      get: {
        summary: 'Get user details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'User found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}, null, 2);

// ── Small reusable components ──────────────────────────────────────────────

function RiskBadge({ risk }: { risk: string }) {
  const r = risk?.toUpperCase() ?? 'LOW';
  const cls: Record<string, string> = {
    CRITICAL: 'bg-red-600/15 text-red-300 border-red-600/30',
    HIGH:     'bg-red-500/15 text-red-400 border-red-500/30',
    MEDIUM:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    LOW:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold tracking-wide border ${cls[r] ?? cls.LOW}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${r === 'LOW' ? 'bg-emerald-400' : r === 'MEDIUM' ? 'bg-amber-400' : 'bg-red-400'}`} />
      {r} RISK
    </span>
  );
}

function SeverityPip({ severity }: { severity: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
      severity === 'CRITICAL'
        ? 'bg-red-500/10 text-red-400 border-red-500/25'
        : 'bg-slate-800 text-slate-500 border-slate-700/50'
    }`}>
      {severity}
    </span>
  );
}

function ActionPip({ action }: { action: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    remove: { label: 'REMOVED', cls: 'bg-red-500/10 text-red-400 border-red-500/25' },
    add:    { label: 'ADDED',   cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
    change: { label: 'CHANGED', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
  };
  const { label, cls } = map[action] ?? { label: action.toUpperCase(), cls: 'bg-slate-800 text-slate-500 border-slate-700/50' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${cls}`}>
      {label}
    </span>
  );
}

function TypeCell({ value }: { value: string }) {
  if (!value || value === '—') return <span className="text-slate-700">—</span>;
  return <code className="font-mono text-slate-300 bg-slate-800/60 px-1.5 py-0.5 rounded text-[11px]">{value}</code>;
}

// ── Main dashboard ─────────────────────────────────────────────────────────

export default function SentinelDashboard() {
  const [specA, setSpecA] = useState('');
  const [specB, setSpecB] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!specA.trim() || !specB.trim()) {
      setError('Both Base Spec and Target Spec are required.');
      return;
    }
    setError('');
    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch('/api/analyze-drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specA, specB }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Analysis failed');
      setAnalysis(json.data);
    } catch (err: any) {
      setError(err.message ?? 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setSpecA(EXAMPLE_V1);
    setSpecB(EXAMPLE_V2_BREAKING);
    setAnalysis(null);
    setError('');
  };

  const toStringList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const summary = analysis?.executiveSummary;

  const risk = analysis?.riskLevel ?? (typeof summary?.deploymentRisk === 'string' ? summary.deploymentRisk : 'LOW');
  const recommendation =
    typeof summary === 'string'
      ? summary
      : typeof summary?.recommendation === 'string'
        ? summary.recommendation
        : typeof analysis?.summary === 'string'
          ? analysis.summary
          : '';
  const breakingCount = typeof analysis?.breakingCount === 'number' ? analysis.breakingCount : 0;
  const nonBreakingCount = typeof analysis?.nonBreakingCount === 'number' ? analysis.nonBreakingCount : 0;
  const changes: any[] = Array.isArray(analysis?.changes) ? analysis.changes : [];
  const detailedImpact: string[] = toStringList(analysis?.detailedImpact);
  const migrationGuide: string[] = toStringList(analysis?.migrationGuide);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-[family-name:var(--font-sans)]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0" aria-hidden="true">
              <Hexagon width={15} height={15} stroke="#818cf8" strokeWidth={1.4} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white leading-none">API Schema Drift Sentinel</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Deterministic diff · AI migration intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[10px] font-mono text-slate-600 border border-slate-800 rounded px-2 py-1">v1.0.0</span>
            <a
              href="https://github.com/Lamatic/AgentKit/tree/main/kits/api-schema-drift-sentinel"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="text-slate-600 hover:text-slate-400 transition-colors"
            >
              <GitBranch width={16} height={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Spec input section ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Compare OpenAPI Specifications</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste valid OpenAPI 3.0 JSON for both versions. The local diff engine runs first — AI synthesizes the narrative.
              </p>
            </div>
            <button
              id="load-example-btn"
              type="button"
              onClick={loadExample}
              className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              Load breaking example
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Base spec */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-slate-700 transition-colors">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  <span className="text-xs font-medium text-slate-300">Base Spec</span>
                </div>
                <span className="text-[10px] font-mono text-slate-600">v1 · source of truth</span>
              </div>
              <textarea
                id="spec-a-input"
                aria-label="Base OpenAPI specification"
                value={specA}
                onChange={(e) => setSpecA(e.target.value)}
                placeholder={'{\n  "openapi": "3.0.0",\n  "info": { "title": "...", "version": "1.0.0" },\n  "paths": {}\n}'}
                className="w-full h-52 bg-slate-950/50 px-4 py-3 text-xs font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none resize-none"
                spellCheck={false}
              />
            </div>

            {/* Target spec */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-slate-700 transition-colors">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400/80" />
                  <span className="text-xs font-medium text-slate-300">Target Spec</span>
                </div>
                <span className="text-[10px] font-mono text-slate-600">v2 · candidate</span>
              </div>
              <textarea
                id="spec-b-input"
                aria-label="Target OpenAPI specification"
                value={specB}
                onChange={(e) => setSpecB(e.target.value)}
                placeholder={'{\n  "openapi": "3.0.0",\n  "info": { "title": "...", "version": "2.0.0" },\n  "paths": {}\n}'}
                className="w-full h-52 bg-slate-950/50 px-4 py-3 text-xs font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none resize-none"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-[11px] text-slate-600">
              Breaking changes are detected deterministically · AI narrative is grounded in confirmed facts
            </p>
            <button
              id="analyze-btn"
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              aria-busy={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <ScanSearch width={13} height={13} aria-hidden="true" />
                  Analyze Drift
                </>
              )}
            </button>
          </div>
        </section>

        {/* ── Error state ───────────────────────────────────────────────── */}
        {error && (
          <div id="error-panel" role="alert" className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <TriangleAlert width={15} height={15} className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-red-400">Analysis failed</p>
              <p className="text-xs text-red-400/60 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!analysis && !loading && !error && (
          <div className="border border-slate-800/50 border-dashed rounded-xl py-20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Table2 width={24} height={24} stroke="#334155" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Awaiting comparison</p>
              <p className="text-xs text-slate-600 mt-1.5 max-w-xs">
                Paste two OpenAPI specs above and click{' '}
                <span className="text-indigo-400 font-medium">Analyze Drift</span>, or use the{' '}
                <button type="button" onClick={loadExample} className="text-indigo-400 font-medium hover:underline cursor-pointer">breaking example</button>{' '}
                to see a live result.
              </p>
            </div>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {analysis && (
          <div id="results-section" className="space-y-6">

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Deployment Risk</p>
                <div className="mt-3">
                  <RiskBadge risk={risk} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Breaking</p>
                <p className={`text-3xl font-bold mt-2 tabular-nums ${breakingCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {breakingCount}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">changes</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Non-Breaking</p>
                <p className="text-3xl font-bold mt-2 tabular-nums text-slate-300">
                  {nonBreakingCount}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">changes</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Total Changes</p>
                <p className="text-3xl font-bold mt-2 tabular-nums text-indigo-400">
                  {breakingCount + nonBreakingCount}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">detected</p>
              </div>
            </div>

            {/* Change table */}
            {changes.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">Detected Changes</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {changes.length} change{changes.length !== 1 ? 's' : ''} · deterministic
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/70">
                        {['Severity', 'Action', 'Field', 'Endpoint', 'Before', 'After'].map((h) => (
                          <th key={h} className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-5 py-3 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {changes.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/25 transition-colors">
                          <td className="px-5 py-3 whitespace-nowrap"><SeverityPip severity={item.severity} /></td>
                          <td className="px-5 py-3 whitespace-nowrap"><ActionPip action={item.action} /></td>
                          <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-200">{item.field}</td>
                          <td className="px-5 py-3 whitespace-nowrap font-mono text-indigo-300/80">{item.endpoint}</td>
                          <td className="px-5 py-3 whitespace-nowrap"><TypeCell value={item.before} /></td>
                          <td className="px-5 py-3 whitespace-nowrap"><TypeCell value={item.after} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No breaking changes — clean state */}
            {changes.length === 0 && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                <Check width={16} height={16} className="text-emerald-400 shrink-0" aria-hidden="true" />
                <p className="text-sm text-emerald-400 font-medium">No breaking changes detected.</p>
                {nonBreakingCount > 0 && (
                  <p className="text-xs text-emerald-400/60">{nonBreakingCount} additive change{nonBreakingCount !== 1 ? 's' : ''} — safe to deploy.</p>
                )}
              </div>
            )}

            {/* Executive Summary */}
            {recommendation && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-0.5 h-4 rounded-full bg-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-200">Executive Summary</h3>
                  <span className="ml-auto text-[10px] text-slate-600 border border-slate-800 rounded px-1.5 py-0.5 font-mono">AI · Lamatic</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{recommendation}</p>
              </div>
            )}

            {/* Impact + Migration */}
            {(detailedImpact.length > 0 || migrationGuide.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {detailedImpact.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-0.5 h-4 rounded-full bg-red-500/60" />
                      <h3 className="text-sm font-semibold text-slate-200">Impact Assessment</h3>
                    </div>
                    <ul className="space-y-3">
                      {detailedImpact.map((item: string, idx: number) => (
                        <li key={idx} className="flex gap-2.5 text-xs text-slate-300 leading-relaxed">
                          <ArrowRight width={10} height={10} className="shrink-0 mt-1 text-red-500/50" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {migrationGuide.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-0.5 h-4 rounded-full bg-emerald-500/60" />
                      <h3 className="text-sm font-semibold text-slate-200">Migration Guide</h3>
                    </div>
                    <ol className="space-y-3">
                      {migrationGuide.map((step: string, idx: number) => (
                        <li key={idx} className="flex gap-2.5 text-xs text-slate-300 leading-relaxed">
                          <span className="shrink-0 w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center tabular-nums">
                            {idx + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* AI unavailable fallback */}
            {!recommendation && detailedImpact.length === 0 && migrationGuide.length === 0 && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl text-xs text-amber-400/70">
                AI narrative synthesis unavailable — deterministic diff results are shown above.
              </div>
            )}

          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/40 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600">
          <span>
            API Schema Drift Sentinel · Built on{' '}
            <a href="https://lamatic.ai" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400 transition-colors">
              Lamatic
            </a>
          </span>
          <span className="font-mono">Lamatic AgentKit Challenge 2026</span>
        </div>
      </footer>

    </div>
  );
}