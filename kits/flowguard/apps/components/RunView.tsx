'use client';

import { useState, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import { Flag, GitCompare, FileText, Download, ChevronRight, RefreshCw } from 'lucide-react';
import {
  setBaseline,
  diffAgainstBaseline,
  generateReport,
  exportState,
  runEvaluation,
} from '@/actions/orchestrate';
import type { Run, BaselineDiff, JudgedCase, RubricAxis } from '@/types';
import { VerdictBadge } from '@/components/VerdictBadge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const AXES: { key: RubricAxis; short: string }[] = [
  { key: 'taskSuccess', short: 'Task' },
  { key: 'faithfulness', short: 'Faith' },
  { key: 'toneConstitution', short: 'Tone' },
  { key: 'safety', short: 'Safe' },
];

const REG_STYLE: Record<string, { color: string; label: string }> = {
  IMPROVED: { color: 'var(--pass)', label: 'IMPROVED' },
  NO_CHANGE: { color: 'var(--muted)', label: 'NO CHANGE' },
  REGRESSED: { color: 'var(--fail)', label: 'REGRESSED' },
};

function scoreCell(v: number | undefined) {
  if (v == null) return <td style={{ textAlign: 'center', color: 'var(--muted)' }}>—</td>;
  const color = v >= 4 ? 'var(--pass)' : v <= 2 ? 'var(--fail)' : 'var(--border-line)';
  return <td style={{ textAlign: 'center', color, fontWeight: 700 }}>{v}</td>;
}

