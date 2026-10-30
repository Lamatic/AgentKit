import { describe, expect, it } from 'vitest';
import { fetchDocs, GitHubError, parseRepoUrl, toDocumentsJson } from '../lib/github';

type Reply = { status?: number; json?: unknown; text?: string; headers?: Record<string, string> };

function fakeFetch(routes: Record<string, Reply>, seen: { url: string; headers: Record<string, string> }[] = []): typeof fetch {
  return (async (url: string, init?: { headers?: Record<string, string> }) => {
    seen.push({ url, headers: init?.headers ?? {} });
    const r = routes[url];
    if (!r) return new Response('not found', { status: 404 });
    return new Response(r.json !== undefined ? JSON.stringify(r.json) : (r.text ?? ''), { status: r.status ?? 200, headers: r.headers });
  }) as unknown as typeof fetch;
}

const TREE = 'https://api.github.com/repos/acme/widgets/git/trees/main?recursive=1';
const INFO = 'https://api.github.com/repos/acme/widgets';
const raw = (p: string) => `https://raw.githubusercontent.com/acme/widgets/main/${p}`;

const tree = (entries: { path: string; size?: number; type?: string }[], truncated = false) => ({
  json: { truncated, tree: entries.map((e) => ({ type: 'blob', size: 100, ...e })) },
});

describe('parseRepoUrl', () => {
  it('parses plain repo URLs and shorthands', () => {
    expect(parseRepoUrl('https://github.com/acme/widgets')).toEqual({ owner: 'acme', repo: 'widgets', path: '' });
    expect(parseRepoUrl('github.com/acme/widgets.git/')).toEqual({ owner: 'acme', repo: 'widgets', path: '' });
    expect(parseRepoUrl('acme/widgets')).toEqual({ owner: 'acme', repo: 'widgets', path: '' });
  });
  it('parses tree URLs with a branch and folder', () => {
    expect(parseRepoUrl('https://github.com/acme/widgets/tree/dev/docs/guides')).toEqual({ owner: 'acme', repo: 'widgets', ref: 'dev', path: 'docs/guides' });
  });
  it('rejects other hosts and junk', () => {
    expect(parseRepoUrl('https://gitlab.com/acme/widgets')).toBeNull();
    expect(parseRepoUrl('https://github.com/acme/widgets/blob/main/docs/api.md')).toBeNull();
    expect(parseRepoUrl('https://github.com/acme/widgets/tree/%E0%A4%A/docs')).toBeNull();
    expect(parseRepoUrl('widgets')).toBeNull();
    expect(parseRepoUrl('acme/wid gets')).toBeNull();
  });
});

