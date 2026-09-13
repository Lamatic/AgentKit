// Local self-check for the classification logic in
// scripts/license-compliance-auditor_code-node-210_code.ts
// (duplicated here as plain Node since the codeNode body uses Lamatic's
// {{triggerNode_1.output.x}} templating and isn't valid standalone JS).
//
// Run: node samples/test_classifier.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DEFAULT_ALLOW_LIST = [
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'Unlicense', 'CC0-1.0'
];
const COPYLEFT_LICENSES = [
  'GPL-1.0', 'GPL-2.0', 'GPL-3.0', 'AGPL-1.0', 'AGPL-3.0',
  'LGPL-2.1', 'LGPL-3.0', 'SSPL-1.0', 'CC-BY-SA-4.0', 'EUPL-1.2'
];

function stripParens(license) {
  if (!license || typeof license !== 'string') return '';
  return license.trim().replace(/^\(|\)$/g, '').trim();
}

function classifySingle(license, allowSet, copyleftSet) {
  if (!license || license.toUpperCase() === 'UNKNOWN') {
    return { status: 'REVIEW_NEEDED', reason: 'No license declared for this dependency.' };
  }
  if (copyleftSet.has(license)) {
    return { status: 'BLOCKED', reason: `'${license}' is a copyleft license that may impose reciprocal obligations on this project.` };
  }
  if (allowSet.has(license)) {
    return { status: 'OK', reason: `'${license}' is on the approved allow-list.` };
  }
  return { status: 'REVIEW_NEEDED', reason: `'${license}' is not on the allow-list and is not a recognized copyleft license — needs manual classification.` };
}

// Honors SPDX OR (dual-licensed: OK if any operand allow-listed) and
// AND (compound: BLOCKED if any operand copyleft) expressions instead
// of only looking at the first term.
function classify(dep, allowSet, copyleftSet) {
  const expr = stripParens(dep.license);

  if (!expr) {
    return { status: 'REVIEW_NEEDED', reason: 'No license declared for this dependency.' };
  }

  // Only flat "A OR B" / "A AND B" expressions are parsed; anything nested
  // (parens remaining after stripping one outer wrap) or mixing both
  // operators is routed to REVIEW_NEEDED rather than guessed at.
  if (/[()]/.test(expr) || (/\sOR\s/i.test(expr) && /\sAND\s/i.test(expr))) {
    return { status: 'REVIEW_NEEDED', reason: `'${expr}' is a nested or mixed SPDX expression — automated classification only supports flat OR or flat AND expressions; needs manual review.` };
  }

  if (/\sOR\s/i.test(expr)) {
    const operands = expr.split(/\s+OR\s+/i).map(stripParens);
    const allowed = operands.find(op => allowSet.has(op));
    if (allowed) {
      return { status: 'OK', reason: `Dual-licensed as '${expr}'; the '${allowed}' option is on the approved allow-list.` };
    }
    if (operands.every(op => copyleftSet.has(op))) {
      return { status: 'BLOCKED', reason: `Every option in '${expr}' is a copyleft license.` };
    }
    return { status: 'REVIEW_NEEDED', reason: `None of the options in '${expr}' are on the allow-list — needs manual classification.` };
  }

  if (/\sAND\s/i.test(expr)) {
    const operands = expr.split(/\s+AND\s+/i).map(stripParens);
    const blocking = operands.find(op => copyleftSet.has(op));
    if (blocking) {
      return { status: 'BLOCKED', reason: `'${expr}' includes copyleft component '${blocking}', whose obligations apply to the combined work.` };
    }
    if (operands.every(op => allowSet.has(op))) {
      return { status: 'OK', reason: `Every component of '${expr}' is on the approved allow-list.` };
    }
    return { status: 'REVIEW_NEEDED', reason: `'${expr}' includes an unrecognized license component — needs manual classification.` };
  }

  return classifySingle(expr, allowSet, copyleftSet);
}

const allowSet = new Set(DEFAULT_ALLOW_LIST);
const copyleftSet = new Set(COPYLEFT_LICENSES);

const fixturePath = path.join(__dirname, 'sample_dependency_licenses.json');
const deps = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const findings = Object.fromEntries(deps.map(d => [d.name, classify(d, allowSet, copyleftSet)]));

assert.strictEqual(findings['react'].status, 'OK', 'MIT dependency should be OK');
assert.strictEqual(findings['gnu-diff-tool'].status, 'BLOCKED', 'GPL-3.0 dependency should be BLOCKED');
assert.strictEqual(findings['some-internal-fork'].status, 'REVIEW_NEEDED', 'Missing license should be REVIEW_NEEDED');

// SPDX compound-expression cases (both operand orders).
assert.strictEqual(
  classify({ license: 'GPL-3.0 OR MIT' }, allowSet, copyleftSet).status, 'OK',
  'Dual-licensed "GPL-3.0 OR MIT" should be OK (MIT option available)'
);
assert.strictEqual(
  classify({ license: 'MIT OR GPL-3.0' }, allowSet, copyleftSet).status, 'OK',
  'Dual-licensed "MIT OR GPL-3.0" should be OK regardless of operand order'
);
assert.strictEqual(
  classify({ license: 'GPL-3.0 OR AGPL-3.0' }, allowSet, copyleftSet).status, 'BLOCKED',
  'Dual-licensed with only copyleft options should be BLOCKED'
);
assert.strictEqual(
  classify({ license: 'Apache-2.0 AND GPL-3.0' }, allowSet, copyleftSet).status, 'BLOCKED',
  'Compound "AND" expression with a copyleft component should be BLOCKED'
);
assert.strictEqual(
  classify({ license: 'MIT AND Apache-2.0' }, allowSet, copyleftSet).status, 'OK',
  'Compound "AND" expression with only allow-listed components should be OK'
);

// Nested/mixed expressions: must never silently misclassify (e.g. drop a
// copyleft obligation), so they're conservatively routed to REVIEW_NEEDED.
assert.strictEqual(
  classify({ license: 'GPL-3.0 AND (MIT OR Apache-2.0)' }, allowSet, copyleftSet).status, 'REVIEW_NEEDED',
  'Nested mixed expression must NOT resolve to OK (would silently drop the GPL-3.0 obligation)'
);
assert.strictEqual(
  classify({ license: 'GPL-3.0 OR (MIT AND Apache-2.0)' }, allowSet, copyleftSet).status, 'REVIEW_NEEDED',
  'Nested mixed expression should be routed to manual review, not guessed at'
);

console.log('All classifier checks passed:');
console.log(' - react (MIT)                    ->', findings['react'].status);
console.log(' - gnu-diff-tool (GPL-3.0)        ->', findings['gnu-diff-tool'].status);
console.log(' - some-internal-fork ("")        ->', findings['some-internal-fork'].status);
console.log(' - "GPL-3.0 OR MIT"               ->', classify({ license: 'GPL-3.0 OR MIT' }, allowSet, copyleftSet).status);
console.log(' - "MIT OR GPL-3.0"               ->', classify({ license: 'MIT OR GPL-3.0' }, allowSet, copyleftSet).status);
console.log(' - "GPL-3.0 OR AGPL-3.0"          ->', classify({ license: 'GPL-3.0 OR AGPL-3.0' }, allowSet, copyleftSet).status);
console.log(' - "Apache-2.0 AND GPL-3.0"       ->', classify({ license: 'Apache-2.0 AND GPL-3.0' }, allowSet, copyleftSet).status);
console.log(' - "MIT AND Apache-2.0"           ->', classify({ license: 'MIT AND Apache-2.0' }, allowSet, copyleftSet).status);
