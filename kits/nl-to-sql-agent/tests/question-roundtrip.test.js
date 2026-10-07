#!/usr/bin/env node
/**
 * Question URL Round-Trip Tests (Batch E1, Issue #14)
 *
 * The History page navigates back to the Workspace with a single encoding:
 *   encodeURIComponent(entry.question)  ->  router.push('/?question=...')
 *
 * The Workspace reads it via useSearchParams().get('question'), which ALREADY
 * percent-decodes the value once (this is the single decode boundary) and must
 * use it directly. Decoding again would corrupt questions containing '%' and
 * can throw URIError: URI malformed.
 *
 * These tests use the real `URLSearchParams` browser API to faithfully model
 * what useSearchParams().get() returns (it uses the same percent-decoding),
 * then prove the full round trip preserves the original question and that a
 * second decode breaks encoded-looking and percentage questions.
 */

const fs = require('fs');
const path = require('path');

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

console.log('🧪 Running Question Round-Trip Tests...\n');

// --- The Workspace must use the decoded param directly (no second decode) ---
const pageSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'app', '(protected)', 'page.tsx'),
  'utf8'
);

// Extract the question-read effect body to inspect the decode boundary.
const effectMatch = pageSource.match(
  /useEffect\(\(\) => \{[\s\S]*?searchParams\.get\("question"\)[\s\S]*?setQuestion\([^)]*\)[\s\S]*?\}, \[searchParams\]\);/
);
const effectBlock = effectMatch ? effectMatch[0] : '';

test(
  'Question-read effect was located in the Workspace source',
  effectMatch !== null,
  'the useEffect extraction regex no longer matches page.tsx'
);

test(
  'Workspace reads question via searchParams.get and sets it directly',
  /const paramQuestion = searchParams\.get\("question"\);/.test(effectBlock) &&
    /setQuestion\(paramQuestion\);/.test(effectBlock)
);

test(
  'No second decodeURIComponent is applied to the searchParams value',
  !/decodeURIComponent\(paramQuestion\)/.test(effectBlock)
);

test(
  'Workspace does not call decodeURIComponent anywhere in the question effect',
  !/setQuestion\(decodeURIComponent/.test(effectBlock)
);

// --- History encodes exactly once when building the Run Again URL ---
const historySource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'app', '(protected)', 'history', 'page.tsx'),
  'utf8'
);
test(
  'History encodes the question once via encodeURIComponent on Run Again',
  /encodeURIComponent\(entry\.question\)/.test(historySource)
);

// --- Behavioral round trips using the real URLSearchParams decoding ---
const cases = [
  ['show active customers', 'plain question'],
  ['50% data usage', 'literal percentage'],
  ['%20', 'encoded-looking content'],
  ['Café ☕ — 日本語のクエリ?', 'non-ASCII question'],
];

function roundTrip(question) {
  // What History puts in the URL:
  const encoded = encodeURIComponent(question);
  // What useSearchParams().get() returns (single decode via URLSearchParams):
  const decodedOnce = new URLSearchParams(`question=${encoded}`).get('question');
  return decodedOnce;
}

let roundTripsOk = true;
for (const [question, label] of cases) {
  const decodedOnce = roundTrip(question);
  const ok = decodedOnce === question;
  if (!ok) roundTripsOk = false;
  test(
    `Round trip preserves original question (${label})`,
    ok,
    ok ? '' : `expected "${question}" but got "${decodedOnce}"`
  );
}

// --- A second decode corrupts / throws for encoded-looking + '%' questions ---
let secondDecodeThrowsForPercent = false;
try {
  decodeURIComponent(roundTrip('50% data usage'));
} catch (e) {
  secondDecodeThrowsForPercent = e instanceof URIError;
}
test(
  'A second decode throws URIError for a literal percentage question',
  secondDecodeThrowsForPercent
);

let secondDecodeCorruptsEncodedLooking = false;
try {
  secondDecodeCorruptsEncodedLooking = decodeURIComponent(roundTrip('%20')) !== '%20';
} catch (e) {
  secondDecodeCorruptsEncodedLooking = e instanceof URIError;
}
test(
  'A second decode corrupts an encoded-looking question',
  secondDecodeCorruptsEncodedLooking
);

// --- Round trips all preserved, else fail the suite ---
test('All round trips preserved without corruption', roundTripsOk);

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
