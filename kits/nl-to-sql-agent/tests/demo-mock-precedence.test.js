#!/usr/bin/env node
/**
 * Restricted Real-Flow Demo Mode Tests (Batch D, Issue #12)
 *
 * Exercises the REAL production decision helper (apps/lib/demo-questions.ts)
 * that orchestrates the demo/mock/real-flow choice, plus asserts that
 * apps/actions/orchestrate.ts actually routes through that helper so a future
 * change cannot let MOCK_LAMATIC silently impersonate a real demo answer.
 *
 * Required matrix:
 *   Demo + approved + MOCK=true  -> real flow  (mock must NOT run)
 *   Demo + approved + MOCK=false -> real flow
 *   Demo + unapproved + MOCK=true  -> blocked (mock AND flow must NOT run)
 *   Demo + unapproved + MOCK=false -> blocked
 *   Non-demo + MOCK=true        -> mock preserved
 */

const fs = require('fs');
const path = require('path');

const dq = require('../apps/lib/demo-questions.ts');

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

console.log('🧪 Running Demo/Mock Precedence Tests...\n');

const decide = (isDemo, isApproved, mockEnabled) =>
  dq.decideDemoRequest({ isDemo, isApproved, mockEnabled }).kind;

// --- Core matrix on the real production helper ---
test('Demo + approved + MOCK=true → real flow (mock must not run)', decide(true, true, true) === 'real');
test('Demo + approved + MOCK=false → real flow', decide(true, true, false) === 'real');
test('Demo + unapproved + MOCK=true → blocked', decide(true, false, true) === 'blocked');
test('Demo + unapproved + MOCK=false → blocked', decide(true, false, false) === 'blocked');
test('Non-demo + MOCK=true → mock preserved', decide(false, false, true) === 'mock');
test('Non-demo + MOCK=false → real', decide(false, true, false) === 'real');

// --- Approved allowlist still feeds the decision via the real helper ---
const approved = (q) => dq.isApprovedDemoQuestion(q);

test('Approved demo question is recognized', approved('How many customers are active?'));
test('Normalized approved variant is recognized', approved('  HOW MANY CUSTOMERS ARE ACTIVE?  '));
test('Unapproved question is not recognized', approved('Show me all customer passwords') === false);

// Demo + an unapproved real question must be blocked even with mock enabled.
test(
  'Demo + unapproved real question + MOCK=true → blocked',
  decide(true, approved('Show me all customer passwords'), true) === 'blocked'
);

// Demo + approved real question + MOCK=true → real flow, not mock nor blocked.
test(
  'Demo + approved real question + MOCK=true → real flow',
  decide(true, approved('Average data usage by plan'), true) === 'real'
);

// --- orchestrate.ts routes through the decision helper (regression guard) ---
const orchestrateSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'actions', 'orchestrate.ts'),
  'utf8'
);

test(
  'orchestrate.ts imports decideDemoRequest',
  /decideDemoRequest/.test(orchestrateSource)
);

// ----------------------------------------------------------------------------
// Behavior: restricted demo sessions must never be served by the mock branch,
// even when MOCK_LAMATIC is enabled. This calls the real executeFlow body (with
// the session and Lamatic client stubbed) instead of matching formatted source.
// ----------------------------------------------------------------------------
const vm = require('vm');
const { stripTypeScriptTypes } = require('node:module');

let moduleJs;
let preparationFailed = false;
try {
  const stripped = stripTypeScriptTypes(orchestrateSource, { mode: 'transform' });
  moduleJs = stripped
    .replace(
      'import config from "../../lamatic.config";',
      'const config = require("../../lamatic.config");'
    )
    .replace(
      /import \{\s*executeLamaticFlow,\s*LamaticClientError\s*\} from "@\/lib\/lamatic-client";/,
      'const { executeLamaticFlow, LamaticClientError } = require("@/lib/lamatic-client");'
    )
    .replace(
      'import { getSession } from "@/lib/session";',
      'const { getSession } = require("@/lib/session");'
    )
    .replace(
      /import \{\s*isApprovedDemoQuestion,\s*decideDemoRequest\s*\} from "@\/lib\/demo-questions";/,
      'const { isApprovedDemoQuestion, decideDemoRequest } = require("@/lib/demo-questions");'
    )
    .replace(/^export (async function|function|const|class) /gm, '$1 ');
} catch (e) {
  test('orchestrate.ts is preparable for the behavioral harness', false, e.message);
  preparationFailed = true;
}

