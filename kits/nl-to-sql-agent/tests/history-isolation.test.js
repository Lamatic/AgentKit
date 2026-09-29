#!/usr/bin/env node
/**
 * History Isolation Tests (Batch D, Issue #10 + CodeRabbit id 13/14)
 *
 * Each authenticated user's NL-to-SQL history is stored in localStorage under a
 * namespaced key: 'nl-to-sql-history:<userId>'. On logout only the current
 * user's namespaced key must be removed — destroying the server session while
 * leaving unrelated browser storage (theme 'nl-to-sql-theme'), other users'
 * keys, and unknown keys untouched. GameGuard parsed-history reads are
 * defensive: malformed JSON, non-array values, and malformed entries must all
 * yield [] instead of throwing or surfacing invalid data.
 *
 * history.ts also imports React (client-side concern), so the kit-level test
 * cannot `require` the module directly. Instead it extracts the REAL
 * historyStorageKey / parseStoredHistory / clearStoredHistory functions (and
 * the HISTORY_STORAGE_PREFIX constant) from the production source into a
 * temporary, React-free .ts module and requires it under Node's native
 * TypeScript type-stripping (Node >= 22.18, where it is unflagged) or the tsx
 * loader used by the shared test command — proving the actual production logic
 * rather than a re-implementation.
 */

const fs = require('fs');
const os = require('os');
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

console.log('🧪 Running History Isolation Tests...\n');

const historySource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'lib', 'history.ts'),
  'utf8'
);

// --- Constant is defined and correct ---
const prefixMatch = historySource.match(/export const HISTORY_STORAGE_PREFIX = '([^']+)'/);
const HISTORY_STORAGE_PREFIX = prefixMatch ? prefixMatch[1] : null;

test(
  "HISTORY_STORAGE_PREFIX is defined as 'nl-to-sql-history'",
  HISTORY_STORAGE_PREFIX === 'nl-to-sql-history'
);

// --- The REAL production functions run against a localStorage polyfill ---
// Strip the React import, drop everything from the `useHistory` hook onward,
// and require the remaining code as a standalone module. Node >= 22.6 strips
// the TypeScript annotations (interface + type signatures) at load time.
const start = historySource.indexOf('export const HISTORY_STORAGE_PREFIX');
const end = historySource.indexOf('export function useHistory');
// Strip the `export` keywords so the temp module is treated as CommonJS (like
// validation.test.js), making `module.exports` available on Node's module-syntax
// detection for type-stripped .ts files.
const funcsSource = historySource
  .slice(start, end)
  .replace(/^import [^\n]*$/m, '')
  .replace(/^export /gm, '')
  .trim();

const tempModule = path.join(
  os.tmpdir(),
  `history-functions-${process.pid}-${Date.now()}.ts`
);
fs.writeFileSync(
  tempModule,
  `${funcsSource}\nmodule.exports = { historyStorageKey, parseStoredHistory, clearStoredHistory };\n`
);

let historyFns;
let extractionOk = false;
try {
  historyFns = require(tempModule);
  extractionOk =
    typeof historyFns.historyStorageKey === 'function' &&
    typeof historyFns.parseStoredHistory === 'function' &&
    typeof historyFns.clearStoredHistory === 'function';
} catch (err) {
  test('Extracting production functions into a runnable module', false, String(err));
} finally {
  try {
    fs.unlinkSync(tempModule);
  } catch {}
}
test('Extracted history functions are executable', extractionOk);
if (!extractionOk) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('❌ Aborting: could not execute real production functions.');
  process.exit(1);
}

const { historyStorageKey, parseStoredHistory, clearStoredHistory } = historyFns;

// --- Key namespacing ---
test(
  'Anonymous user uses the shared prefix key',
  historyStorageKey(null) === 'nl-to-sql-history' &&
    historyStorageKey('') === 'nl-to-sql-history'
);

test(
  'Authenticated user gets a user-scoped key',
  historyStorageKey('user-1') === 'nl-to-sql-history:user-1'
);

test(
  'Different users receive different keys (isolation)',
  historyStorageKey('user-1') !== historyStorageKey('user-2')
);

// --- Defensive parsing ---
test('parseStoredHistory(null) returns []', Array.isArray(parseStoredHistory(null)) && parseStoredHistory(null).length === 0);

test('parseStoredHistory("") returns []', Array.isArray(parseStoredHistory('')) && parseStoredHistory('').length === 0);

test('parseStoredHistory(malformed JSON) returns []', Array.isArray(parseStoredHistory('{not json')) && parseStoredHistory('{not json').length === 0);

test('parseStoredHistory("null") returns []', Array.isArray(parseStoredHistory('null')) && parseStoredHistory('null').length === 0);

test('parseStoredHistory(valid non-array JSON) returns []', Array.isArray(parseStoredHistory('{"nope": true}')) && parseStoredHistory('{"nope": true}').length === 0);

