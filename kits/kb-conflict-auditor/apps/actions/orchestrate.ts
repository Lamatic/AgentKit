'use server';

import sampleResponse from '../../github-action/sample-response.json';
import { fetchDocs, GitHubError, parseRepoUrl, type SkippedFile, toDocumentsJson } from '../lib/github';
import { getAuditFlowId, getFlowEnvKey, isDemoMode, lamaticClient } from '../lib/lamatic-client';
import { type AuditStats, extractResult, type Finding, validateDocumentsJson } from '../lib/result';

export interface AuditDocsInput {
  repoUrl?: string;
  documentsJson?: string;
}

export interface AuditSource {
  repo: string;
  ref: string;
  path: string;
  skipped: SkippedFile[];
  truncated: boolean;
}

export interface AuditDocsResult {
  findings: Finding[];
  stats: AuditStats;
  candidate_count: number;
  total_found: number;
  truncated: boolean;
  docs_scanned: number;
  source: AuditSource;
  demo: boolean;
  error?: string;
}

const EMPTY_SOURCE: AuditSource = {
  repo: '',
  ref: '',
  path: '',
  skipped: [],
  truncated: false,
};

function redactEnvValues(text: string): string {
  let clean = text;
  const secretKeys = [
    'LAMATIC_API_URL',
    'LAMATIC_PROJECT_ID',
    'LAMATIC_API_KEY',
    getFlowEnvKey(),
    'AUDIT_KB_FLOW_ID',
    'GITHUB_TOKEN',
  ];
  for (const key of secretKeys) {
    const val = process.env[key]?.trim();
    if (val && val.length >= 4) {
      clean = clean.split(val).join('[REDACTED]');
    }
  }
  return clean;
}

function toFriendlyError(err: unknown, stage: 'github' | 'lamatic'): string {
  if (err instanceof GitHubError) {
    return redactEnvValues(err.message);
  }
  if (err instanceof Error) {
    const msg = err.message || '';
    const lower = msg.toLowerCase();
    if (
      lower.includes('fetch failed') ||
      lower.includes('econnrefused') ||
      lower.includes('enotfound') ||
      lower.includes('etimedout') ||
      lower.includes('network')
    ) {
      return stage === 'github'
        ? 'Unable to reach GitHub. Please check your internet connection and try again.'
        : 'The Lamatic audit flow could not be reached. Please verify your network connection and Lamatic endpoint configuration.';
    }
    if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('api key')) {
      return stage === 'github'
        ? 'GitHub authentication failed or rate limit was reached. Check GITHUB_TOKEN if configured.'
        : 'Lamatic authentication failed. Please check your Lamatic API credentials in .env.local.';
    }
    return redactEnvValues(msg);
  }
  return 'An unexpected error occurred while running the documentation audit.';
}

function failResult(error: string, source: AuditSource = EMPTY_SOURCE): AuditDocsResult {
  return {
    findings: [],
    stats: {},
    candidate_count: 0,
    total_found: 0,
    truncated: false,
    docs_scanned: 0,
    source,
    demo: false,
    error: redactEnvValues(error),
  };
}

export async function auditDocs(input: AuditDocsInput): Promise<AuditDocsResult> {
  const repoUrl = input?.repoUrl?.trim() ?? '';
  const rawDocumentsJson = input?.documentsJson?.trim() ?? '';

  let payloadDocumentsJson = '';
  let source: AuditSource = { ...EMPTY_SOURCE };

  if (repoUrl) {
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      return failResult(
        'Invalid GitHub repository URL. Expected https://github.com/owner/repo, https://github.com/owner/repo/tree/main/docs, or owner/repo.',
      );
    }

    try {
      const token = process.env.GITHUB_TOKEN?.trim() || undefined;
      const fetched = await fetchDocs(parsed, { token });
      source = {
        repo: fetched.repo,
        ref: fetched.ref,
        path: fetched.path,
        skipped: fetched.skipped,
        truncated: fetched.truncated,
      };

      if (fetched.documents.length === 0) {
        return failResult(
          `No documentation files (.md, .mdx, .txt) were found in ${fetched.repo}${fetched.path ? `/${fetched.path}` : ''}.`,
          source,
        );
      }

      payloadDocumentsJson = toDocumentsJson(fetched.documents);
    } catch (err) {
      return failResult(toFriendlyError(err, 'github'), source);
    }
  } else if (rawDocumentsJson) {
    const validated = validateDocumentsJson(rawDocumentsJson);
    if ('error' in validated) {
      return failResult(validated.error);
    }
    payloadDocumentsJson = toDocumentsJson(validated.documents);
    source = {
      repo: 'pasted-json',
      ref: '',
      path: '',
      skipped: [],
      truncated: false,
    };
  } else {
    return failResult('Please enter a GitHub repository URL or paste a JSON array of documents.');
  }

  // Demo mode: when LAMATIC_* env vars or flow ID are missing, return sample-response.json with demo: true
  if (isDemoMode()) {
    const sample = extractResult(sampleResponse);
    if (!sample) {
      return failResult('Sample response data could not be loaded.', source);
    }
    return {
      findings: sample.findings,
      stats: sample.stats,
      candidate_count: sample.candidate_count,
      total_found: sample.total_found,
      truncated: sample.truncated,
      docs_scanned: sample.docs_scanned,
      source,
      demo: true,
    };
  }

  try {
    const flowId = getAuditFlowId();
    if (!flowId) {
      return failResult(`Flow ID environment variable (${getFlowEnvKey()}) is not set.`, source);
    }

    const rawResponse = await lamaticClient.executeFlow(flowId, {
      documents_json: payloadDocumentsJson,
    });

    const sdkStatus = (rawResponse as { status?: string; message?: string; statusCode?: number } | null)?.status;
    if (sdkStatus === 'error') {
      const statusCode = (rawResponse as { statusCode?: number })?.statusCode;
      if (statusCode === 401 || statusCode === 403) {
        return failResult(
          'Lamatic authentication failed. Please check your Lamatic API credentials in .env.local.',
          source,
        );
      }
      return failResult(
        'The Lamatic audit flow could not be reached or returned an error. Verify that the audit-kb flow is deployed.',
        source,
      );
    }

    const normalized = extractResult(rawResponse);
    if (!normalized) {
      return failResult('The Lamatic audit flow returned an unexpected response shape.', source);
    }

    return {
      findings: normalized.findings,
      stats: normalized.stats,
      candidate_count: normalized.candidate_count,
      total_found: normalized.total_found,
      truncated: normalized.truncated,
      docs_scanned: normalized.docs_scanned,
      source,
      demo: false,
    };
  } catch (err) {
    return failResult(toFriendlyError(err, 'lamatic'), source);
  }
}
