import type { JudgeVerdict } from '@/types';

const MAP: Record<JudgeVerdict, { cls: string; label: string }> = {
  pass: { cls: 'badge-pass', label: 'PASS' },
  fail: { cls: 'badge-fail', label: 'FAIL' },
  borderline: { cls: 'badge-border', label: 'BORDER' },
};

export function VerdictBadge({ verdict }: { verdict?: JudgeVerdict | null }) {
  if (!verdict) return <span className="badge">—</span>;
  const m = MAP[verdict];
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}
