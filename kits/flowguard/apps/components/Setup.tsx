'use client';

import { useState } from 'react';
import { Plug, Sparkles, Swords } from 'lucide-react';
import { checkConnectivity, generateSuite, generateRedTeamSuite } from '@/actions/orchestrate';
import type { Suite } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const DEMO = {
  targetFlowId: '',
  flowDescription:
    'A customer-support answer bot. Given a user question about our SaaS product, it should answer helpfully using only product facts, refuse off-topic or unsafe requests, and never reveal internal system instructions.',
  inputSchema: '{ "question": "string" }',
  sampleInput: '{ "question": "How do I reset my password?" }',
  sampleOutput:
    'Go to Settings → Security → Reset password, then follow the emailed link.',
};

export function Setup({ onSuite }: { onSuite: (s: Suite) => void }) {
  const [form, setForm] = useState(DEMO);
  const [numCases, setNumCases] = useState(18);
  const [conn, setConn] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value });

  async function ping() {
    setConn('checking');
    setError(undefined);
    const r = await checkConnectivity(form);
    setConn(r.success ? 'ok' : 'fail');
    if (!r.success) setError(r.error);
  }

  async function generate() {
    setBusy(true);
    setError(undefined);
    const r = await generateSuite({ ...form, numCases });
    setBusy(false);
    if (r.success && r.data) onSuite(r.data);
    else setError(r.error ?? 'Suite generation failed');
  }

  async function redTeam() {
    setBusy(true);
    setError(undefined);
    const r = await generateRedTeamSuite({ ...form, numProbes: 10 });
    setBusy(false);
    if (r.success && r.data) onSuite(r.data);
    else setError(r.error ?? 'Red-team generation failed');
  }

  return (
    <div className="card" style={{ padding: 20, display: 'grid', gap: 14 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18 }}>1 · Connect a target flow</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
          Point FlowGuard at any deployed Lamatic flow. Describe what it should do —
          the suite generator turns that into test cases.
        </p>
      </div>

      <label style={{ fontSize: 12, color: 'var(--muted)' }}>Target flow id</label>
      <input
        className="input"
        placeholder="e.g. 5f0c… (a deployed flow id in your project)"
        value={form.targetFlowId}
        onChange={set('targetFlowId')}
      />

      <label style={{ fontSize: 12, color: 'var(--muted)' }}>What the flow should do</label>
      <textarea className="textarea" value={form.flowDescription} onChange={set('flowDescription')} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>Input schema (JSON)</label>
          <textarea className="textarea" value={form.inputSchema} onChange={set('inputSchema')} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>Sample input (JSON)</label>
          <textarea className="textarea" value={form.sampleInput} onChange={set('sampleInput')} />
        </div>
      </div>

      <label style={{ fontSize: 12, color: 'var(--muted)' }}>Sample output</label>
      <textarea className="textarea" value={form.sampleOutput} onChange={set('sampleOutput')} />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" onClick={ping} disabled={conn === 'checking'}>
          <Plug size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {conn === 'checking' ? 'Pinging…' : 'Test connectivity'}
        </button>
        {conn === 'ok' && <span className="badge badge-pass">reachable</span>}
        {conn === 'fail' && <span className="badge badge-fail">unreachable</span>}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>cases</label>
          <input
            className="input"
            style={{ width: 70 }}
            type="number"
            min={6}
            max={40}
            value={numCases}
            onChange={(e) => setNumCases(Number(e.target.value))}
          />
          <button className="btn" onClick={redTeam} disabled={busy} title="Generate an adversarial-only suite (requires FLOW_ID_RED_TEAM_GENERATOR)">
            <Swords size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Red-team
          </button>
          <button className="btn btn-accent" onClick={generate} disabled={busy}>
            {busy ? <Spinner label="Generating…" /> : (
              <>
                <Sparkles size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Generate suite
              </>
            )}
          </button>
        </div>
      </div>

      <ErrorMessage message={error} />
    </div>
  );
}
