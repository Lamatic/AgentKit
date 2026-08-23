/**
 * EvidenceFit deterministic engine.
 *
 * ZERO IMPORTS BY DESIGN. This file is vendored verbatim into the Lamatic code
 * nodes under ../../scripts/, which cannot resolve imports. The parity test at
 * apps/__tests__/vendor-parity.test.ts fails if any copy drifts from this
 * original, so a stale vendored block becomes a failing test rather than a
 * silently wrong number.
 *
 * Conventions used throughout:
 *   - Every interval is half-open: [start, end).
 *   - Every rate carries its integer numerator and denominator so callers and
 *     tests can assert on exact counts instead of floating-point values.
 *   - Malformed or ambiguous input is reported as an issue, never guessed at.
 */

// ---- Core types --------------------------------------------------------

export type Span = { start: number; end: number };
export type GoldSpan = Span & { quote: string };
export type StrategyName = "fixed-width" | "clause-aware";

export type Chunk = {
  chunkId: string;
  documentId: string;
  strategy: StrategyName;
  start: number;
  end: number;
  text: string;
};

/** A ratio that keeps its integer components, so tests never compare floats. */
export type Rate = { numerator: number; denominator: number; rate: number };

// ---- Interval arithmetic -----------------------------------------------

/**
 * Sorts, merges and normalises spans. Exactly adjacent spans coalesce, because
 * [0,5) and [5,9) describe one contiguous run of nine characters. Empty spans
 * are dropped. The input array is never mutated.
 */
export function mergeSpans(spans: Span[]): Span[] {
  const kept = spans.filter((s) => s.end > s.start);
  if (kept.length === 0) return [];

  const sorted = kept.slice().sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Span[] = [{ start: sorted[0].start, end: sorted[0].end }];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = out[out.length - 1];
    if (cur.start <= last.end) {
      if (cur.end > last.end) last.end = cur.end;
    } else {
      out.push({ start: cur.start, end: cur.end });
    }
  }
  return out;
}

/** Total distinct characters covered, counting overlapping regions only once. */
export function unionLength(spans: Span[]): number {
  let total = 0;
  for (const s of mergeSpans(spans)) total += s.end - s.start;
  return total;
}

/** True when the spans share at least one character. Adjacent spans do not. */
export function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

/** True when `inner` lies wholly within `outer`, edges inclusive. */
export function contains(outer: Span, inner: Span): boolean {
  return outer.start <= inner.start && inner.end <= outer.end;
}

/** Number of characters the two spans share. */
export function intersectLength(a: Span, b: Span): number {
  const lo = a.start > b.start ? a.start : b.start;
  const hi = a.end < b.end ? a.end : b.end;
  return hi > lo ? hi - lo : 0;
}

/** Builds a Rate, treating an empty denominator as 0 rather than NaN. */
export function makeRate(numerator: number, denominator: number): Rate {
  return {
    numerator,
    denominator,
    rate: denominator === 0 ? 0 : numerator / denominator,
  };
}

// ---- Experiment input types --------------------------------------------

export type EvidenceSpanInput = { quote: string; start?: number; end?: number };

export type AcceptanceCaseInput = {
  id: string;
  question: string;
  evidence: EvidenceSpanInput[];
  /** Defaults to true. Only required cases can force a BLOCK or TUNE verdict. */
  required?: boolean;
};

export type ResolvedCase = {
  id: string;
  question: string;
  required: boolean;
  spans: GoldSpan[];
};

export type IssueCode =
  | "empty_quote"
  | "no_evidence"
  | "quote_not_found"
  | "ambiguous_quote"
  | "offset_mismatch"
  | "offset_out_of_bounds"
  | "duplicate_case_id"
  | "alignment_error";

export type ValidationIssue = {
  code: IssueCode;
  message: string;
  caseId?: string;
  quote?: string;
};

export type ResolveResult =
  | { ok: true; cases: ResolvedCase[] }
  | { ok: false; issues: ValidationIssue[] };

// ---- Gold-span resolution (shared spec §7.1) ---------------------------

/**
 * Every occurrence offset, including overlapping ones — "aa" occurs twice in
 * "aaa". Overlapping repeats still make a quote ambiguous, so they must be
 * counted rather than skipped.
 */
