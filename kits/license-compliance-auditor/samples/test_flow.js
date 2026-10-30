// Live smoke test against a deployed Lamatic flow endpoint.
// Usage:
//   1. cp samples/.env.example samples/.env and fill in real values
//   2. node samples/test_flow.js

const fs = require('fs');
const path = require('path');

// ponytail: hand-rolled .env loader (no dotenv dep) since this is a bare
// script with no package.json — a few lines beats adding a dependency.
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2] ? match[2].trim() : '';
    }
  }
}

loadEnv(path.join(__dirname, '.env'));

const API_URL = process.env.LAMATIC_API_URL;
const API_KEY = process.env.LAMATIC_API_KEY;

if (!API_URL || !API_KEY) {
  throw new Error('LAMATIC_API_URL and LAMATIC_API_KEY must be set (see samples/.env.example)');
}

if (!API_URL.startsWith('https://')) {
  throw new Error('LAMATIC_API_URL must use https:// — refusing to send the API key over an insecure connection.');
}

const depsPath = path.join(__dirname, 'sample_dependency_licenses.json');
const dependency_licenses = fs.readFileSync(depsPath, 'utf8');

async function runTest() {
  console.log('Sending request to Lamatic Flow...');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dependency_licenses, allow_list: '' }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`Workflow execution failed: ${JSON.stringify(data.errors)}`);
    }

    // Don't just check for the absence of an error, and don't just check
    // "at least one of each status" (that would still pass if a dependency
    // got silently dropped or double-counted) — assert the exact counts
    // against the known fixture (samples/sample_dependency_licenses.json:
    // 7 deps total, 5 OK, 1 BLOCKED (gnu-diff-tool/GPL-3.0), 1 REVIEW_NEEDED
    // (some-internal-fork, no declared license)).
    const EXPECTED = { total_deps: 7, blocked_count: 1, review_count: 1, ok_count: 5 };
    const problems = [];
    if (typeof data.report !== 'string' || data.report.length === 0) problems.push('missing/empty "report" string');
    if (typeof data.has_violations !== 'boolean') problems.push('missing/non-boolean "has_violations"');
    if (data.total_deps !== EXPECTED.total_deps) problems.push(`expected total_deps=${EXPECTED.total_deps}, got ${data.total_deps}`);
    if (data.blocked_count !== EXPECTED.blocked_count) problems.push(`expected blocked_count=${EXPECTED.blocked_count}, got ${data.blocked_count}`);
    if (data.review_count !== EXPECTED.review_count) problems.push(`expected review_count=${EXPECTED.review_count}, got ${data.review_count}`);
    if (!Array.isArray(data.findings)) {
      problems.push('missing/non-array "findings"');
    } else {
      if (data.findings.length !== EXPECTED.total_deps) problems.push(`expected findings.length=${EXPECTED.total_deps}, got ${data.findings.length}`);
      const okCount = data.findings.filter((f) => f.status === 'OK').length;
      if (okCount !== EXPECTED.ok_count) problems.push(`expected ${EXPECTED.ok_count} OK findings, got ${okCount}`);
    }
    if (problems.length > 0) {
      throw new Error(`Response shape/content check failed: ${problems.join('; ')}`);
    }

    console.log('Flow Execution Successful! Response matches expected shape and fixture composition.');
    console.log('\n--- Output Report ---');
    console.log(data);
  } finally {
    // Kept active through response-body reads above, not just until
    // headers arrive, so a slow body download is still bounded by the
    // same 60s budget.
    clearTimeout(timeout);
  }
}

runTest().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
