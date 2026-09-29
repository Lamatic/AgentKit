#!/usr/bin/env node
/**
 * CSV Formula Injection Tests (Batch D, Issue #11)
 *
 * Verifies the REAL production helper (apps/lib/csv.ts) that backs the CSV
 * export button. Two layers are tested:
 *   - Formula safety: values that a spreadsheet would treat as formulas
 *     (=, +, -, @ ... even behind leading whitespace/tab/CR) are neutralized
 *     by prefixing a single quote.
 *   - Structural CSV escaping: commas, double quotes, and newlines are still
 *     quoted/escaped exactly as before.
 */

const csv = require('../apps/lib/csv.ts');

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

console.log('🧪 Running CSV Formula Injection Tests...\n');

// --- Dangerous formula prefixes are neutralized ---
test("'=1+1' is neutralized", csv.makeSpreadsheetSafe('=1+1') === "'=1+1");
test("'+1+1' is neutralized", csv.makeSpreadsheetSafe('+1+1') === "'+1+1");
test("'-1+1' is neutralized", csv.makeSpreadsheetSafe('-1+1') === "'-1+1");
test("'@SUM(A1:A2)' is neutralized", csv.makeSpreadsheetSafe('@SUM(A1:A2)') === "'@SUM(A1:A2)");
test("'=HYPERLINK(...)' is neutralized", csv.makeSpreadsheetSafe('=HYPERLINK("https://evil","Click")') === "'=HYPERLINK(\"https://evil\",\"Click\")");

// --- Leading whitespace / control prefixes do not defeat the guard ---
test("' =1+1' (leading space) is neutralized", csv.makeSpreadsheetSafe(' =1+1') === "' =1+1");
test("'\\t=1+1' (tab) is neutralized", csv.makeSpreadsheetSafe('\t=1+1') === "'\t=1+1");
test("'\\r=1+1' (CR) is neutralized", csv.makeSpreadsheetSafe('\r=1+1') === "'\r=1+1");
test("'  +1+1' (space then +) is neutralized", csv.makeSpreadsheetSafe('  +1+1') === "'  +1+1");

// --- Normal values are preserved ---
test("'John Doe' unchanged", csv.makeSpreadsheetSafe('John Doe') === 'John Doe');
test("'Premium Plan' unchanged", csv.makeSpreadsheetSafe('Premium Plan') === 'Premium Plan');
test("'customer@example.com' unchanged", csv.makeSpreadsheetSafe('customer@example.com') === 'customer@example.com');
test('number 100 unchanged', csv.makeSpreadsheetSafe(100) === '100');
test('null becomes empty string', csv.makeSpreadsheetSafe(null) === '');
test('undefined becomes empty string', csv.makeSpreadsheetSafe(undefined) === '');

// --- Single-quote prefix is applied at most once ---
test('Already-safe value is not double-prefixed', csv.makeSpreadsheetSafe("'=1+1") === "'=1+1");

// --- Structural CSV escaping remains intact ---
test('comma value is quoted', csv.csvEscapeCell('comma,value') === '"comma,value"');
test('double quote is escaped with ""', csv.csvEscapeCell('John "Smith"') === '"John ""Smith"""');
test('newline value is kept as a quoted cell', csv.csvEscapeCell('line1\nline2') === '"line1\nline2"');
test('null renders as empty CSV field', csv.csvEscapeCell(null) === '');
test('undefined renders as empty CSV field', csv.csvEscapeCell(undefined) === '');
test('plain value renders as quoted cell', csv.csvEscapeCell('100') === '"100"');

// --- Formula safety + structural escaping compose ---
const composed = csv.csvEscapeCell('=HYPERLINK("a","b")');
const composedExpected = `"'=HYPERLINK(""a"",""b"")"`;
test('dangerous value is neutralized AND inner quotes escaped', composed === composedExpected);
test('composed cell starts with the CSV opening quote', composed.startsWith('"'));
test('composed cell ends with the CSV closing quote', composed.endsWith('"'));

// --- Integration: row serialization matches the exporter's join ---
function buildRow(row) {
  const headers = Object.keys(row);
  return headers.map((h) => csv.csvEscapeCell(row[h])).join(',');
}

test(
  'row serializer keeps formula value neutralized inside the cell',
  buildRow({ note: '=1+1' }) === "\"'=1+1\""
);

if (failed === 0) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}/${passed + failed}`);
  console.log(`   ❌ Failed: ${failed}/${passed + failed}`);
  console.log(`${'='.repeat(60)}`);
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
  process.exit(1);
}