export function RunView({ run, onRerun }: { run: Run; onRerun?: (r: Run) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [diff, setDiff] = useState<BaselineDiff | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string>();
  const [error, setError] = useState<string>();

  const t = run.totals;

  async function doBaseline() {
    setBusy('baseline');
    const r = await setBaseline(run.id);
    setBusy(null);
    setNote(r.success ? 'This run is now the baseline for suite v' + run.suiteVersion : undefined);
    if (!r.success) setError(r.error);
  }
  async function doDiff() {
    setBusy('diff');
    setError(undefined);
    const r = await diffAgainstBaseline(run.id);
    setBusy(null);
    if (r.success) setDiff(r.data as BaselineDiff);
    else setError(r.error);
  }
  async function doReport() {
    setBusy('report');
    setError(undefined);
    const r = await generateReport(run.id);
    setBusy(null);
    if (r.success && r.data) setReport((r.data as { markdown: string }).markdown);
    else setError(r.error);
  }
  async function doRerun() {
    setBusy('rerun');
    setError(undefined);
    setDiff(null);
    setReport(null);
    const r = await runEvaluation(run.suiteId, { fresh: true });
    setBusy(null);
    if (r.success && r.data) onRerun?.(r.data as Run);
    else setError(r.error);
  }
  async function doExport() {
    const r = await exportState();
    if (!r.success) return setError(r.error);
    const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowguard-${run.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Totals */}
      <div className="card" style={{ padding: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>3 · Run results</h2>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{run.id}</span>
        {t && (
          <div style={{ display: 'flex', gap: 16, marginLeft: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--pass)' }}>✓ {t.passed} pass</span>
            <span style={{ color: 'var(--border-line)' }}>~ {t.borderline} border</span>
            <span style={{ color: 'var(--fail)' }}>✗ {t.failed} fail</span>
            <span style={{ color: 'var(--muted)' }}>⚠ {t.errored} errored</span>
            <span style={{ color: 'var(--muted)' }}>~{t.avgLatencyMs}ms avg</span>
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn" onClick={doRerun} disabled={busy === 'rerun'}>
            {busy === 'rerun' ? <Spinner label="Re-running…" /> : <><RefreshCw size={14} style={{ verticalAlign: 'middle' }} /> Re-run</>}
          </button>
          <button className="btn" onClick={doBaseline} disabled={busy === 'baseline'}>
            <Flag size={14} style={{ verticalAlign: 'middle' }} /> Set baseline
          </button>
          <button className="btn" onClick={doDiff} disabled={busy === 'diff'}>
            {busy === 'diff' ? <Spinner /> : <><GitCompare size={14} style={{ verticalAlign: 'middle' }} /> Compare</>}
          </button>
          <button className="btn" onClick={doReport} disabled={busy === 'report'}>
            {busy === 'report' ? <Spinner /> : <><FileText size={14} style={{ verticalAlign: 'middle' }} /> Report</>}
          </button>
          <button className="btn" onClick={doExport}>
            <Download size={14} style={{ verticalAlign: 'middle' }} /> Export
          </button>
        </div>
      </div>

      {note && <div style={{ color: 'var(--pass)', fontSize: 13 }}>{note}</div>}
      <ErrorMessage message={error} />

      {/* Regression verdict banner */}
      {diff && (
        <div className="card" style={{ padding: 18, borderColor: REG_STYLE[diff.verdict].color }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: REG_STYLE[diff.verdict].color }}>
              {REG_STYLE[diff.verdict].label}
            </span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
              mean score Δ {diff.meanScoreDelta >= 0 ? '+' : ''}{diff.meanScoreDelta} vs baseline
            </span>
          </div>
          {(diff.flippedToFail.length > 0 || diff.flippedToPass.length > 0) && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              {diff.flippedToFail.length > 0 && (
                <div style={{ color: 'var(--fail)' }}>↓ now failing: {diff.flippedToFail.join(', ')}</div>
              )}
              {diff.flippedToPass.length > 0 && (
                <div style={{ color: 'var(--pass)' }}>↑ now passing: {diff.flippedToPass.join(', ')}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="card" style={{ padding: 18 }}>
          <div className="markdown" style={{ fontSize: 14, lineHeight: 1.6 }}>
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Score matrix */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--panel-2)', color: 'var(--muted)' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px' }}>Case</th>
              <th style={{ textAlign: 'left' }}>Category</th>
              <th>Verdict</th>
              {AXES.map((a) => <th key={a.key}>{a.short}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {run.results.map((jc: JudgedCase) => {
              const open = expanded === jc.testCase.id;
              const s = jc.judgment?.scores;
              return (
                <Fragment key={jc.testCase.id}>
                  <tr
                    style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => setExpanded(open ? null : jc.testCase.id)}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{jc.testCase.id}</td>
                    <td style={{ color: 'var(--muted)' }}>{jc.testCase.category}</td>
                    <td style={{ textAlign: 'center' }}>
                      {jc.execution.outcome !== 'ok'
                        ? <span className="badge">{jc.execution.outcome}</span>
                        : <VerdictBadge verdict={jc.judgment?.verdict} />}
                    </td>
                    {AXES.map((a) => scoreCell(s?.[a.key]))}
                    <td style={{ paddingRight: 10 }}>
                      <ChevronRight size={14} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: '0.15s' }} />
                    </td>
                  </tr>
                  {open && (
                    <tr style={{ background: 'var(--bg)' }}>
                      <td colSpan={4 + AXES.length} style={{ padding: 14 }}>
                        <div style={{ display: 'grid', gap: 8, fontSize: 12 }}>
                          <div><b>Expected:</b> {jc.testCase.expectedBehavior}</div>
                          <div><b>Input:</b> <code>{JSON.stringify(jc.testCase.input)}</code></div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>
                            <b>Output:</b> {jc.execution.rawText || <span style={{ color: 'var(--muted)' }}>({jc.execution.outcome}{jc.execution.error ? ': ' + jc.execution.error : ''})</span>}
                          </div>
                          {jc.judgment?.rationales && (
                            <div>
                              <b>Judge rationale:</b>
                              <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: 'var(--muted)' }}>
                                {Object.entries(jc.judgment.rationales).map(([k, v]) => (
                                  <li key={k}><b>{k}:</b> {v}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