describe('fetchDocs', () => {
  const target = { owner: 'acme', repo: 'widgets', path: '' };

  it('uses the default branch, prefers docs/, filters extensions and returns contents', async () => {
    const f = fakeFetch({
      [INFO]: { json: { default_branch: 'main' } },
      [TREE]: tree([{ path: 'README.md' }, { path: 'docs/api.md' }, { path: 'docs/sdk.mdx' }, { path: 'docs/logo.png' }, { path: 'src/index.ts' }]),
      [raw('docs/api.md')]: { text: 'timeout = 30s' },
      [raw('docs/sdk.mdx')]: { text: 'timeout = 60s' },
    });
    const r = await fetchDocs(target, { fetchImpl: f });
    expect(r.ref).toBe('main');
    expect(r.path).toBe('docs');
    expect(r.documents.map((d) => d.path)).toEqual(['docs/api.md', 'docs/sdk.mdx']);
    expect(r.truncated).toBe(false);
  });

  it('scans the whole repo when there is no docs folder', async () => {
    const f = fakeFetch({
      [INFO]: { json: { default_branch: 'main' } },
      [TREE]: tree([{ path: 'README.md' }, { path: 'guide/setup.md' }]),
      [raw('README.md')]: { text: 'a' },
      [raw('guide/setup.md')]: { text: 'b' },
    });
    const r = await fetchDocs(target, { fetchImpl: f });
    expect(r.documents).toHaveLength(2);
  });

  it('honours an explicit path and ref without calling the repo info endpoint', async () => {
    const seen: { url: string; headers: Record<string, string> }[] = [];
    const f = fakeFetch(
      {
        'https://api.github.com/repos/acme/widgets/git/trees/main?recursive=1': tree([{ path: 'docs/a.md' }, { path: 'other/b.md' }]),
        [raw('other/b.md')]: { text: 'b' },
      },
      seen,
    );
    const r = await fetchDocs({ ...target, ref: 'main', path: 'other' }, { fetchImpl: f });
    expect(r.documents.map((d) => d.path)).toEqual(['other/b.md']);
    expect(seen.some((s) => s.url === INFO)).toBe(false);
  });

  it('skips big files and enforces the file limit', async () => {
    const f = fakeFetch({
      [INFO]: { json: { default_branch: 'main' } },
      [TREE]: tree([{ path: 'docs/big.md', size: 999_999 }, { path: 'docs/a.md' }, { path: 'docs/b.md' }, { path: 'docs/c.md' }]),
      [raw('docs/a.md')]: { text: 'a' },
      [raw('docs/b.md')]: { text: 'b' },
    });
    const r = await fetchDocs(target, { fetchImpl: f, maxFiles: 2 });
    expect(r.documents.map((d) => d.path)).toEqual(['docs/a.md', 'docs/b.md']);
    expect(r.skipped.map((s) => s.path).sort()).toEqual(['docs/big.md', 'docs/c.md']);
    expect(r.truncated).toBe(true);
  });

  it('enforces the total size limit', async () => {
    const f = fakeFetch({
      [INFO]: { json: { default_branch: 'main' } },
      [TREE]: tree([{ path: 'docs/a.md' }, { path: 'docs/b.md' }]),
      [raw('docs/a.md')]: { text: 'x'.repeat(60) },
      [raw('docs/b.md')]: { text: 'y'.repeat(60) },
    });
    const r = await fetchDocs(target, { fetchImpl: f, maxTotalBytes: 100 });
    expect(r.documents).toHaveLength(1);
    expect(r.truncated).toBe(true);
  });

  it('enforces maxFileBytes against the downloaded response body', async () => {
    const f = fakeFetch({
      [INFO]: { json: { default_branch: 'main' } },
      [TREE]: tree([{ path: 'docs/large.md' }]),
      [raw('docs/large.md')]: { text: 'é'.repeat(60) },
    });
    const r = await fetchDocs(target, { fetchImpl: f, maxFileBytes: 100 });
    expect(r.documents).toHaveLength(0);
    expect(r.skipped).toEqual([{ path: 'docs/large.md', reason: 'larger than 100 bytes' }]);
  });

  it('reports a failed download as skipped, not as a crash', async () => {
    const f = fakeFetch({
      [INFO]: { json: { default_branch: 'main' } },
      [TREE]: tree([{ path: 'docs/a.md' }, { path: 'docs/gone.md' }]),
      [raw('docs/a.md')]: { text: 'a' },
    });
    const r = await fetchDocs(target, { fetchImpl: f });
    expect(r.documents.map((d) => d.path)).toEqual(['docs/a.md']);
    expect(r.skipped[0].reason).toContain('404');
  });

  it('gives friendly errors for 404 and rate limits', async () => {
    await expect(fetchDocs(target, { fetchImpl: fakeFetch({}) })).rejects.toThrow(/not found/i);
    const limited = fakeFetch({ [INFO]: { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000000' } } });
    const err = await fetchDocs(target, { fetchImpl: limited }).catch((e) => e);
    expect(err).toBeInstanceOf(GitHubError);
    expect(err.message).toMatch(/rate limit/i);
    expect(err.message).toMatch(/GITHUB_TOKEN/);
  });

  it('sends the token only when given', async () => {
    const seen: { url: string; headers: Record<string, string> }[] = [];
    const routes = { [INFO]: { json: { default_branch: 'main' } }, [TREE]: tree([]) };
    await fetchDocs(target, { fetchImpl: fakeFetch(routes, seen) });
    expect(seen[0].headers.Authorization).toBeUndefined();
    seen.length = 0;
    await fetchDocs(target, { fetchImpl: fakeFetch(routes, seen), token: 'tkn' });
    expect(seen[0].headers.Authorization).toBe('Bearer tkn');
  });
});

describe('toDocumentsJson', () => {
  it('produces the string the flow parses', () => {
    const s = toDocumentsJson([{ path: 'docs/a.md', content: 'hi' }]);
    expect(JSON.parse(s)).toEqual([{ path: 'docs/a.md', content: 'hi' }]);
  });
});
