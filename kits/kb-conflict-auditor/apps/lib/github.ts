/**
 * Fetch the documentation files of a public GitHub repo and shape them into the
 * `documents_json` payload the audit-kb flow expects: [{ path, content }, ...].
 *
 * One REST call lists the repo tree; file contents come from raw.githubusercontent.com,
 * so a whole docs folder costs 2-3 REST calls (unauthenticated limit: 60 per hour per IP).
 * Pass a token (GITHUB_TOKEN) to raise that limit or to read private repos.
 */

export interface RepoRef {
  owner: string;
  repo: string;
  ref?: string;
  path: string;
}

export interface DocFile {
  path: string;
  content: string;
}

export interface FetchDocsOptions {
  token?: string;
  fetchImpl?: typeof fetch;
  maxFiles?: number;
  maxFileBytes?: number;
  maxTotalBytes?: number;
  extensions?: string[];
  concurrency?: number;
}

export interface SkippedFile {
  path: string;
  reason: string;
}

export interface FetchDocsResult {
  repo: string;
  ref: string;
  path: string;
  documents: DocFile[];
  skipped: SkippedFile[];
  truncated: boolean;
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

const NAME = /^[A-Za-z0-9_.-]+$/;

/**
 * Accepts https://github.com/owner/repo, .../tree/<branch>/<path>, github.com/owner/repo or owner/repo.
 * A branch name containing "/" is ambiguous inside a URL; pass it via `ref` instead.
 */
export function parseRepoUrl(input: string): RepoRef | null {
  let s = input.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (/^(www\.)?github\.com\//i.test(s)) s = s.replace(/^(www\.)?github\.com\//i, '');
  else if (/^[^/]+\.[^/]+\//.test(s)) return null; // some other host

  const parts = s.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, '');
  if (!NAME.test(owner) || !NAME.test(repo)) return null;

  if (parts.length === 2) return { owner, repo, path: '' };
  if (parts[2] === 'tree' && parts.length >= 4) {
    try {
      return { owner, repo, ref: decodeURIComponent(parts[3]), path: parts.slice(4).map(decodeURIComponent).join('/') };
    } catch {
      return null;
    }
  }
  return null;
}

const byteLength = (s: string): number => new TextEncoder().encode(s).length;

async function readTextWithinLimit(response: Response, maxBytes: number): Promise<string | null> {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await response.body?.cancel();
    return null;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    return byteLength(text) <= maxBytes ? text : null;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const content = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    content.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(content);
}

const headers = (token?: string): Record<string, string> => ({
  Accept: 'application/vnd.github+json',
  'User-Agent': 'kb-conflict-auditor',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function getJson<T>(f: typeof fetch, url: string, token?: string): Promise<T> {
  const res = await f(url, { headers: headers(token) });
  if (res.status === 404) throw new GitHubError('Repository or branch not found. If the repo is private, pass a GitHub token.', 404);
  if ((res.status === 403 || res.status === 429) && res.headers.get('x-ratelimit-remaining') === '0') {
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    const when = reset ? ` Try again after ${new Date(reset * 1000).toISOString()}.` : '';
    throw new GitHubError(`GitHub rate limit reached.${when} Set GITHUB_TOKEN to raise the limit.`, res.status);
  }
  if (!res.ok) throw new GitHubError(`GitHub returned HTTP ${res.status}.`, res.status);
  return (await res.json()) as T;
}

interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

export async function fetchDocs(target: RepoRef, options: FetchDocsOptions = {}): Promise<FetchDocsResult> {
  const f = options.fetchImpl ?? fetch;
  const maxFiles = options.maxFiles ?? 60;
  const maxFileBytes = options.maxFileBytes ?? 100_000;
  const maxTotalBytes = options.maxTotalBytes ?? 1_000_000;
  const extensions = (options.extensions ?? ['.md', '.mdx', '.txt']).map((e) => e.toLowerCase());
  const concurrency = options.concurrency ?? 8;
  const { owner, repo, token } = { ...target, token: options.token };

  let ref = target.ref;
  if (!ref) {
    const info = await getJson<{ default_branch: string }>(f, `https://api.github.com/repos/${owner}/${repo}`, token);
    ref = info.default_branch;
  }

  const tree = await getJson<{ tree: TreeEntry[]; truncated?: boolean }>(
    f,
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
    token,
  );

  const blobs = tree.tree.filter((e) => e.type === 'blob' && extensions.some((x) => e.path.toLowerCase().endsWith(x)));
  // No path given: prefer a top-level docs/ folder, otherwise scan the whole repo.
  let path = target.path.replace(/^\/+|\/+$/g, '');
  if (!path && blobs.some((e) => e.path.startsWith('docs/'))) path = 'docs';
  const inScope = blobs.filter((e) => !path || e.path === path || e.path.startsWith(path + '/')).sort((a, b) => a.path.localeCompare(b.path));

  const skipped: SkippedFile[] = [];
  let truncated = Boolean(tree.truncated);
  const candidates: TreeEntry[] = [];
  for (const e of inScope) {
    if ((e.size ?? 0) > maxFileBytes) skipped.push({ path: e.path, reason: `larger than ${maxFileBytes} bytes` });
    else candidates.push(e);
  }
  const chosen = candidates.slice(0, maxFiles);
  candidates.slice(maxFiles).forEach((e) => skipped.push({ path: e.path, reason: `file limit of ${maxFiles} reached` }));
  if (candidates.length > maxFiles) truncated = true;

  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURI(ref)}`;
  const results: (DocFile | null)[] = new Array(chosen.length).fill(null);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < chosen.length) {
      const i = next++;
      const entry = chosen[i];
      try {
        const res = await f(`${rawBase}/${entry.path.split('/').map(encodeURIComponent).join('/')}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) {
          skipped.push({ path: entry.path, reason: `download failed (HTTP ${res.status})` });
          continue;
        }
        const content = await readTextWithinLimit(res, maxFileBytes);
        if (content === null) {
          skipped.push({ path: entry.path, reason: `larger than ${maxFileBytes} bytes` });
          continue;
        }
        results[i] = { path: entry.path, content };
      } catch {
        skipped.push({ path: entry.path, reason: 'download failed (network error)' });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, chosen.length) }, worker));

  const documents: DocFile[] = [];
  let total = 0;
  for (const d of results) {
    if (!d) continue;
    const size = byteLength(d.content);
    if (total + size > maxTotalBytes) {
      skipped.push({ path: d.path, reason: `total size limit of ${maxTotalBytes} bytes reached` });
      truncated = true;
      continue;
    }
    total += size;
    documents.push(d);
  }

  return { repo: `${owner}/${repo}`, ref, path, documents, skipped, truncated };
}

/** The exact string the audit-kb flow expects in its `documents_json` input. */
export function toDocumentsJson(documents: DocFile[]): string {
  return JSON.stringify(documents.map(({ path, content }) => ({ path, content })));
}
