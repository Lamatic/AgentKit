"use client";

interface JsonViewerProps {
  data: unknown;
}

/**
 * Formats and displays arbitrary JSON payloads in a styled, scrollable mono block.
 * @param props Props containing the JSON data object or array.
 * @returns React JSX element rendering formatted JSON code.
 */
export default function JsonViewer({ data }: JsonViewerProps) {
  const formatted = JSON.stringify(data, null, 2);

  return (
    <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed select-all">
      {formatted}
    </pre>
  );
}
