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

function normalize(license) {
  if (!license || typeof license !== 'string') return '';
  return license.trim().replace(/^\(|\)$/g, '').split(/\s+OR\s+|\s+AND\s+/i)[0].trim();
}

function classify(dep, allowSet, copyleftSet) {
  const license = normalize(dep.license);
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

const allowSet = new Set(DEFAULT_ALLOW_LIST);
const copyleftSet = new Set(COPYLEFT_LICENSES);

const fixturePath = path.join(__dirname, 'sample_dependency_licenses.json');
const deps = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const findings = Object.fromEntries(deps.map(d => [d.name, classify(d, allowSet, copyleftSet)]));

assert.strictEqual(findings['react'].status, 'OK', 'MIT dependency should be OK');
assert.strictEqual(findings['gnu-diff-tool'].status, 'BLOCKED', 'GPL-3.0 dependency should be BLOCKED');
assert.strictEqual(findings['some-internal-fork'].status, 'REVIEW_NEEDED', 'Missing license should be REVIEW_NEEDED');

console.log('All classifier checks passed:');
console.log(' - react (MIT)              ->', findings['react'].status);
console.log(' - gnu-diff-tool (GPL-3.0)  ->', findings['gnu-diff-tool'].status);
console.log(' - some-internal-fork ("")  ->', findings['some-internal-fork'].status);
