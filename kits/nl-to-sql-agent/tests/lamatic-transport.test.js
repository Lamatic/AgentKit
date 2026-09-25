#!/usr/bin/env node
/**
 * Lamatic SDK Transport & Client Safety Tests
 *
 * Verifies the security contract that a Lamatic API credential (the
 * Authorization Bearer key) can never be transmitted to an untrusted or
 * insecure endpoint - including plain-HTTP loopback - and that the official
 * `lamatic` SDK is the ONLY transport path used for flow execution.
 *
 * Production behavior (apps/lib/lamatic-client.ts):
 *   - validateLamaticEndpoint() requires the https: protocol and rejects every
 *     plain-HTTP endpoint (remote AND localhost/loopback). It runs at module
 *     load, before the SDK instance is ever constructed.
 *   - LAMATIC_API_URL is defined as the return value of that validation and is
 *     the ONLY endpoint passed to `new Lamatic(...)`. The SDK derives the
 *     Authorization Bearer header internally, so the credential can never be
 *     attached to an HTTP or otherwise unvalidated URL.
 *   - Missing required configuration (API URL, project ID, API key, flow ID)
 *     fails closed at module load - no fallback credentials exist.
 *   - executeFlow() is the single request path; there is no handwritten
 *     GraphQL/fetch() fallback in application code.
 *
 * How this suite works:
 *   - STATIC: asserts the source-level invariants above against the real
 *     production file.
 *   - BEHAVIORAL (validator): executes the REAL validateLamaticEndpoint
 *     function (extracted from source) against the insecure-endpoint matrix.
 *   - BEHAVIORAL (module): loads the REAL module (Node type-stripping +
 *     vm) with a FAKE `lamatic` SDK injected, proving that the HTTPS guard
 *     runs before the SDK is constructed, the SDK receives the validated
 *     endpoint/projectId/apiKey, executeFlow() receives the correct
 *     flowId/payload, and every success/error path normalizes to the
 *     application's contract - without leaking credentials.
 *
 * No real Lamatic API calls, production keys, or external services are used.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { stripTypeScriptTypes } = require('node:module');

let passed = 0;
let failed = 0;

function test(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${name}`);
  } else {
    failed++;
    console.log(`❌ FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('🧪 Running Lamatic SDK Transport & Client Safety Tests...\n');

if (typeof stripTypeScriptTypes !== 'function') {
  console.error(
    '❌ This suite requires Node.js >= 22.6 (module.stripTypeScriptTypes). ' +
      'The kit tests already require modern Node for require() of .ts sources.'
  );
  process.exit(1);
}

const clientPath = path.join(__dirname, '..', 'apps', 'lib', 'lamatic-client.ts');
const clientSource = fs.readFileSync(clientPath, 'utf8');

// ============================================================================
// STATIC CONTRACT: SDK-only transport, validated HTTPS endpoint
// ============================================================================

const newLamaticCount = (clientSource.match(/new Lamatic\(/g) || []).length;

test(
  'Official lamatic SDK is the imported client',
  /import\s*\{\s*Lamatic\s*\}\s*from\s*["']lamatic["']/.test(clientSource)
);

test(
  'LAMATIC_API_URL is the return value of endpoint validation (no raw env URL)',
  /\nconst LAMATIC_API_URL = validateLamaticEndpoint\(process\.env\.LAMATIC_API_URL\);/.test(clientSource)
);

test(
  'Only the https: protocol is accepted by validation',
  /parsed\.protocol !== "https:"\)\s*\{/.test(clientSource)
);

test(
  'Exactly one Lamatic SDK instance is created',
  newLamaticCount === 1,
  `found ${newLamaticCount}`
);

test(
  'SDK endpoint is the validated LAMATIC_API_URL constant (never raw process.env)',
  /endpoint:\s*LAMATIC_API_URL/.test(clientSource) &&
    !/new Lamatic\([\s\S]*endpoint:\s*process\.env\.LAMATIC_API_URL/.test(clientSource)
);

test(
  'SDK receives the project ID from LAMATIC_PROJECT_ID',
  /projectId:\s*LAMATIC_PROJECT_ID/.test(clientSource)
);

test(
  'SDK receives the API key from LAMATIC_API_KEY',
  /apiKey:\s*LAMATIC_API_KEY/.test(clientSource)
);

test(
  'Flow execution goes through lamaticClient.executeFlow(flowId, payload)',
  /lamaticClient\.executeFlow\(flowId, payload\)/.test(clientSource)
);

// No handwritten transport may remain as an alternate request path.
const fetchCount = (clientSource.match(/\bfetch\(/g) || []).length;
const authHeaderCount = (clientSource.match(/["']Authorization["']\s*:/g) || []).length;
const oldGraphQlCount = (clientSource.match(/query ExecuteWorkflow|executeWorkflow\(workflowId\b/g) || []).length;

test(
  'No fetch() call remains in application code (SDK owns transport)',
  fetchCount === 0,
  `found ${fetchCount}`
);

test(
  'No Authorization header is constructed in application code (SDK internal)',
  authHeaderCount === 0,
  `found ${authHeaderCount}`
);

test(
  'No obsolete handwritten GraphQL execution path remains',
  oldGraphQlCount === 0
);

// Missing configuration fails closed at module load (no fallback credentials).
test(
  'Missing LAMATIC_API_URL fails closed at module load',
  /if\s*\(!process\.env\.LAMATIC_API_URL\)\s*\{[\s\S]*?throw new Error/.test(clientSource)
);

test(
  'Missing LAMATIC_PROJECT_ID fails closed at module load',
  /if\s*\(!process\.env\.LAMATIC_PROJECT_ID\)\s*\{[\s\S]*?throw new Error/.test(clientSource)
);

test(
  'Missing LAMATIC_API_KEY fails closed at module load',
  /if\s*\(!process\.env\.LAMATIC_API_KEY\)\s*\{[\s\S]*?throw new Error/.test(clientSource)
);

test(
  'Missing flow ID fails closed at module load',
  /if\s*\(!nlToSqlFlowId\)\s*\{[\s\S]*?throw new Error/.test(clientSource)
);

// No API key may ever be logged or otherwise emitted.
test(
  'No console call exists in the client (no secret logging surface)',
  !/console\.(log|error|warn|info)\(/.test(clientSource)
);

// ============================================================================
// BEHAVIORAL: the real production endpoint validator
// ============================================================================

function extractFunction(src, name) {
  const sigRegex = new RegExp(`function ${name}\\(url: string\\): string \\{`);
  const sigStart = src.search(sigRegex);
  test(`Extracted ${name} from production source`, sigStart !== -1);
  if (sigStart === -1) return null;

  // Find the brace-matched extent of the function body.
  const bodyStart = src.indexOf('{', sigStart);
  let depth = 0;
  let i = bodyStart;
  do {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  } while (depth > 0 && i < src.length);

  const funcSrc = src.slice(sigStart, i);
  // Strip the small set of TS type annotations in this function.
  const cleaned = funcSrc
    .replace(/\(url: string\): string/, '(url)')
    .replace(/: URL;/g, ';');
  // eslint-disable-next-line no-new-func
  return new Function(`${cleaned}\nreturn ${name};`)();
}

const validateLamaticEndpoint = extractFunction(clientSource, 'validateLamaticEndpoint');

if (typeof validateLamaticEndpoint !== 'function') {
  console.error(
    '❌ Could not extract validateLamaticEndpoint from lamatic-client.ts. ' +
      'The production signature changed. Update extractFunction before trusting this suite.'
  );
  process.exit(1);
}

function expectValid(url) {
  try {
    validateLamaticEndpoint(url);
    return true;
  } catch {
    return false;
  }
}

function expectRejected(url) {
  try {
    validateLamaticEndpoint(url);
    return false;
  } catch (e) {
    // A TypeError/ReferenceError means the harness broke, not that the URL was rejected.
    return e instanceof Error &&
      !(e instanceof TypeError) &&
      !(e instanceof ReferenceError) &&
      typeof e.message === 'string' &&
      e.message.length > 0;
  }
}

test('Remote HTTPS endpoint is accepted', expectValid('https://api.lamatic.ai'));
test('Remote HTTPS with a path is accepted', expectValid('https://api.lamatic.ai/v1/graphql'));
test('Validated HTTPS URL is returned unchanged', (() => {
  const result = validateLamaticEndpoint('https://api.lamatic.ai/graphql');
  return result === 'https://api.lamatic.ai/graphql';
})());

test('Malformed URL is rejected', expectRejected('not-a-url'));
test('Remote http:// endpoint is rejected', expectRejected('http://api.lamatic.ai'));
test('Remote http:// with non-loopback hostname is rejected', expectRejected('http://evil.example.com'));
test('Unsupported protocol (ftp) is rejected', expectRejected('ftp://api.lamatic.ai'));

// The Lamatic API key must never be sent in cleartext, even to loopback.
test('Localhost http is rejected (credentials must not traverse HTTP)', expectRejected('http://localhost:4000'));
test('127.0.0.1 http is rejected (credentials must not traverse HTTP)', expectRejected('http://127.0.0.1:3000'));
test('IPv6 loopback http is rejected (fail-closed, not a bypass)', expectRejected('http://[::1]:3000'));

test('Insecure URL rejection message is explicit', (() => {
  try {
    validateLamaticEndpoint('http://localhost:4000/graphql');
  } catch (e) {
    return /[Ii]nsecure|https/i.test(e.message);
  }
  return false;
})());

// ============================================================================
// BEHAVIORAL: the real module with a fake lamatic SDK
// ============================================================================

// Transform the production TypeScript into runnable JS: strip types, then map
// the two module imports onto the injected fake SDK / config stub.
let moduleJs;
try {
  const stripped = stripTypeScriptTypes(clientSource, { mode: 'transform' });
  moduleJs = stripped
    .replace(/^import \{ Lamatic \} from "lamatic";\s*\n/m, 'const { Lamatic } = require("lamatic");\n')
    .replace(/^import config from "\.\.\/\.\.\/lamatic\.config";\s*\n/m, 'const config = require("../../lamatic.config");\n')
    .replace(/\bexport (const|class|async function|function) /g, '$1 ');
} catch (e) {
  console.error('❌ FAIL: could not prepare lamatic-client.ts for the behavioral suite:', e.message);
  process.exit(1);
}

const SECRET_KEY = 'secret-key-123-must-never-leak';
const BASE_ENV = {
  LAMATIC_API_URL: 'https://api.lamatic.ai',
  LAMATIC_PROJECT_ID: 'proj-1',
  LAMATIC_API_KEY: SECRET_KEY,
  NL_TO_SQL_FLOW_ID: 'flow-1',
};
const CONFIG_STUB = { steps: [{ id: 'nl-to-sql-flow', envKey: 'NL_TO_SQL_FLOW_ID' }] };

function loadRealModule(env, behavior) {
  const captured = { configs: [], calls: [] };
  class FakeLamatic {
    constructor(config) {
      captured.configs.push(config);
    }
    async executeFlow(flowId, payload) {
      captured.calls.push({ flowId, payload });
      return behavior(flowId, payload);
    }
  }
  const sandbox = {
    process: { env },
    URL,
    console,
    require: (id) => {
      if (id === 'lamatic') return { Lamatic: FakeLamatic };
      if (id.includes('lamatic.config')) return CONFIG_STUB;
      throw new Error('Unexpected require: ' + id);
    },
    module: { exports: {} },
  };

  let thrown = null;
  try {
    vm.runInNewContext(
      `${moduleJs}\nmodule.exports = { NL_TO_SQL_FLOW_ID, LamaticClientError, executeLamaticFlow };`,
      sandbox,
      { filename: 'lamatic-client.ts' }
    );
  } catch (e) {
    thrown = e;
  }
  return { exports: sandbox.module.exports, captured, thrown };
}

const successBehavior = () => ({ status: 'success', result: { sql: 'SELECT 1' }, statusCode: 200 });

function withoutEnv(key) {
  const copy = Object.assign({}, BASE_ENV);
  delete copy[key];
  return copy;
}

// --- Fail-closed configuration: the SDK must never be constructed ---
test('Module fails closed when LAMATIC_API_URL is http (SDK never constructed)', (() => {
  const { captured, thrown } = loadRealModule(
    { ...BASE_ENV, LAMATIC_API_URL: 'http://evil.example.com' },
    successBehavior
  );
  return !!thrown && /[Ii]nsecure|https/i.test(thrown.message) && captured.configs.length === 0;
})());

test('Module fails closed when LAMATIC_API_URL is missing', (() => {
  const { captured, thrown } = loadRealModule(withoutEnv('LAMATIC_API_URL'), successBehavior);
  return !!thrown && /LAMATIC_API_URL/.test(thrown.message) && captured.configs.length === 0;
})());

test('Module fails closed when LAMATIC_PROJECT_ID is missing', (() => {
  const { captured, thrown } = loadRealModule(withoutEnv('LAMATIC_PROJECT_ID'), successBehavior);
  return !!thrown && /LAMATIC_PROJECT_ID/.test(thrown.message) && captured.configs.length === 0;
})());

test('Module fails closed when LAMATIC_API_KEY is missing', (() => {
  const { captured, thrown } = loadRealModule(withoutEnv('LAMATIC_API_KEY'), successBehavior);
  return !!thrown && /LAMATIC_API_KEY/.test(thrown.message) && captured.configs.length === 0;
})());

test('Module fails closed when the flow ID env var is missing', (() => {
  const { captured, thrown } = loadRealModule(withoutEnv('NL_TO_SQL_FLOW_ID'), successBehavior);
  return !!thrown && /NL_TO_SQL_FLOW_ID/.test(thrown.message) && captured.configs.length === 0;
})());

// --- HTTPS endpoint: SDK is constructed with the validated configuration ---
const httpsModule = loadRealModule(BASE_ENV, successBehavior);
const sdkConfig = httpsModule.captured.configs[0];

test('Module loads for an https:// endpoint', !httpsModule.thrown && !!sdkConfig);
test('SDK endpoint is the validated https URL', !!sdkConfig && sdkConfig.endpoint === 'https://api.lamatic.ai');
test('SDK project ID is passed through', !!sdkConfig && sdkConfig.projectId === 'proj-1');
test('SDK API key is passed through', !!sdkConfig && sdkConfig.apiKey === SECRET_KEY);
test('NL_TO_SQL_FLOW_ID is exported from the env-derived flow ID', httpsModule.exports.NL_TO_SQL_FLOW_ID === 'flow-1');

// --- High-scenario suite: auth / flow-level / raw SDK errors ---
const scenarios = {
  'auth-401': { status: 'error', result: null, message: 'Invalid API key', statusCode: 401 },
  'auth-403': { status: 'error', result: null, message: 'Forbidden', statusCode: 403 },
  'http-500': { status: 'error', result: null, message: 'Service unavailable', statusCode: 500 },
  'graphql-200': { status: 'error', result: null, message: 'Something went wrong', statusCode: 200 },
};

function scenarioBehavior(flowId) {
  if (scenarios[flowId]) return scenarios[flowId];
  if (flowId === 'sdk-throw-network') throw new Error('fetch failed');
  if (flowId === 'sdk-throw-nonjson') throw new SyntaxError('Unexpected token \'<\', "<!DOCTYPE html>" is not valid JSON');
  if (flowId === 'no-response') return undefined;
  return successBehavior(flowId);
}

const scenarioModule = loadRealModule(BASE_ENV, scenarioBehavior);

function printSummary() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}/${passed + failed}`);
  console.log(`   ❌ Failed: ${failed}/${passed + failed}`);
  console.log(`${'='.repeat(60)}`);
}

(async () => {
  try {
  await httpsModule.exports.executeLamaticFlow('flow-1', { question: 'Show me all users' });
  const firstCall = httpsModule.captured.calls[0];

  test('executeFlow receives the flow id passed by the caller', !!firstCall && firstCall.flowId === 'flow-1');
  test('executeFlow receives the payload shape unchanged ({ question })', !!firstCall && JSON.stringify(firstCall.payload) === '{"question":"Show me all users"}');

  const ok = await httpsModule.exports.executeLamaticFlow('flow-1', { question: 'x' });
  test('SDK success is normalized to { status: "success", result }', ok && ok.status === 'success' && JSON.stringify(ok.result) === '{"sql":"SELECT 1"}');
  test('Normalized success carries no SDK-only statusCode field', ok && !('statusCode' in ok));

  for (const [fid, expectedCode] of [['auth-401', 401], ['auth-403', 403], ['http-500', 500]]) {
    try {
      await scenarioModule.exports.executeLamaticFlow(fid, { question: 'x' });
      test(`${fid} raises an application-level LamaticClientError`, false);
    } catch (e) {
      test(`${fid} raises "Lamatic API error (${expectedCode}): ..." (orchestrate-compatible)`,
        e && e.name === 'LamaticClientError' &&
        e.message.indexOf(`Lamatic API error (${expectedCode}):`) === 0 &&
        e.statusCode === expectedCode &&
        !e.message.includes(SECRET_KEY));
    }
  }

  // Flow-level failure over HTTP 200 resolves, matching the caller's existing
  // `resData.status === "error"` branch.
  const flowLevel = await scenarioModule.exports.executeLamaticFlow('graphql-200', { question: 'x' });
  test('Flow-level (HTTP 200) failure resolves as { status: "error", message }',
    flowLevel && flowLevel.status === 'error' && flowLevel.message === 'Something went wrong' &&
    !('statusCode' in flowLevel));

  try {
    await scenarioModule.exports.executeLamaticFlow('sdk-throw-network', { question: 'x' });
    test('SDK network failure is normalized to a LamaticClientError', false);
  } catch (e) {
    test('SDK network failure keeps its message (orchestrate maps "fetch failed")',
      e && e.name === 'LamaticClientError' && e.message === 'fetch failed' && !e.message.includes(SECRET_KEY));
  }

  try {
    await scenarioModule.exports.executeLamaticFlow('sdk-throw-nonjson', { question: 'x' });
    test('Non-JSON response body is normalized (no raw SyntaxError leak)', false);
  } catch (e) {
    test('Non-JSON response body is normalized (no raw SyntaxError leak)',
      e && e.name === 'LamaticClientError' &&
      e.message.indexOf('Lamatic API returned a non-JSON response:') === 0 &&
      !e.message.includes(SECRET_KEY));
  }

  try {
    await scenarioModule.exports.executeLamaticFlow('no-response', { question: 'x' });
    test('Empty SDK response is a normalized LamaticClientError', false);
  } catch (e) {
    test('Empty SDK response is a normalized LamaticClientError',
      e && e.name === 'LamaticClientError' && e.message === 'No response returned from Lamatic workflow');
  }

  } catch (error) {
    test('Behavioral transport harness completes without an unexpected error', false,
      error instanceof Error ? error.message : String(error));
  } finally {
    printSummary();
    if (failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️  Some tests failed.');
      process.exitCode = 1;
    }
  }
})();
