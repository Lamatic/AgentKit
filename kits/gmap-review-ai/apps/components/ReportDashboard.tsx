// app/components/ReportDashboard.tsx
import ReactMarkdown from 'react-markdown';

export default function ReportDashboard({ markdown }: { markdown: string }) {
  if (!markdown) return null;
  return (
    <div className="prose prose-invert prose-teal max-w-none">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}

