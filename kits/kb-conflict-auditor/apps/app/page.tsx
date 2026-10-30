'use client';

import type React from 'react';
import { useRef, useState } from 'react';
import { type AuditDocsResult, auditDocs } from '../actions/orchestrate';
import type { DocEvidence, Finding, Severity } from '../lib/result';

type InputMode = 'repo' | 'json';

const SAMPLE_DOCS_JSON = JSON.stringify(
  [
    {
      path: 'docs/api.md',
      content: 'last_updated: 2026-01-15\n# API limits\nThe request timeout = 30s.\nmax_retries = 3\n',
    },
    {
      path: 'docs/sdk.md',
      content: 'last_updated: 2024-05-10\n# SDK defaults\nThe default request timeout is 60 seconds.\nmax_retries = 5\n',
    },
  ],
  null,
  2,
);

function severityClass(severity: Severity | string): string {
  switch (severity) {
    case 'Critical':
      return 'badge badge-critical';
    case 'High':
      return 'badge badge-high';
    case 'Low':
      return 'badge badge-low';
    default:
      return 'badge badge-medium';
  }
}

function EvidenceRow({ doc }: { doc: DocEvidence }) {
  return (
    <li className="evidence-item">
      <div className="evidence-meta">
        <span>{doc.path}</span>
        <span> (line {doc.line}</span>
        {doc.date ? <span>, updated {doc.date}</span> : null}
        <span>)</span>
        {doc.heading ? <span> — {doc.heading}</span> : null}
      </div>
      <code className="evidence-quote">{doc.text}</code>
    </li>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const { evidence, patch } = finding;
  const hasBasis = Boolean(finding.authority_basis && finding.authority_basis !== 'undetermined');

  return (
    <article className="finding-card" aria-label={`Conflict on ${finding.key}`}>
      <div className="finding-header">
        <span className={severityClass(finding.severity)}>{finding.severity || 'Medium'}</span>
        <code className="finding-key">{finding.key}</code>
      </div>

      <p className="finding-summary">{finding.summary}</p>

      {finding.reasoning ? (
        <p className="authority-line">{finding.reasoning}</p>
      ) : null}

      <ul className="evidence-list" aria-label="Conflicting document lines">
        {evidence?.docA ? <EvidenceRow doc={evidence.docA} /> : null}
        {evidence?.docB ? <EvidenceRow doc={evidence.docB} /> : null}
      </ul>

      <p className="authority-line">
        <strong>Authoritative source:</strong> {finding.authoritative_source || 'unclear'}
        {hasBasis ? ` (${finding.authority_basis})` : ''}
      </p>

      {patch ? (
        <pre className="diff-block" aria-label={`Suggested patch for ${patch.file_to_update}`}>
          <div className="diff-header">--- {patch.file_to_update}</div>
          <code className="diff-del">- {patch.current_text}</code>
          <code className="diff-add">+ {patch.replacement_text}</code>
        </pre>
      ) : finding.patch_note ? (
        <p className="patch-note">{finding.patch_note}</p>
      ) : null}
    </article>
  );
}

export default function KbConflictAuditorPage() {
  const [mode, setMode] = useState<InputMode>('repo');
  const [repoUrl, setRepoUrl] = useState('');
  const [documentsJson, setDocumentsJson] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AuditDocsResult | null>(null);
  const repoTabRef = useRef<HTMLButtonElement>(null);
  const jsonTabRef = useRef<HTMLButtonElement>(null);

  const canSubmit = mode === 'repo' ? repoUrl.trim().length > 0 : documentsJson.trim().length > 0;

  const changeMode = (nextMode: InputMode) => {
    setMode(nextMode);
    setError('');
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await auditDocs(
        mode === 'repo' ? { repoUrl: repoUrl.trim() } : { documentsJson: documentsJson.trim() },
      );

      if (response.error) {
        setError(response.error);
      } else {
        setResult(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete the audit.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleJson = () => {
    changeMode('json');
    setDocumentsJson(SAMPLE_DOCS_JSON);
  };

  const confirmedCount = result ? (result.stats.confirmed ?? result.findings.length) : 0;
  const hasSkippedOrTruncated = Boolean(
    result && (result.source.truncated || (result.source.skipped && result.source.skipped.length > 0)),
  );
  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const nextMode = mode === 'repo' ? 'json' : 'repo';
    changeMode(nextMode);
    (nextMode === 'repo' ? repoTabRef : jsonTabRef).current?.focus();
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1 className="page-title">KB Conflict Auditor</h1>
        <p className="page-subtitle">
          Extract numeric facts across documentation files, judge candidate conflicts with an AI model, and verify
          authority and patch targets by code. Suggested replacement text still needs human review.
        </p>
      </header>

      <section className="card" aria-label="Audit configuration">
        <div className="mode-tabs" role="tablist" aria-label="Document input method">
          <button
            type="button"
            role="tab"
            id="tab-repo"
            aria-controls="panel-repo"
            aria-selected={mode === 'repo'}
            tabIndex={mode === 'repo' ? 0 : -1}
            className="mode-tab"
            ref={repoTabRef}
            onKeyDown={handleTabKeyDown}
            onClick={() => changeMode('repo')}
          >
            GitHub Repo URL
          </button>
          <button
            type="button"
            role="tab"
            id="tab-json"
            aria-controls="panel-json"
            aria-selected={mode === 'json'}
            tabIndex={mode === 'json' ? 0 : -1}
            className="mode-tab"
            ref={jsonTabRef}
            onKeyDown={handleTabKeyDown}
            onClick={() => changeMode('json')}
          >
            Paste JSON
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'repo' ? (
            <div id="panel-repo" role="tabpanel" aria-labelledby="tab-repo" className="field-group">
              <label htmlFor="repoUrl" className="field-label">
                GitHub repository URL
              </label>
              <input
                id="repoUrl"
                name="repoUrl"
                type="url"
                className="text-input"
                placeholder="https://github.com/owner/repo/tree/main/docs"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isLoading}
                autoComplete="url"
              />
              <p className="field-hint">
                Accepts <code>https://github.com/owner/repo</code>, a specific branch/folder URL, or{' '}
                <code>owner/repo</code>. Reads <code>.md</code>, <code>.mdx</code>, and <code>.txt</code> files.
              </p>
            </div>
          ) : (
            <div id="panel-json" role="tabpanel" aria-labelledby="tab-json" className="field-group">
              <div className="field-label-row">
                <label htmlFor="documentsJson" className="field-label">
                  Documents JSON array
                </label>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleLoadSampleJson}
                  disabled={isLoading}
                >
                  Load sample JSON
                </button>
              </div>
              <textarea
                id="documentsJson"
                name="documentsJson"
                className="textarea-input"
                placeholder='[{"path": "docs/api.md", "content": "..."}, {"path": "docs/sdk.md", "content": "..."}]'
                value={documentsJson}
                onChange={(e) => setDocumentsJson(e.target.value)}
                disabled={isLoading}
              />
              <p className="field-hint">
                Provide a JSON array of objects with <code>path</code> and <code>content</code> strings.
              </p>
            </div>
          )}

          <div className="actions-row">
            <button type="submit" className="btn" disabled={!canSubmit || isLoading}>
              {isLoading ? 'Auditing documentation...' : 'Audit'}
            </button>
          </div>
        </form>

        {error ? (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        ) : null}
      </section>

      {result ? (
        <section className="results-section" aria-live="polite" aria-label="Audit results">
          {result.demo ? (
            <div className="banner banner-demo" role="status">
              <strong>Sample data (Demo mode):</strong> Lamatic environment variables (<code>LAMATIC_*</code> /{' '}
              <code>AUDIT_KB_FLOW_ID</code>) are not configured, so sample findings from{' '}
              <code>github-action/sample-response.json</code> are shown.
            </div>
          ) : null}

          {hasSkippedOrTruncated ? (
            <div className="banner banner-notice" role="status">
              <div>
                {result.source.truncated ? (
                  <span>
                    <strong>Truncated:</strong> Repository exceeded the file count or size limit; only a subset of files
                    was audited.{' '}
                  </span>
                ) : null}
                {result.source.skipped.length > 0 ? (
                  <span>
                    <strong>{result.source.skipped.length}</strong> file(s) were skipped.
                  </span>
                ) : null}
              </div>
              {result.source.skipped.length > 0 ? (
                <details>
                  <summary>View skipped files</summary>
                  <ul className="skipped-list">
                    {result.source.skipped.map((s) => (
                      <li key={s.path}>
                        <code>{s.path}</code> — {s.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          ) : null}

          {result.truncated ? (
            <div className="banner banner-notice" role="status">
              Candidate limit reached: <strong>{result.candidate_count}</strong> of{' '}
              <strong>{result.total_found}</strong> candidate pairs were sent for review (maximum 10).
            </div>
          ) : null}

          <div className="summary-bar">
            <div className="summary-metrics">
              <span>
                Docs scanned: <strong>{result.docs_scanned}</strong>
              </span>
              <span>
                Candidates: <strong>{result.candidate_count}</strong>
              </span>
              <span>
                Confirmed: <strong>{confirmedCount}</strong>
              </span>
            </div>
            {result.source.repo && result.source.repo !== 'pasted-json' ? (
              <span>
                Source: <code>{result.source.repo}</code>
                {result.source.ref ? ` @ ${result.source.ref}` : ''}
                {result.source.path ? ` (${result.source.path})` : ''}
              </span>
            ) : null}
          </div>

          {result.findings.length === 0 ? (
            <div className="card empty-state">
              <h3>No conflicting facts found</h3>
              <p>
                Only numbers with units (timeouts, sizes, limits, counts written as <code>name: value</code>,{' '}
                <code>name = value</code>, or <code>name is value</code>) are checked; prose is not judged.
              </p>
            </div>
          ) : (
            result.findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)
          )}
        </section>
      ) : null}
    </main>
  );
}