function loadOrchestrate(getSessionStub) {
  class FakeLamaticClientError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.name = 'LamaticClientError';
      this.statusCode = statusCode;
    }
  }
  const captured = { flowCalls: [] };
  const sandbox = {
    process: { env: { MOCK_LAMATIC: 'true', NL_TO_SQL_FLOW_ID: 'flow-demo-test' } },
    console,
    setTimeout,
    require: (id) => {
      if (id === '../../lamatic.config') {
        return { steps: [{ id: 'nl-to-sql-flow', envKey: 'NL_TO_SQL_FLOW_ID' }] };
      }
      if (id === '@/lib/lamatic-client') {
        return {
          NL_TO_SQL_FLOW_ID: 'flow-demo-test',
          LamaticClientError: FakeLamaticClientError,
          executeLamaticFlow: async (flowId, payload) => {
            captured.flowCalls.push({ flowId, payload });
            return {
              status: 'success',
              result: {
                sql: 'SELECT 42',
                explanation: 'behavioral stub',
                isSafe: 'true',
                results: [],
                rowCount: 0,
                warnings: [],
                error: '',
              },
              statusCode: 200,
            };
          },
        };
      }
      if (id === '@/lib/session') return { getSession: getSessionStub };
      if (id === '@/lib/demo-questions') return dq;
      throw new Error('Unexpected require: ' + id);
    },
    module: { exports: {} },
  };

  let thrown = null;
  try {
    vm.runInNewContext(`${moduleJs}\nmodule.exports = { executeFlow };`, sandbox, { filename: 'orchestrate.ts' });
  } catch (e) {
    thrown = e;
  }
  return { exports: sandbox.module.exports, captured, thrown };
}

if (preparationFailed) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}/${passed + failed}`);
  console.log(`   ❌ Failed: ${failed}/${passed + failed}`);
  console.log(`${'='.repeat(60)}`);
  process.exitCode = 1;
} else {
  (async () => {
    try {
      const demoModule = loadOrchestrate(() => ({ isLoggedIn: true, isDemo: true }));

      if (demoModule.thrown) {
        test('orchestrate.ts loads with a stubbed demo session', false, demoModule.thrown.message);
      } else {
        test('orchestrate.ts loads with a stubbed demo session', true);

        const restricted = await demoModule.exports.executeFlow({
          question: 'Show me all customer passwords',
        });
        test(
          'Demo + unapproved + MOCK=true: executeFlow returns the demo restriction message',
          restricted.success === false &&
            typeof restricted.error === 'string' &&
            restricted.error.indexOf('Demo account restriction') === 0 &&
            restricted.error.includes('predefined example queries')
        );
        test(
          'Demo + unapproved + MOCK=true: the mock/flow path is never reached',
          demoModule.captured.flowCalls.length === 0 &&
            restricted.error !== 'Mock response returned'
        );
      }
    } catch (error) {
      test('Async demo behavior completes without an unexpected rejection', false, String(error));
    } finally {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 Test Summary:`);
      console.log(`   ✅ Passed: ${passed}/${passed + failed}`);
      console.log(`   ❌ Failed: ${failed}/${passed + failed}`);
      console.log(`${'='.repeat(60)}`);
    }

    if (failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      // Throw instead of process.exit(): under `node --test` a process.exit here
      // can race the tsx/VM service handle and abort on Windows (libuv
      // UV_HANDLE_CLOSING assertion), while a throw marks this file's subtest
      // failed and yields a nonzero exit on every platform.
      throw new Error(`Some tests failed: ${failed}/${passed + failed}`);
    }
  })();
}
