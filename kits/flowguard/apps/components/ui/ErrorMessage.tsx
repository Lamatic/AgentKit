import { AlertTriangle } from 'lucide-react';

export function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      className="card"
      style={{
        borderColor: 'var(--fail)',
        padding: '10px 14px',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        color: 'var(--fail)',
        fontSize: 13,
      }}
    >
      <AlertTriangle size={16} />
      <span>{message}</span>
    </div>
  );
}
