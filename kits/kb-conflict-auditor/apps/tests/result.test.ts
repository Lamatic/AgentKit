import { describe, expect, it } from 'vitest';
import sampleResponse from '../../github-action/sample-response.json';
import { auditDocs } from '../actions/orchestrate';
import { extractResult, type Finding, validateDocumentsJson } from '../lib/result';

const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: 'c1',
  key: 'request_timeout',
  severity: 'High',
  summary: 'Timeout differs between API and SDK docs.',
  authoritative_source: 'docs/api.md',
  authority_basis: 'newer last_updated date',
  authority_overridden: false,
  evidence: {
    docA: { path: 'docs/api.md', date: '2026-01-15', line: 5, text: 'The request timeout = 30s.' },
    docB: { path: 'docs/sdk.md', date: '2024-05-10', line: 5, text: 'The default request timeout is 60 seconds.' },
  },
  patch: {
    file_to_update: 'docs/sdk.md',
    current_text: 'The default request timeout is 60 seconds.',
    replacement_text: 'The default request timeout is 30s.',
  },
  patch_note: '',
  ...overrides,
});

describe('extractResult', () => {
  it('normalizes a plain result object and sample-response.json', () => {
    const plain = {
      findings: [makeFinding()],
      stats: { confirmed: 1 },
      candidate_count: 1,
      docs_scanned: 2,
    };
    const res = extractResult(plain);
    expect(res).not.toBeNull();
    expect(res?.findings).toHaveLength(1);
    expect(res?.stats.confirmed).toBe(1);
    expect(res?.candidate_count).toBe(1);
    expect(res?.docs_scanned).toBe(2);

    const sample = extractResult(sampleResponse);
    expect(sample?.findings).toHaveLength(2);
    expect(sample?.docs_scanned).toBe(3);
  });

  it('unwraps nested SDK and GraphQL envelopes and stringified payloads', () => {
    const plain = {
      findings: JSON.stringify([makeFinding()]),
      stats: JSON.stringify({ confirmed: 1, candidates: 1 }),
      candidate_count: '1',
      docs_scanned: '4',
    };
    const sdkEnvelope = { status: 'success', result: plain, statusCode: 200 };
    expect(extractResult(sdkEnvelope)).toEqual({
      findings: [makeFinding()],
      stats: { confirmed: 1, candidates: 1 },
      candidate_count: 1,
      docs_scanned: 4,
    });

    const gqlEnvelope = {
      data: {
        executeWorkflow: {
          status: 'success',
          result: JSON.stringify(plain),
        },
      },
    };
    expect(extractResult(gqlEnvelope)?.candidate_count).toBe(1);
    expect(extractResult(gqlEnvelope)?.findings).toHaveLength(1);
  });

  it('treats an empty string findings or stats field as empty collection', () => {
    const noCandidates = {
      findings: '',
      stats: '',
      candidate_count: 0,
      docs_scanned: 3,
    };
    expect(extractResult(noCandidates)).toEqual({
      findings: [],
      stats: {},
      candidate_count: 0,
      docs_scanned: 3,
    });
  });

  it('returns null for null, primitives, or unrelated objects', () => {
    expect(extractResult(null)).toBeNull();
    expect(extractResult(undefined)).toBeNull();
    expect(extractResult('not json')).toBeNull();
    expect(extractResult({ unrelated: true })).toBeNull();
  });
});

describe('validateDocumentsJson', () => {
  it('accepts a valid array of { path, content } objects', () => {
    const raw = JSON.stringify([
      { path: 'docs/api.md', content: 'timeout = 30s' },
      { path: 'docs/sdk.md', content: 'timeout = 60s' },
    ]);
    const res = validateDocumentsJson(raw);
    expect('documents' in res && res.documents).toEqual([
      { path: 'docs/api.md', content: 'timeout = 30s' },
      { path: 'docs/sdk.md', content: 'timeout = 60s' },
    ]);
  });

  it('rejects empty, malformed, or invalid schema inputs', () => {
    expect('error' in validateDocumentsJson('')).toBe(true);
    expect('error' in validateDocumentsJson('not-json')).toBe(true);
    expect('error' in validateDocumentsJson('[]')).toBe(true);
    expect('error' in validateDocumentsJson('[{"path":"","content":"hi"}]')).toBe(true);
    expect('error' in validateDocumentsJson('[{"path":"docs/a.md"}]')).toBe(true);
  });
});

describe('auditDocs server action', () => {
  it('returns sample-response.json with demo: true when LAMATIC_* env vars are missing', async () => {
    const docs = JSON.stringify([
      { path: 'docs/api.md', content: 'timeout = 30s' },
      { path: 'docs/sdk.md', content: 'timeout = 60s' },
    ]);
    const res = await auditDocs({ documentsJson: docs });
    expect(res.error).toBeUndefined();
    expect(res.demo).toBe(true);
    expect(res.findings).toHaveLength(2);
    expect(res.docs_scanned).toBe(3);
    expect(res.candidate_count).toBe(2);
    expect(res.source).toEqual({
      repo: 'pasted-json',
      ref: '',
      path: '',
      skipped: [],
      truncated: false,
    });
  });

  it('returns friendly validation errors for invalid repoUrl or documentsJson', async () => {
    const badRepo = await auditDocs({ repoUrl: 'https://gitlab.com/acme/widgets' });
    expect(badRepo.error).toMatch(/invalid github repository url/i);

    const badJson = await auditDocs({ documentsJson: '{"not":"an-array"}' });
    expect(badJson.error).toMatch(/non-empty array/i);
  });
});
