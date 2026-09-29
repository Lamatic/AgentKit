#!/usr/bin/env node
/**
 * Shared loader for the production validation script, used by the Node test
 * suites in this directory (validation, prompt-contract, unsafe-branch).
 *
 * The production script's function definitions live before the Lamatic runtime
 * tail (which references the runtime-injected `LLMNode_sql_gen` variable and so
 * cannot be executed here). This helper extracts that head, writes it to a temp
 * .ts module (Node 22.6+ type-strips the annotations), requires it, and exposes
 * the real functions so the suites exercise the actual production
 * implementation, never a local copy.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { stripTypeScriptTypes } = require('node:module');

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'nl-to-sql-agent_validation-node.ts');
const TAIL_MARKER = '// Execute validation and normalization';

/**
 * Loads the production validation script's head (everything before the Lamatic
 * runtime tail) as a real module and returns its exported functions.
 *
 * Fails loudly when the environment is too old or the tail marker moves so the
 * suites never silently run against a stale local copy.
 */
function loadProductionValidator() {
  if (typeof stripTypeScriptTypes !== 'function') {
    throw new Error(
      'This suite requires Node.js >= 22.18 (module.stripTypeScriptTypes). ' +
        'The kit declares engines.node >= 22.18.0 in apps/package.json.'
    );
  }

  const scriptSource = fs.readFileSync(SCRIPT_PATH, 'utf8');
  const tailIndex = scriptSource.indexOf(TAIL_MARKER);
  if (tailIndex === -1) {
    throw new Error(
      `Could not find the production tail marker ("${TAIL_MARKER}") in ${SCRIPT_PATH}. ` +
        'The script structure changed; update tests/load-validator.js before trusting this suite.'
    );
  }

  const funcsSource = scriptSource.slice(0, tailIndex);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nl-to-sql-validator-'));
  const tempModule = path.join(tempDir, 'validator.ts');
  fs.writeFileSync(
    tempModule,
    `${funcsSource}\nmodule.exports = { findOuterTop, normalizeTopClause, stripQuotedStringsAndComments, validateSqlSafety, validateAndNormalizeSql };\n`
  );

  try {
    return require(tempModule);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

module.exports = { loadProductionValidator };