export function findAllOccurrences(haystack: string, needle: string): number[] {
  if (needle.length === 0) return [];
  const out: number[] = [];
  let from = 0;
  for (;;) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) break;
    out.push(idx);
    from = idx + 1;
  }
  return out;
}

/**
 * Turns operator-supplied evidence quotes into verified character ranges.
 *
 * A quote with explicit offsets must satisfy documentText.slice(start, end)
 * === quote. A quote without offsets must occur exactly once. Anything else is
 * an invalid experiment, reported in full so the operator can fix every problem
 * in one pass rather than one error at a time.
 */
export function resolveGoldSpans(
  documentText: string,
  cases: AcceptanceCaseInput[]
): ResolveResult {
  const issues: ValidationIssue[] = [];
  const resolved: ResolvedCase[] = [];
  const seenIds = new Set<string>();

  for (const c of cases) {
    if (seenIds.has(c.id)) {
      issues.push({
        code: "duplicate_case_id",
        message: `Case id "${c.id}" appears more than once. Case ids must be unique.`,
        caseId: c.id,
      });
      continue;
    }
    seenIds.add(c.id);

    if (!c.evidence || c.evidence.length === 0) {
      issues.push({
        code: "no_evidence",
        message: `Case "${c.id}" has no evidence spans. Add at least one supporting quote.`,
        caseId: c.id,
      });
      continue;
    }

    const spans: GoldSpan[] = [];

    for (const ev of c.evidence) {
      if (typeof ev.quote !== "string" || ev.quote.length === 0) {
        issues.push({
          code: "empty_quote",
          message: `Case "${c.id}" has an empty evidence quote.`,
          caseId: c.id,
        });
        continue;
      }

      const hasOffsets = typeof ev.start === "number" && typeof ev.end === "number";

      if (hasOffsets) {
        const start = ev.start as number;
        const end = ev.end as number;

        if (
          !Number.isInteger(start) ||
          !Number.isInteger(end) ||
          start < 0 ||
          end > documentText.length ||
          end <= start
        ) {
          issues.push({
            code: "offset_out_of_bounds",
            message:
              `Case "${c.id}": offsets [${start}, ${end}) are not a valid range within a ` +
              `document of length ${documentText.length}. Offsets must be integers with ` +
              `0 <= start < end <= length.`,
            caseId: c.id,
            quote: ev.quote,
          });
          continue;
        }

        if (documentText.slice(start, end) !== ev.quote) {
          issues.push({
            code: "offset_mismatch",
            message:
              `Case "${c.id}": documentText.slice(${start}, ${end}) does not equal the ` +
              `supplied quote. Correct the offsets, or remove them to locate the quote by text.`,
            caseId: c.id,
            quote: ev.quote,
          });
          continue;
        }

        spans.push({ start, end, quote: ev.quote });
        continue;
      }

      const hits = findAllOccurrences(documentText, ev.quote);

      if (hits.length === 0) {
        issues.push({
          code: "quote_not_found",
          message:
            `Case "${c.id}": the quote was not found in the document. Evidence must be ` +
            `copied verbatim, including punctuation and whitespace.`,
          caseId: c.id,
          quote: ev.quote,
        });
        continue;
      }

      if (hits.length > 1) {
        issues.push({
          code: "ambiguous_quote",
          message:
            `Case "${c.id}": the quote appears ${hits.length} times. Supply explicit start ` +
            `and end offsets to disambiguate — EvidenceFit never guesses which occurrence ` +
            `you meant.`,
          caseId: c.id,
          quote: ev.quote,
        });
        continue;
      }

      spans.push({ start: hits[0], end: hits[0] + ev.quote.length, quote: ev.quote });
    }

    // A case only survives if every one of its quotes resolved.
    if (spans.length === c.evidence.length) {
      resolved.push({
        id: c.id,
        question: c.question,
        required: c.required !== false,
        spans,
      });
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, cases: resolved };
}

// ---- Chunking (shared spec §6) -----------------------------------------

export type FixedWidthConfig = { size: number; overlap: number };
export type ClauseConfig = { maxSize: number };

/**
 * V1 compares exactly two strategies using explicit constants rather than a
 * plugin framework (shared spec §6). These mirror the settings used in the
 * public rag-eval-harness experiments so the comparison is reproducible.
 */
export const FIXED_WIDTH_CONFIG: FixedWidthConfig = { size: 500, overlap: 50 };
export const CLAUSE_CONFIG: ClauseConfig = { maxSize: 500 };

/** Characters that end a clause. A newline counts, so lists and headings split. */
const CLAUSE_TERMINATORS = new Set([".", ";", "?", "!", "\n"]);
const TRAILING_WHITESPACE = new Set([" ", "\n", "\t", "\r"]);

/**
 * Baseline strategy: fixed-width windows with overlap, ignoring sentence and
 * clause structure. This is what severs evidence spans in practice.
 */
export function fixedWidthChunks(
  text: string,
  documentId: string,
  cfg: FixedWidthConfig
): Chunk[] {
  if (cfg.overlap >= cfg.size) {
    throw new Error(
      `Invalid chunk config: overlap (${cfg.overlap}) must be smaller than size (${cfg.size}).`
    );
  }
  if (text.length === 0) return [];

  const stride = cfg.size - cfg.overlap;
  const chunks: Chunk[] = [];
  let i = 0;
  let n = 0;

  while (i < text.length) {
    const end = Math.min(i + cfg.size, text.length);
    chunks.push({
      chunkId: `fixed-${n}`,
      documentId,
      strategy: "fixed-width",
      start: i,
      end,
      text: text.slice(i, end),
    });
    n++;
    if (end === text.length) break;
    i += stride;
  }

  return chunks;
}

/**
 * Candidate strategy: split on clause terminators, then greedily pack whole
 * clauses up to maxSize. A clause longer than maxSize is hard-split, which is
 * the only case in which this strategy can sever a span.
 */
export function clauseAwareChunks(
  text: string,
  documentId: string,
  cfg: ClauseConfig
): Chunk[] {
  if (text.length === 0) return [];

  // 1. Find clause boundaries, keeping the terminator and any trailing
  //    whitespace attached to the clause it closes, so the spans partition the
  //    document exactly with no gaps.
  const clauses: Span[] = [];
  let clauseStart = 0;
  for (let i = 0; i < text.length; i++) {
    if (!CLAUSE_TERMINATORS.has(text[i])) continue;
    let j = i + 1;
    while (j < text.length && TRAILING_WHITESPACE.has(text[j])) j++;
    clauses.push({ start: clauseStart, end: j });
    clauseStart = j;
    i = j - 1;
  }
  if (clauseStart < text.length) clauses.push({ start: clauseStart, end: text.length });

  // 2. Hard-split any single clause that cannot fit on its own.
  const units: Span[] = [];
  for (const c of clauses) {
    if (c.end - c.start <= cfg.maxSize) {
      units.push(c);
      continue;
    }
    for (let s = c.start; s < c.end; s += cfg.maxSize) {
      units.push({ start: s, end: Math.min(s + cfg.maxSize, c.end) });
    }
  }

  // 3. Greedily pack contiguous units without exceeding maxSize.
  const chunks: Chunk[] = [];
  let curStart = -1;
  let curEnd = -1;
  let n = 0;

  const flush = () => {
    if (curStart === -1) return;
    chunks.push({
      chunkId: `clause-${n}`,
      documentId,
      strategy: "clause-aware",
      start: curStart,
      end: curEnd,
      text: text.slice(curStart, curEnd),
    });
    n++;
    curStart = -1;
    curEnd = -1;
  };

  for (const u of units) {
    if (curStart === -1) {
      curStart = u.start;
      curEnd = u.end;
    } else if (u.end - curStart <= cfg.maxSize) {
      curEnd = u.end;
    } else {
      flush();
      curStart = u.start;
      curEnd = u.end;
    }
  }
  flush();

  return chunks;
}

// ---- Chunk alignment (shared spec §7.2) --------------------------------

export type AlignResult =
  | { ok: true; chunks: Chunk[] }
  | { ok: false; issues: ValidationIssue[] };

/**
 * Recovers verified character offsets for chunk texts produced by a chunker
 * that does not report them (Lamatic's chunkNode emits pageContent only, with
 * no offsets and no clause-terminator splitting mode).
 *
 * This is NOT on the deployed EvidenceFit path: the Index flow's code node
 * chunks documentText deterministically in-process via fixedWidthChunks() /
 * clauseAwareChunks() (see scripts/evidence-fit-index_prepare-chunks.ts), so
 * offsets are known by construction and there is nothing to recover. This
 * function is a utility for anyone who wires EvidenceFit's engine to an
 * externally-produced set of chunk texts — e.g. a Lamatic chunkNode, or any
 * other chunker that only returns text — and needs verified offsets back.
 *
 * The scan is monotonic: each chunk is located at or after the previous chunk's
 * start + 1. The +1 tolerates configured overlap while guaranteeing forward
 * progress and forbidding reordering. Every match is verified by slicing the
 * document back out and comparing it to the chunk text, so a chunker that
 * trims or normalises whitespace is caught rather than silently mis-aligned.
 *
 * If the chunk text occurs more than once at or after searchFrom, its true
 * placement is genuinely ambiguous — per shared spec §7.2, EvidenceFit does
 * not guess which occurrence was meant, so this is reported as an explicit
 * alignment_error rather than silently taking the first match.
 *
 * Failure yields an explicit alignment_error. Offsets are never estimated.
 */
export function alignChunks(
  documentText: string,
  chunkTexts: string[],
  documentId: string,
  strategy: StrategyName
): AlignResult {
  const chunks: Chunk[] = [];
  let searchFrom = 0;
  let n = 0;

  for (const raw of chunkTexts) {
    if (typeof raw !== "string" || raw.length === 0) continue;

    const idx = documentText.indexOf(raw, searchFrom);
    if (idx === -1) {
      return {
        ok: false,
        issues: [
          {
            code: "alignment_error",
            message:
              `Chunk ${n} could not be located in the source document at or after offset ` +
              `${searchFrom}. Chunk text must be a verbatim substring of the document; ` +
              `whitespace normalisation, trimming or reordering by the chunker breaks ` +
              `offset verification. EvidenceFit will not estimate offsets.`,
          },
        ],
      };
    }

    const end = idx + raw.length;
    if (documentText.slice(idx, end) !== raw) {
      return {
        ok: false,
        issues: [
          {
            code: "alignment_error",
            message: `Chunk ${n} failed slice verification at [${idx}, ${end}).`,
          },
        ],
      };
    }

    // The chunk text must be unique in the remaining document, or its true
    // placement is ambiguous and offsets cannot be verified.
    if (documentText.indexOf(raw, idx + 1) !== -1) {
      return {
        ok: false,
        issues: [
          {
            code: "alignment_error",
            message:
              `Chunk ${n}'s text is not unique in the document at or after offset ` +
              `${searchFrom}. It occurs more than once, so its true placement is ambiguous ` +
              `and offsets cannot be verified. EvidenceFit will not guess which occurrence ` +
              `you meant.`,
          },
        ],
      };
    }

    chunks.push({
      chunkId: `${strategy}-${n}`,
      documentId,
      strategy,
      start: idx,
      end,
      text: raw,
    });

    searchFrom = idx + 1;
    n++;
  }

  return { ok: true, chunks };
}

// ---- Metrics (shared spec §7.3) ----------------------------------------

export type IntegrityResult = {
  rate: Rate;
  boundarySeveredCount: number;
  severed: GoldSpan[];
};

/**
 * Chunks that could serve as evidence for a span: same document, and sharing at
 * least one character. Document identity is part of the test so a multi-document
 * collection can never leak a match across sources.
 */
export function relevantChunks(span: Span, chunks: Chunk[], documentId: string): Chunk[] {
  return chunks.filter((ch) => ch.documentId === documentId && overlaps(ch, span));
}

/**
 * spanIntegrityRate: share of gold spans wholly contained in at least one
 * chunk, measured before retrieval. A span that no single chunk contains has
 * been cut by a chunk boundary and can never be retrieved intact, no matter how
 * good the search is. This is the measurement the product exists to make.
 */
export function spanIntegrity(
  cases: ResolvedCase[],
  chunks: Chunk[],
  documentId: string
): IntegrityResult {
  const severed: GoldSpan[] = [];
  let total = 0;
  let intact = 0;

  for (const c of cases) {
    for (const span of c.spans) {
      total++;
      const held = chunks.some((ch) => ch.documentId === documentId && contains(ch, span));
      if (held) intact++;
      else severed.push(span);
    }
  }

  return { rate: makeRate(intact, total), boundarySeveredCount: severed.length, severed };
}

/**
 * spanCoverageAtK: share of unique gold characters covered by the union of the
 * top-k retrieved chunks. Both sides are merged first, so overlapping chunks
 * and overlapping gold spans are each counted once.
 *
 * k is applied after document filtering, so a foreign-document result cannot
 * consume a top-k slot.
 */
export function spanCoverageAtK(
  c: ResolvedCase,
  ranked: Chunk[],
  k: number,
  documentId: string
): Rate {
  const gold = mergeSpans(c.spans);
  const denominator = unionLength(gold);
  if (denominator === 0) return makeRate(0, 0);

  const topK = ranked.filter((ch) => ch.documentId === documentId).slice(0, k);
  const retrieved = mergeSpans(topK);

  let covered = 0;
  for (const g of gold) {
    for (const r of retrieved) covered += intersectLength(g, r);
  }

  return makeRate(covered, denominator);
}

/** True when every gold character of the case is covered by the given chunks. */
export function isCaseComplete(c: ResolvedCase, chunks: Chunk[], documentId: string): boolean {
  const cov = spanCoverageAtK(c, chunks, chunks.length, documentId);
  return cov.denominator > 0 && cov.numerator === cov.denominator;
}

/**
 * completeEvidenceRecallAtK: share of REQUIRED acceptance cases whose complete
 * evidence is present within the top-k retrieved chunks.
 *
 * This is the primary comparison metric. Raw Precision@k is deliberately not
 * used to compare strategies, because the relevant-chunk denominator changes
 * when chunk boundaries change, which makes the comparison meaningless.
 */
export function completeEvidenceRecallAtK(
  entries: { c: ResolvedCase; ranked: Chunk[] }[],
  k: number,
  documentId: string
): Rate {
  let denominator = 0;
  let numerator = 0;

  for (const e of entries) {
    if (!e.c.required) continue;
    denominator++;
    const topK = e.ranked.filter((ch) => ch.documentId === documentId).slice(0, k);
    if (isCaseComplete(e.c, topK, documentId)) numerator++;
  }

  return makeRate(numerator, denominator);
}

/**
 * firstCompleteEvidenceRank: the first 1-based rank at which all required
 * evidence for a case has been recovered, or null when it never is. Tells the
 * operator how much headroom a passing case actually has.
 */
export function firstCompleteEvidenceRank(
  c: ResolvedCase,
  ranked: Chunk[],
  documentId: string
): number | null {
  const scoped = ranked.filter((ch) => ch.documentId === documentId);
  const acc: Chunk[] = [];

  for (let i = 0; i < scoped.length; i++) {
    acc.push(scoped[i]);
    if (isCaseComplete(c, acc, documentId)) return i + 1;
  }

  return null;
}

// ---- Verdict (shared spec §7.4) ----------------------------------------

export type Verdict = "SHIP" | "TUNE" | "BLOCK";

export type VerdictInput = {
  /** Any invalid input, unresolvable quote, or alignment failure. */
  hasInvalidInput: boolean;
  /** Gold spans of REQUIRED cases cut by a chunk boundary. */
  requiredSeveredCount: number;
  /** REQUIRED cases lacking complete evidence within top-k. */
  incompleteRequiredCount: number;
};

/**
 * Deterministic, total, and pure.
 *
 * No model output participates in this decision. In the deployed flow the API
 * Response wires this value straight from the metrics code node, while the LLM
 * node reaches only a separate `explanation` field — so the model has no graph
 * path to the verdict and cannot override it even if instructed to.
 *
 * Precedence is strict: BLOCK > TUNE > SHIP. An experiment whose own inputs
 * cannot be trusted is BLOCK, never a retrieval failure.
 */
export function computeVerdict(v: VerdictInput): Verdict {
  if (v.hasInvalidInput) return "BLOCK";
  if (v.requiredSeveredCount > 0) return "BLOCK";
  if (v.incompleteRequiredCount > 0) return "TUNE";
  return "SHIP";
}

// ---- Evaluation --------------------------------------------------------

export type CaseResult = {
  caseId: string;
  question: string;
  required: boolean;
  spanCoverageAtK: Rate;
  firstCompleteEvidenceRank: number | null;
  complete: boolean;
  severedSpans: GoldSpan[];
};

export type StrategyResult = {
  strategy: StrategyName;
  chunkCount: number;
  spanIntegrityRate: Rate;
  boundarySeveredCount: number;
  spanCoverageAtK: Rate;
  completeEvidenceRecallAtK: Rate;
  verdict: Verdict;
  cases: CaseResult[];
  chunks: Chunk[];
};

export type EvaluateArgs = {
  documentId: string;
  documentText: string;
  cases: AcceptanceCaseInput[];
  strategy: StrategyName;
  chunkConfig: FixedWidthConfig | ClauseConfig;
  topK: number;
  /**
   * The deployed path supplies ranked vector-search results per case id. When
   * omitted, a deterministic local ranking is used instead so the offline demo
   * runs with no vector database configured.
   */
  rankedByCaseId?: Record<string, Chunk[]>;
};

export type EvaluateResult =
  | { ok: true; result: StrategyResult }
  | { ok: false; issues: ValidationIssue[] };

/**
 * Deterministic stand-in for vector search: rank chunks by how many gold
 * characters they contain. This is not a claim about semantic retrieval
 * quality — it is an upper bound that isolates the chunking question, which is
 * exactly what the offline demo is for. The deployed path replaces it with real
 * search results and reuses every metric unchanged.
 */
function localRank(c: ResolvedCase, chunks: Chunk[], documentId: string): Chunk[] {
  const gold = mergeSpans(c.spans);
  return chunks
    .filter((ch) => ch.documentId === documentId)
    .map((ch) => {
      let score = 0;
      for (const g of gold) score += intersectLength(ch, g);
      return { ch, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.ch.start - b.ch.start)
    .map((x) => x.ch);
}

export function evaluateStrategy(args: EvaluateArgs): EvaluateResult {
  const resolved = resolveGoldSpans(args.documentText, args.cases);
  if (!resolved.ok) return { ok: false, issues: resolved.issues };

  const chunks =
    args.strategy === "fixed-width"
      ? fixedWidthChunks(args.documentText, args.documentId, args.chunkConfig as FixedWidthConfig)
      : clauseAwareChunks(args.documentText, args.documentId, args.chunkConfig as ClauseConfig);

  const integrity = spanIntegrity(resolved.cases, chunks, args.documentId);
  const severedKeys = new Set(integrity.severed.map((s) => `${s.start}:${s.end}`));

  // Presence of `rankedByCaseId` means the deployed path supplied real search
  // results. A case id missing from that map means retrieval returned nothing
  // for it, which must yield an empty ranking — never the localRank oracle,
  // which ranks by gold-character overlap and would silently score a case
  // that retrieved nothing as perfectly retrieved. localRank is only used
  // when `rankedByCaseId` is entirely absent (the offline demo path).
  const entries = resolved.cases.map((c) => ({
    c,
    ranked: args.rankedByCaseId
      ? (args.rankedByCaseId[c.id] ?? [])
      : localRank(c, chunks, args.documentId),
  }));

  const caseResults: CaseResult[] = entries.map(({ c, ranked }) => {
    // Filter by document first, then truncate to k — the same order
    // spanCoverageAtK and firstCompleteEvidenceRank use internally, so a
    // foreign-document chunk can never consume a top-k slot for `complete`
    // while being excluded from coverage.
    const topK = ranked.filter((ch) => ch.documentId === args.documentId).slice(0, args.topK);
    return {
      caseId: c.id,
      question: c.question,
      required: c.required,
      spanCoverageAtK: spanCoverageAtK(c, ranked, args.topK, args.documentId),
      firstCompleteEvidenceRank: firstCompleteEvidenceRank(c, ranked, args.documentId),
      complete: isCaseComplete(c, topK, args.documentId),
      severedSpans: c.spans.filter((s) => severedKeys.has(`${s.start}:${s.end}`)),
    };
  });

  // Aggregate coverage across required cases, measured in characters so that a
  // case with more evidence weighs proportionally more.
  let covNum = 0;
  let covDen = 0;
  for (const cr of caseResults) {
    if (!cr.required) continue;
    covNum += cr.spanCoverageAtK.numerator;
    covDen += cr.spanCoverageAtK.denominator;
  }

  const requiredSeveredCount = caseResults
    .filter((cr) => cr.required)
    .reduce((n, cr) => n + cr.severedSpans.length, 0);
  const incompleteRequiredCount = caseResults.filter((cr) => cr.required && !cr.complete).length;

  return {
    ok: true,
    result: {
      strategy: args.strategy,
      chunkCount: chunks.length,
      spanIntegrityRate: integrity.rate,
      boundarySeveredCount: integrity.boundarySeveredCount,
      spanCoverageAtK: makeRate(covNum, covDen),
      completeEvidenceRecallAtK: completeEvidenceRecallAtK(entries, args.topK, args.documentId),
      // Resolution already succeeded, so input validity is settled here. The
      // deployed flow additionally folds in alignment failures before calling
      // computeVerdict.
      verdict: computeVerdict({
        hasInvalidInput: false,
        requiredSeveredCount,
        incompleteRequiredCount,
      }),
      cases: caseResults,
      chunks,
    },
  };
}

export type Comparison = {
  baseline: StrategyResult;
  candidate: StrategyResult;
  /**
   * The strategy to deploy. Verdict severity is decided first (SHIP beats
   * TUNE beats BLOCK); completeEvidenceRecallAtK.rate only breaks a tie
   * between two strategies that share the same verdict. A BLOCK strategy is
   * never recommended while a non-BLOCK alternative exists. When both
   * strategies are BLOCK, this is "neither".
   */
  recommended: StrategyName | "neither";
  /**
   * The verdict OF THE RECOMMENDED STRATEGY — so "SHIP" always means "the
   * recommended configuration ships", never "some other candidate happened to
   * be safe". When `recommended` is "neither", this is "BLOCK".
   */
  verdict: Verdict;
};

export type CompareResult =
  | { ok: true; comparison: Comparison }
  | { ok: false; issues: ValidationIssue[] };

const VERDICT_ORDER: Record<Verdict, number> = { SHIP: 0, TUNE: 1, BLOCK: 2 };

export function compareStrategies(args: {
  documentId: string;
  documentText: string;
  cases: AcceptanceCaseInput[];
  topK: number;
  rankedByStrategy?: Partial<Record<StrategyName, Record<string, Chunk[]>>>;
}): CompareResult {
  const baseline = evaluateStrategy({
    documentId: args.documentId,
    documentText: args.documentText,
    cases: args.cases,
    strategy: "fixed-width",
    chunkConfig: FIXED_WIDTH_CONFIG,
    topK: args.topK,
    rankedByCaseId: args.rankedByStrategy?.["fixed-width"],
  });
  if (!baseline.ok) return { ok: false, issues: baseline.issues };

  const candidate = evaluateStrategy({
    documentId: args.documentId,
    documentText: args.documentText,
    cases: args.cases,
    strategy: "clause-aware",
    chunkConfig: CLAUSE_CONFIG,
    topK: args.topK,
    rankedByCaseId: args.rankedByStrategy?.["clause-aware"],
  });
  if (!candidate.ok) return { ok: false, issues: candidate.issues };

  const b = baseline.result;
  const c = candidate.result;

  // Verdict severity decides `recommended` first — a BLOCK strategy is never
  // recommended while a non-BLOCK alternative exists, so the banner can never
  // read SHIP while the recommended candidate is actually unsafe. Only when
  // both strategies share the same verdict does complete-evidence recall
  // break the tie; raw Precision@k is never used for this because the
  // relevant-chunk denominator shifts when chunk boundaries change, which
  // would make the comparison meaningless (§7.3).
  let recommended: StrategyName | "neither";
  if (b.verdict === "BLOCK" && c.verdict === "BLOCK") {
    recommended = "neither";
  } else if (b.verdict !== c.verdict) {
    recommended = VERDICT_ORDER[b.verdict] < VERDICT_ORDER[c.verdict] ? "fixed-width" : "clause-aware";
  } else {
    const bScore = b.completeEvidenceRecallAtK.rate;
    const cScore = c.completeEvidenceRecallAtK.rate;
    recommended = bScore > cScore ? "fixed-width" : "clause-aware";
  }

  // The overall verdict is always the verdict OF THE RECOMMENDED strategy —
  // never simply the better of the two — so "SHIP" always means "the
  // recommended configuration ships".
  const verdict: Verdict =
    recommended === "neither" ? "BLOCK" : recommended === "fixed-width" ? b.verdict : c.verdict;

  return { ok: true, comparison: { baseline: b, candidate: c, recommended, verdict } };
}
