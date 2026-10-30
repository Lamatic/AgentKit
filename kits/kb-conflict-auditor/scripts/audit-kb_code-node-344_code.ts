// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
/* KB Conflict Auditor - Code Node 1: extract candidate conflicts.
 * Pure JavaScript, no imports, no file access: the docs arrive as a JSON string.
 * Input : documents_json = '[{"path":"docs/api.md","content":"..."}, ...]'
 * Output: { docs_scanned, candidate_count, total_found, truncated, candidates_json, error }
 */
const MAX_PAIRS = 10;
const MAX_DOCS = 200;
const MAX_DOC_CHARS = 200000;

const UNITS = {
  ms: ['s', 0.001], msec: ['s', 0.001],
  s: ['s', 1], sec: ['s', 1], secs: ['s', 1], second: ['s', 1], seconds: ['s', 1],
  min: ['s', 60], mins: ['s', 60], minute: ['s', 60], minutes: ['s', 60],
  h: ['s', 3600], hr: ['s', 3600], hrs: ['s', 3600], hour: ['s', 3600], hours: ['s', 3600],
  kb: ['b', 1024], mb: ['b', 1048576], gb: ['b', 1073741824],
  '%': ['%', 1], px: ['px', 1], '': ['', 1],
};
const STOP = new Set(['the', 'a', 'an', 'default', 'is', 'are', 'of', 'set', 'to', 'value', 'be', 'currently', 'now']);
const SKIP_KEYS = new Set(['date', 'last_updated', 'updated', 'updated_at', 'version', 'step', 'page', 'line', 'year', 'chapter', 'section']);
const FACT = /([A-Za-z][A-Za-z0-9_\-. ]{1,40}?)\s*(?::|=|\bis\b|\bto\b)\s*`?(\d+(?:\.\d+)?)\s*(seconds?|secs?|msec|ms|minutes?|mins?|hours?|hrs?|kb|mb|gb|%|px|h|s)?(?![A-Za-z0-9]|[-./]\d)/gi;
const FRONT_MATTER = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const DATE = /^(?:last[_ -]?updated|updated(?:_at)?|date)\s*:\s*["']?(\d{4}-\d{2}-\d{2})/im;

function isRealDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function extractDate(content) {
  const frontMatter = FRONT_MATTER.exec(content)?.[1];
  if (!frontMatter) return '';
  for (const line of frontMatter.split(/\r?\n/)) {
    const match = DATE.exec(line);
    if (match && isRealDate(match[1])) return match[1];
  }
  return '';
}

function normalizeKey(text) {
  const tokens = text.toLowerCase().replace(/[`*|>#"'()\[\]]/g, ' ').split(/[\s\-.]+/)
    .filter((t) => t && !STOP.has(t));
  return tokens.slice(-3).join('_');
}

function parseValue(num, unit) {
  const u = UNITS[(unit || '').toLowerCase()];
  if (!u) return null;
  return { dim: u[0], value: parseFloat(num) * u[1] };
}

function extractFacts(content) {
  const facts = [];
  let heading = '';
  content.split('\n').forEach((line, i) => {
    if (/^\s*#{1,6}\s/.test(line)) heading = line.replace(/^\s*#+\s*/, '').trim();
    for (const m of line.matchAll(FACT)) {
      const key = normalizeKey(m[1]);
      const parsed = parseValue(m[2], m[3]);
      if (!key || SKIP_KEYS.has(key) || /^\d+$/.test(key) || !parsed) continue;
      facts.push({ key, raw: m[0].trim(), dim: parsed.dim, value: parsed.value, line: i + 1, heading, context: line.trim().slice(0, 240) });
    }
  });
  return facts;
}

function extract(documentsJson) {
  const empty = { docs_scanned: 0, candidate_count: 0, total_found: 0, truncated: false, candidates_json: '[]', error: '' };
  let docs;
  try {
    docs = typeof documentsJson === 'string' ? JSON.parse(documentsJson) : documentsJson;
  } catch (e) {
    return { ...empty, error: 'documents_json is not valid JSON.' };
  }
  if (!Array.isArray(docs) || docs.length === 0) return { ...empty, error: 'documents_json must be a non-empty array of {path, content}.' };

  const clean = docs.slice(0, MAX_DOCS)
    .filter((d) => d && typeof d.path === 'string' && typeof d.content === 'string')
    .map((d) => {
      const content = d.content.slice(0, MAX_DOC_CHARS);
      return { path: d.path, date: extractDate(content), facts: extractFacts(content) };
    });

  const found = [];
  for (let i = 0; i < clean.length; i++) {
    for (let j = i + 1; j < clean.length; j++) {
      const A = clean[i];
      const B = clean[j];
      for (const a of A.facts) {
        for (const b of B.facts) {
          if (a.key !== b.key || a.dim !== b.dim || Math.abs(a.value - b.value) <= 1e-9 * Math.max(1, Math.abs(a.value))) continue;
          const bothDated = A.date && B.date && A.date !== B.date;
          const sameContext = a.heading && a.heading === b.heading;
          found.push({
            score: (bothDated ? 2 : 0) + (sameContext ? 1 : 0) + (a.key.includes('_') ? 1 : 0),
            key: a.key,
            docA: { path: A.path, date: A.date, line: a.line, heading: a.heading, text: a.context },
            docB: { path: B.path, date: B.date, line: b.line, heading: b.heading, text: b.context },
          });
        }
      }
    }
  }
  found.sort((x, y) => y.score - x.score || x.docA.path.localeCompare(y.docA.path) || x.docA.line - y.docA.line || x.docB.path.localeCompare(y.docB.path) || x.docB.line - y.docB.line);
  const candidates = found.slice(0, MAX_PAIRS).map((c, n) => ({ id: 'c' + (n + 1), key: c.key, docA: c.docA, docB: c.docB }));
  return {
    docs_scanned: clean.length,
    candidate_count: candidates.length,
    total_found: found.length,
    truncated: found.length > MAX_PAIRS,
    candidates_json: JSON.stringify(candidates),
    error: '',
  };
}

// ---- Studio adapter ----
const documentsJson = {{triggerNode_1.output.documents_json}};
output = extract(documentsJson);