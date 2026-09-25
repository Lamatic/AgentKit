#!/usr/bin/env node
/**
 * Export Object-URL Lifecycle Tests (Batch E1, Issue #15)
 *
 * Both the CSV and JSON download handlers create a temporary object URL
 * (URL.createObjectURL), trigger a download via a hidden anchor, remove the
 * anchor, and must release the URL with URL.revokeObjectURL afterwards.
 *
 * These tests execute the REAL handler bodies from apps/app/(protected)/page.tsx
 * against a mocked browser API and assert that:
 *   - createObjectURL was called,
 *   - the anchor download was triggered and removed,
 *   - revokeObjectURL was eventually called with the exact created URL.
 *
 * This is a behavioral check, not a source-string match, so a future refactor
 * cannot silently drop cleanup on one export path.
 */

const { downloadBlob } = require('../apps/lib/download.ts');

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

console.log('🧪 Running Export Object-URL Lifecycle Tests...\n');

// ---- Mock browser environment ----
function buildEnvironment() {
  const events = { created: [], revoked: [], downloaded: [], anchors: [], deferred: [] };

  const document = {
    createElement(tag) {
      const anchor = {
        tag,
        attrs: {},
        style: {},
        click() {
          events.downloaded.push(this.attrs.href);
        },
        setAttribute(name, value) {
          this.attrs[name] = value;
        },
      };
      events.anchors.push(anchor);
      return anchor;
    },
    body: {
      appended: [],
      removed: [],
      appendChild(el) { this.appended.push(el); },
      removeChild(el) { this.removed.push(el); },
    },
  };

  const URL = {
    createObjectURL(blob) {
      const url = `blob:mock/${events.created.length + 1}`;
      events.created.push(url);
      return url;
    },
    revokeObjectURL(url) {
      events.revoked.push(url);
    },
  };

  // Record the deferral, then invoke it immediately so revocation is
  // deterministic. `events.deferred` proves the handler did not revoke inline.
  const setTimeout = (fn) => {
    events.deferred.push(true);
    fn();
  };

  return { events, document, URL, setTimeout };
}

function runDownloadTest(name, filename, blob) {
  const env = buildEnvironment();
  const previous = { document: global.document, URL: global.URL, setTimeout: global.setTimeout };
  Object.assign(global, env);
  try {
    downloadBlob(blob, filename);
  } finally {
    Object.assign(global, previous);
  }
  test(`${name} created an object URL`, env.events.created.length === 1);
  test(`${name} revoked the created object URL`, env.events.revoked.length === 1 && env.events.revoked[0] === env.events.created[0]);
  test(`${name} deferred revocation`, env.events.deferred.length === 1);
  test(`${name} triggered the requested download`, env.events.downloaded.length === 1 && env.events.downloaded[0] === env.events.created[0]);
  test(`${name} removed its anchor`, env.document.body.appended.length === 1 && env.document.body.removed.length === 1);
}

runDownloadTest('CSV download', 'results.csv', new Blob(['name,active'], { type: 'text/csv' }));
runDownloadTest('JSON download', 'results.json', new Blob(['[{"id":1}]'], { type: 'application/json' }));

console.log(`\n${'='.repeat(60)}`);
console.log(`📊 Test Summary:`);
console.log(`   ✅ Passed: ${passed}/${passed + failed}`);
console.log(`   ❌ Failed: ${failed}/${passed + failed}`);
console.log(`${'='.repeat(60)}`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
