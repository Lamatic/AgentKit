import type { DocFile } from './github';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface DocEvidence {
  path: string;
  date?: string;
  line: number;
  heading?: string;
  text: string;
}

export interface PatchSuggestion {
  file_to_update: string;
  current_text: string;
  replacement_text: string;
}

export interface Finding {
  id: string;
  key: string;
  severity: Severity;
  summary: string;
  authoritative_source: string;
  authority_basis: string;
  authority_overridden?: boolean;
  reasoning?: string;
  evidence: {
    docA: DocEvidence;
    docB: DocEvidence;
  };
  patch: PatchSuggestion | null;
  patch_note: string;
}

export interface AuditStats {
  candidates?: number;
  judged?: number;
  confirmed?: number;
  dismissed?: number;
  discarded_unknown?: number;
  authority_overridden?: number;
  patches_withheld?: number;
  [key: string]: unknown;
}

export interface NormalizedAuditResult {
  findings: Finding[];
  stats: AuditStats;
  candidate_count: number;
  docs_scanned: number;
}

function findResult(v: unknown, depth = 0): Record<string, unknown> | null {
  if (typeof v === 'string') {
    try {
      return findResult(JSON.parse(v), depth + 1);
    } catch {
      return null;
    }
  }
  if (!v || typeof v !== 'object' || Array.isArray(v) || depth > 6) return null;
  const record = v as Record<string, unknown>;
  if ('findings' in record || 'candidate_count' in record) return record;
  for (const k of Object.keys(record)) {
    const r = findResult(record[k], depth + 1);
    if (r) return r;
  }
  return null;
}

/**
 * Pulls { findings, stats, candidate_count, docs_scanned } out of whatever envelope
 * the Lamatic SDK returns. `findings` can be an empty string when no candidates exist;
 * treat it as [].
 */
export function extractResult(response: unknown): NormalizedAuditResult | null {
  const r = findResult(response);
  if (!r) return null;

  let findings: unknown = r.findings;
  if (typeof findings === 'string') {
    const trimmed = findings.trim();
    if (!trimmed) {
      findings = [];
    } else {
      try {
        findings = JSON.parse(trimmed);
      } catch {
        findings = [];
      }
    }
  }

  let stats: unknown = r.stats;
  if (typeof stats === 'string') {
    const trimmed = stats.trim();
    if (!trimmed) {
      stats = {};
    } else {
      try {
        stats = JSON.parse(trimmed);
      } catch {
        stats = {};
      }
    }
  }

  return {
    findings: Array.isArray(findings) ? (findings as Finding[]) : [],
    stats: stats && typeof stats === 'object' && !Array.isArray(stats) ? (stats as AuditStats) : {},
    candidate_count: Number(r.candidate_count ?? 0) || 0,
    docs_scanned: Number(r.docs_scanned ?? 0) || 0,
  };
}

/**
 * Validates that a raw string is a non-empty JSON array of { path, content } objects.
 */
export function validateDocumentsJson(raw: string): { documents: DocFile[] } | { error: string } {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { error: 'Please paste a non-empty JSON array of { path, content } documents.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: 'Invalid JSON. Expected an array of { "path": "...", "content": "..." } objects.' };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { error: 'Documents JSON must be a non-empty array of { path, content } objects.' };
  }

  const documents: DocFile[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      typeof (item as Record<string, unknown>).path !== 'string' ||
      !(item as { path: string }).path.trim() ||
      typeof (item as Record<string, unknown>).content !== 'string'
    ) {
      return {
        error: `Invalid document at index ${i}: each item must be an object with a non-empty string "path" and string "content".`,
      };
    }
    documents.push({
      path: (item as { path: string }).path.trim(),
      content: (item as { content: string }).content,
    });
  }

  return { documents };
}
