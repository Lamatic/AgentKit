'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Setup } from '@/components/Setup';
import { SuiteEditor } from '@/components/SuiteEditor';
import { RunView } from '@/components/RunView';
import type { Suite, Run } from '@/types';

export default function Page() {
  const [suite, setSuite] = useState<Suite | null>(null);
  const [run, setRun] = useState<Run | null>(null);

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px 80px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <ShieldCheck size={26} color="var(--accent)" />
        <h1 style={{ margin: 0, fontSize: 24 }}>FlowGuard</h1>
      </header>
      <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
        AgentKit says “reliable agents.” FlowGuard is the missing reliability layer —
        it evals, red-teams, and regression-tests any Lamatic flow.
      </p>

      <div style={{ display: 'grid', gap: 18 }}>
        <Setup
          onSuite={(s) => {
            setSuite(s);
            setRun(null);
          }}
        />

        {suite && (
          <SuiteEditor
            key={suite.id}
            suite={suite}
            onSuitePinned={setSuite}
            onRun={(r) => setRun(r)}
          />
        )}

        {run && <RunView run={run} onRerun={setRun} />}
      </div>
    </main>
  );
}
