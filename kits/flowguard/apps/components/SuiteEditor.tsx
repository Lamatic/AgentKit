'use client';

import { useState } from 'react';
import { Trash2, Plus, Pin, Play } from 'lucide-react';
import { pinSuite, runEvaluation } from '@/actions/orchestrate';
import { CASE_CATEGORIES, type Suite, type TestCase, type Run, type CaseCategory } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

let uid = 0;
const newCase = (): TestCase => ({
  id: 'new_' + ++uid,
  category: 'happy_path',
  input: {},
  expectedBehavior: '',
  rationale: '',
});

export function SuiteEditor({
  suite,
  onSuitePinned,
  onRun,
}: {
  suite: Suite;
  onSuitePinned: (s: Suite) => void;
  onRun: (r: Run) => void;
}) {
  const [cases, setCases] = useState<TestCase[]>(suite.cases);
  const [pinning, setPinning] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();

  const update = (i: number, patch: Partial<TestCase>) =>
    setCases(cases.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  async function pin() {
    setPinning(true);
    setError(undefined);
    const r = await pinSuite(suite.id, cases);
    setPinning(false);
    if (r.success && r.data) onSuitePinned(r.data);
    else setError(r.error);
  }

  async function run() {
    setRunning(true);
    setError(undefined);
    // Ensure the latest edits are pinned before running.
    const pinned = await pinSuite(suite.id, cases);
    if (!pinned.success || !pinned.data) {
      setRunning(false);
      setError(pinned.error);
      return;
    }
    onSuitePinned(pinned.data);
    const r = await runEvaluation(pinned.data.id);
    setRunning(false);
    if (r.success && r.data) onRun(r.data);
    else setError(r.error);
  }

  return (
    <div className="card" style={{ padding: 20, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>2 · Review the suite</h2>
        <span className="badge">v{suite.version}</span>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{cases.length} cases</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setCases([...cases, newCase()])}>
            <Plus size={14} style={{ verticalAlign: 'middle' }} /> Add
          </button>
          <button className="btn" onClick={pin} disabled={pinning}>
            {pinning ? <Spinner /> : <><Pin size={14} style={{ verticalAlign: 'middle' }} /> Pin v{suite.pinned ? suite.version + 1 : suite.version}</>}
          </button>
          <button className="btn btn-accent" onClick={run} disabled={running || !cases.length}>
            {running ? <Spinner label="Running…" /> : <><Play size={14} style={{ verticalAlign: 'middle' }} /> Pin & run eval</>}
          </button>
        </div>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: 12, margin: 0 }}>
        Edit freely — the suite is human-in-the-loop by design. Once pinned it becomes
        immutable (v{suite.version}); comparisons only happen within a version.
      </p>

      <div style={{ display: 'grid', gap: 8 }}>
        {cases.map((c, i) => (
          <div key={c.id} className="card" style={{ padding: 12, background: 'var(--panel-2)', display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{c.id}</span>
              <select
                className="input"
                style={{ width: 150, fontFamily: 'inherit' }}
                value={c.category}
                onChange={(e) => update(i, { category: e.target.value as CaseCategory })}
              >
                {CASE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                className="btn"
                style={{ marginLeft: 'auto', padding: '6px 10px' }}
                onClick={() => setCases(cases.filter((_, j) => j !== i))}
                aria-label="delete case"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <textarea
              className="textarea"
              style={{ minHeight: 54 }}
              placeholder='input JSON, e.g. { "question": "…" }'
              value={typeof c.input === 'string' ? c.input : JSON.stringify(c.input)}
              onChange={(e) => {
                try {
                  update(i, { input: JSON.parse(e.target.value || '{}') });
                } catch {
                  // keep raw text until it parses; store as-is under a passthrough
                  update(i, { input: { _raw: e.target.value } });
                }
              }}
            />
            <input
              className="input"
              style={{ fontFamily: 'inherit' }}
              placeholder="expected behavior (a behavioral oracle, not an exact string)"
              value={c.expectedBehavior}
              onChange={(e) => update(i, { expectedBehavior: e.target.value })}
            />
          </div>
        ))}
      </div>

      <ErrorMessage message={error} />
    </div>
  );
}
