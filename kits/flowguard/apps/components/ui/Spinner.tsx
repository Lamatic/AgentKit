import { Loader2 } from 'lucide-react';

export function Spinner({ label }: { label?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
      <Loader2 className="spin" size={16} />
      {label}
    </span>
  );
}
