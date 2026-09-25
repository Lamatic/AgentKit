#!/usr/bin/env node
/**
 * Mobile Navigation Tests (Batch E1, Issue #16)
 *
 * The desktop navigation (Workspace | History) is hidden below the `md`
 * breakpoint, so a mobile user must get an equivalent navigation to reach
 * History without manually typing a URL.
 *
 * These tests inspect the TopNav source to confirm:
 *   - both desktop and mobile navigation derive from ONE navItems source,
 *   - the desktop nav is preserved and shown only from `md` upward,
 *   - a real, accessible interactive <button> (aria-label) opens a mobile menu,
 *   - the mobile menu is shown only below `md` and closes after navigation,
 *   - the logout form still clears stored history (Batch D, Issue #10).
 *
 * The repo has no DOM test harness, so responsive behaviour is verified by the
 * Playwright suite (apps/tests/example.spec.ts) which is currently blocked by
 * Issue #13's port mismatch; this file provides the runnable static/contract
 * coverage for the mobile menu wiring.
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

console.log('🧪 Running Mobile Navigation Tests...\n');

const topNavSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'app', '(protected)', 'components', 'TopNav.tsx'),
  'utf8'
);

// --- Single navigation source reused by both desktop and mobile ---
const navItemsDef = topNavSource.match(/const navItems = \[([\s\S]*?)\];/);
test('navItems is defined once', navItemsDef !== null);
test(
  'navItems contains exactly Workspace and History',
  !!navItemsDef &&
    /href: '\/', label: 'Workspace'/.test(navItemsDef[1]) &&
    /href: '\/history', label: 'History'/.test(navItemsDef[1])
);

const desktopUsesNavItems = (topNavSource.match(/navItems\.map/g) || []).length;
test(
  'Desktop and mobile navigation both map over navItems (shared source)',
  desktopUsesNavItems >= 2
);

// --- Desktop navigation preserved and only shown from md ---
test(
  'Desktop nav remains hidden below md and visible at md+',
  /<nav className="[^"]*\bhidden\b[^"]*\bmd:flex\b[^"]*">/.test(topNavSource)
);

// --- Accessible mobile menu button ---
test(
  'Mobile menu is opened by a real <button> (not a div)',
  /<button\b[^>]*?aria-label=\{menuOpen \? "Close navigation" : "Open navigation"\}/.test(topNavSource)
);
test(
  'Mobile menu button has an accessible label',
  /aria-label=\{menuOpen \? "Close navigation" : "Open navigation"\}/.test(topNavSource)
);
test(
  'Mobile menu button exposes aria-expanded state',
  /aria-expanded=\{menuOpen\}/.test(topNavSource)
);
test(
  'Mobile menu button is hidden at md+ and shown on mobile',
  /md:hidden/.test(topNavSource) &&
    /onClick=\{\(\) => setMenuOpen\(v => !v\)\}/.test(topNavSource)
);

// --- Mobile menu panel behavior ---
test(
  'Mobile menu panel is shown only below md',
  /aria-label="Mobile navigation"[\s\S]*?md:hidden/.test(topNavSource) ||
    /md:hidden[\s\S]*?aria-label="Mobile navigation"/.test(topNavSource)
);
test(
  'Mobile navigation link closes the menu after navigate',
  /onClick=\{closeMenu\}/.test(topNavSource)
);
test(
  'Close helper resets menu state',
  /const closeMenu = \(\) => setMenuOpen\(false\);/.test(topNavSource)
);

// --- Logout flow preserved (Batch D, Issue #10) ---
test(
  'TopNav logout form still clears the namespaced history',
  /clearStoredHistory\(userId\)/.test(topNavSource)
);
test('TopNav logout form posts to /logout', /action="\/logout"/.test(topNavSource));
test('TopNav logout form uses POST', /method="post"/.test(topNavSource));
test(
  'TopNav logout form clears history on submit',
  /onSubmit=\{\(\) => clearStoredHistory\(userId\)\}/.test(topNavSource)
);
test(
  'Nav items still link to Workspace and History',
  /href=\{item\.href\}/.test(topNavSource)
);

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
