"use client";

interface JsonViewerProps {
  data: unknown;
}

export default function JsonViewer({ data }: JsonViewerProps) {
  const formatted = JSON.stringify(data, null, 2);

  return (
    <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed select-all">
      {formatted}
    </pre>
  );
}