test('parseStoredHistory(valid entry array) parses entries', (() => {
  const out = parseStoredHistory(JSON.stringify([{
    id: 'a1', question: 'q', sql: 'SELECT 1', explanation: 'e', isSafe: 'true', timestamp: '2026-01-01T00:00:00.000Z', favorite: false,
  }]));
  return Array.isArray(out) && out.length === 1 && out[0].id === 'a1';
})());

test('parseStoredHistory filters malformed entries out of a mixed array', (() => {
  const mixed = [
    { id: 'a1', question: 'q', sql: 'SELECT 1', explanation: 'e', isSafe: 'true', timestamp: '2026-01-01T00:00:00.000Z', favorite: false },
    { id: 'a2', question: 'q', sql: 'SELECT 1' },
    'garbage',
    null,
    { id: 'a3', question: 'q', sql: 'SELECT 1', explanation: 'e', isSafe: 'true', timestamp: 'yesterday', favorite: true },
  ];
  const out = parseStoredHistory(JSON.stringify(mixed));
  return (
    Array.isArray(out) &&
    out.length === 2 &&
    out[0].id === 'a1' &&
    out[1].id === 'a3'
  );
})());

// --- clearStoredHistory must remove only the current user's namespaced key ---
test(
  'clearStoredHistory removes via localStorage.removeItem (not clear)',
  /localStorage\.removeItem\(historyStorageKey\(userId\)\)/.test(historySource) &&
    !/localStorage\.clear\(\)/.test(
      historySource.slice(historySource.indexOf('clearStoredHistory'))
    )
);

test(
  'clearStoredHistory is exported for use by the logout flow',
  /export function clearStoredHistory/.test(historySource)
);

// Polyfilled browser storage
function createStorage(initial) {
  const store = Object.assign({}, initial);
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _keys: () => Object.keys(store),
  };
}

function withBrowser(ls, fn) {
  const prevWindow = global.window;
  const prevLocalStorage = global.localStorage;
  global.window = {};
  global.localStorage = ls;
  try {
    fn();
  } finally {
    if (prevWindow === undefined) delete global.window; else global.window = prevWindow;
    if (prevLocalStorage === undefined) delete global.localStorage; else global.localStorage = prevLocalStorage;
  }
}

function clearFor(initial, userId) {
  const ls = createStorage(initial);
  withBrowser(ls, () => clearStoredHistory(userId));
  return ls;
}

const sampleEntry = JSON.stringify({
  id: 'a1', question: 'How many customers are active?', sql: 'SELECT 1', explanation: 'x', isSafe: 'true', timestamp: '2026-01-01T00:00:00.000Z', favorite: false,
});

const preLoad = {
  'nl-to-sql-history:user-1': `[${sampleEntry}]`,
  'nl-to-sql-history:user-2': `[${sampleEntry}]`,
  'nl-to-sql-theme': 'dark',
  'some-other-key': 'untouched',
};

const afterLogout = clearFor(preLoad, 'user-1');

test(
  'Logout removes only the current user (user-1) history key',
  afterLogout.getItem('nl-to-sql-history:user-1') === null
);

test('Logout leaves the other user (user-2) history key intact', afterLogout.getItem('nl-to-sql-history:user-2') !== null);

test('Logout leaves the theme preference intact', afterLogout.getItem('nl-to-sql-theme') === 'dark');

test('Logout leaves unrelated browser keys intact', afterLogout.getItem('some-other-key') === 'untouched');

// --- Next-session initializer yields [] for the logged-out user ---
test(
  'Next session initializer yields empty history for user-1 after logout',
  parseStoredHistory(afterLogout.getItem('nl-to-sql-history:user-1')).length === 0
);

// --- TopNav invokes the user-scoped clear before the POST to /logout ---
const topNavSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'app', '(protected)', 'components', 'TopNav.tsx'),
  'utf8'
);
test(
  'TopNav clears the namespaced history via clearStoredHistory(userId)',
  /clearStoredHistory\(userId\)/.test(topNavSource)
);
test('TopNav logout form posts to /logout', /action="\/logout"/.test(topNavSource));
test('TopNav logout form uses POST', /method="post"/.test(topNavSource));
test(
  'TopNav logout form clears history on submit',
  /onSubmit=\{\(\) => clearStoredHistory\(userId\)\}/.test(topNavSource)
);

test(
  'TopNav reads the session user via useSessionUserId',
  /const userId = useSessionUserId\(\)/.test(topNavSource)
);

// --- Pages consume the user-scoped history; provider threads the userId ---
const workspaceSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'app', '(protected)', 'page.tsx'),
  'utf8'
);
const historyPageSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'app', '(protected)', 'history', 'page.tsx'),
  'utf8'
);
const layoutSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'app', '(protected)', 'layout.tsx'),
  'utf8'
);

test('Workspace page scopes useHistory to the session user', /\{ history, addEntry, toggleFavorite \} = useHistory\(userId\)/.test(workspaceSource));

test('History page scopes useHistory to the session user', /\{ history, toggleFavorite, deleteEntry, clearHistory \} = useHistory\(userId\)/.test(historyPageSource));

test('Protected layout provides the session userId to the app', /userId=\{session\.userId \?\? null\}/.test(layoutSource));

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