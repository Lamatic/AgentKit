import type { CaseResult, Chunk, GoldSpan, StrategyName } from "../lib/evidence/core.ts";

type Props = {
  documentText: string;
  strategy: StrategyName;
  chunks: Chunk[];
  cases: CaseResult[];
};

const CONTEXT = 60;

type Segment = {
  text: string;
  isGold: boolean;
  boundaryBefore: number | null;
};

function buildSegments(
  documentText: string,
  span: GoldSpan,
  chunks: Chunk[]
): { winStart: number; winEnd: number; segments: Segment[] } {
  const winStart = Math.max(0, span.start - CONTEXT);
  const winEnd = Math.min(documentText.length, span.end + CONTEXT);

  // Chunk edges strictly inside the window are the cuts a reviewer needs to see.
  const boundaries = new Set<number>();
  for (const ch of chunks) {
    if (ch.start > winStart && ch.start < winEnd) boundaries.add(ch.start);
    if (ch.end > winStart && ch.end < winEnd) boundaries.add(ch.end);
  }

  const points = Array.from(new Set([winStart, span.start, span.end, ...boundaries, winEnd])).sort(
    (a, b) => a - b
  );

  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const segStart = points[i];
    const segEnd = points[i + 1];
    if (segEnd <= segStart) continue;
    segments.push({
      text: documentText.slice(segStart, segEnd),
      isGold: segStart >= span.start && segEnd <= span.end,
      boundaryBefore: boundaries.has(segStart) ? segStart : null,
    });
  }

  return { winStart, winEnd, segments };
}

function SpanView({
  documentText,
  span,
  chunks,
}: {
  documentText: string;
  span: GoldSpan;
  chunks: Chunk[];
}) {
  const { winStart, winEnd, segments } = buildSegments(documentText, span, chunks);

  return (
    <div className="rounded border border-slate-200 bg-white p-3 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
      <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">
        Characters {winStart}–{winEnd} of the document. Highlighted text is the required evidence;
        the red marker is where a chunk boundary cuts through it.
      </p>
      <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
        {winStart > 0 && <span aria-hidden="true">…</span>}
        {segments.map((seg, i) => (
          <span key={i}>
            {seg.boundaryBefore !== null && (
              <span
                aria-hidden="true"
                title={`Chunk boundary at character ${seg.boundaryBefore}`}
                className="mx-0.5 inline-block h-3 w-[3px] align-middle bg-red-500 dark:bg-red-400"
              />
            )}
            {seg.boundaryBefore !== null && <span className="sr-only"> chunk boundary </span>}
            {seg.isGold ? <mark>{seg.text}</mark> : seg.text}
          </span>
        ))}
        {winEnd < documentText.length && <span aria-hidden="true">…</span>}
      </p>
    </div>
  );
}

/**
 * The product's most important visual: for every severed span, shows the surrounding
 * document text with the gold evidence highlighted via <mark> and every chunk edge that
 * cuts through the window marked, so a reviewer can SEE the cut rather than infer it from
 * a number. Renders with plain React nodes and <mark> only — document text is untrusted
 * input, so no raw-HTML-injection API is ever used here.
 */
export function BoundaryInspector({ documentText, strategy, chunks, cases }: Props) {
  const severedCases = cases.filter((c) => c.severedSpans.length > 0);
  if (severedCases.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Boundary inspection — {strategy === "fixed-width" ? "baseline fixed-width" : "clause-aware"}{" "}
        chunking
      </h3>
      <div className="space-y-4">
        {severedCases.map((c) => (
          <div key={c.caseId} className="space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Case <span className="font-mono">{c.caseId}</span> — {c.question}
            </p>
            {c.severedSpans.map((span, i) => (
              <SpanView key={i} documentText={documentText} span={span} chunks={chunks} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
