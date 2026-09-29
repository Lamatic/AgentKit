#!/usr/bin/env node
/**
 * SQL Generation Output Contract Tests
 *
 * Verifies that the SQL-generation prompts enforce a single, unambiguous
 * SQL-only output contract:
 * 1. The prompts no longer instruct the model to emit an `intent` field.
 * 2. The prompts require exactly one executable SQL query and no other text.
 * 3. The prompts forbid explanations, assumptions, JSON, Markdown, comments,
 *    and code fences in the output.
 * 4. Representative generated SQL (ambiguous and clear requests) still passes
 *    the validation pipeline and TOP 1000 normalization.
 * 5. Non-SQL artifacts (intent prefixes, Markdown fences, JSON) are rejected
 *    by the SQL validator, which is why the prompt must be SQL-only.
 */

// ============================================================================
// LOAD THE REAL PRODUCTION IMPLEMENTATION
// ============================================================================

const fs = require('fs');
const path = require('path');

const { loadProductionValidator } = require('./load-validator');

const { validateAndNormalizeSql } = loadProductionValidator();

// ============================================================================
// PROMPT CONTRACT CHECKS
// ============================================================================

const promptsDir = path.join(__dirname, '..', 'prompts');
const systemPrompt = fs.readFileSync(
  path.join(promptsDir, 'nl-to-sql-agent_intent-node_system.md'),
  'utf8'
);
const userPrompt = fs.readFileSync(
  path.join(promptsDir, 'nl-to-sql-agent_intent-node_user.md'),
  'utf8'
);
const combinedPrompt = `${systemPrompt}\n${userPrompt}`;

const promptChecks = [
  {
    name: 'System prompt no longer instructs emitting an intent field',
    check: () => !/note .*intent\s*field/i.test(systemPrompt)
      && !/make reasonable assumptions and note/i.test(systemPrompt),
  },
  {
    name: 'System prompt explicitly forbids intent fields in output',
    check: () => /do not include .*intent\s*fields/i.test(systemPrompt),
  },
  {
    name: 'System prompt requires SQL-only output',
    check: () => /output only the executable sql query/i.test(systemPrompt),
  },
  {
    name: 'System prompt forbids explanations, assumptions, JSON and Markdown',
    check: () => /do not include .*explanations.*assumptions.*json.*markdown.*code fences/i.test(systemPrompt),
  },
  {
    name: 'User prompt requires raw executable SQL only',
    check: () => /output only the raw executable sql query/i.test(userPrompt),
  },
  {
    name: 'User prompt forbids intent fields, assumptions and code fences',
    check: () => /do not include an intent field, assumptions, explanations, json, markdown code fences/i.test(userPrompt),
  },
  {
    name: 'Combined prompt contains no JSON-output instruction',
    check: () => !/\boutput\b[^\n]*\{/i.test(combinedPrompt),
  },
  {
    name: 'System prompt embeds the approved database schema JSON',
    check: () =>
      /APPROVED DATABASE SCHEMA/.test(systemPrompt) &&
      /"name": "nl_to_sql_customers_10000"/.test(systemPrompt) &&
      /"name": "customer_id"/.test(systemPrompt) &&
      /"name": "data_usage_gb"/.test(systemPrompt),
  },
  {
    name: 'Schema instructs SQL grounding in declared tables and columns only',
    check: () => /use only the tables and columns defined in the schema/i.test(systemPrompt),
  },
];

// ============================================================================
// EXPLANATION PROMPT MUST REMAIN INTACT
// ============================================================================

const explanationPrompt = fs.readFileSync(
  path.join(promptsDir, 'nl-to-sql-agent_explanation-node_system.md'),
  'utf8'
);

const explanationCheck = {
  name: 'Explanation prompt still documents the user-facing intent focus',
  check: () => /focus on the intent/i.test(explanationPrompt),
};

// ============================================================================
// REPRESENTATIVE VALIDATION CASES
// ============================================================================

const validationCases = [
  // Ambiguous but interpretable request - the model may interpret internally
  {
    name: 'Ambiguous request (recent customers) yields acceptable SQL',
    input: 'SELECT TOP 1000 * FROM Customers WHERE CreatedAt >= DATEADD(DAY, -30, GETDATE()) ORDER BY CreatedAt DESC',
    expectedSafe: true,
    expectedSql: 'SELECT TOP 1000 * FROM Customers WHERE CreatedAt >= DATEADD(DAY, -30, GETDATE()) ORDER BY CreatedAt DESC',
  },
  // Clear request
  {
    name: 'Clear request (top 10 by revenue) yields acceptable SQL',
    input: 'SELECT TOP 10 CustomerId, SUM(TotalAmount) AS TotalSales FROM Orders GROUP BY CustomerId ORDER BY TotalSales DESC',
    expectedSafe: true,
    expectedSql: 'SELECT TOP 10 CustomerId, SUM(TotalAmount) AS TotalSales FROM Orders GROUP BY CustomerId ORDER BY TotalSales DESC',
  },
  // No TOP clause receives TOP 1000 normalization
  {
    name: 'No TOP clause is normalized to TOP 1000',
    input: 'SELECT * FROM Customers WHERE CreatedAt >= DATEADD(DAY, -30, GETDATE())',
    expectedSafe: true,
    expectedSql: 'SELECT TOP 1000 * FROM Customers WHERE CreatedAt >= DATEADD(DAY, -30, GETDATE())',
  },
  // Non-SQL artifacts that the prompt forbids are rejected by the validator
  {
    name: 'intent-prefixed output is rejected by SQL validation',
    input: 'intent: Assuming "recent" means the last 30 days.\n\nSELECT * FROM Customers WHERE CreatedAt >= DATEADD(DAY, -30, GETDATE())',
    expectedSafe: false,
  },
  {
    name: 'Markdown-fenced SQL is rejected by SQL validation',
    input: '```sql\nSELECT * FROM Customers\n```',
    expectedSafe: false,
  },
  {
    name: 'JSON output is rejected by SQL validation',
    input: '{"intent": "Find recent customers", "sql": "SELECT * FROM Customers"}',
    expectedSafe: false,
  },
  {
    name: 'Write operations remain rejected',
    input: 'UPDATE Customers SET Status = "Inactive"',
    expectedSafe: false,
  },
  {
    name: 'SELECT INTO (table creation) is rejected',
    input: 'SELECT CustomerId, Name INTO CustomerBackup FROM Customers',
    expectedSafe: false,
  },
  {
    name: 'TOP PERCENT is rejected',
    input: 'SELECT TOP 100 PERCENT * FROM Customers',
    expectedSafe: false,
  },
  {
    name: 'TOP WITH TIES is rejected',
    input: 'SELECT TOP 1000 WITH TIES * FROM Customers ORDER BY CustomerId',
    expectedSafe: false,
  },
];

// ============================================================================
// RUN TESTS
// ============================================================================

let passedTests = 0;
let failedTests = 0;
const allChecks = [
  ...promptChecks,
  explanationCheck,
];

console.log('Running SQL Generation Output Contract Tests...\n');

allChecks.forEach((testCase) => {
  let passed = true;
  let failureReason = '';

  try {
    passed = testCase.check() === true;
  } catch (error) {
    passed = false;
    failureReason = error.message;
  }

  if (!passed && !failureReason) {
    failureReason = 'Contract assertion returned false';
  }

  if (passed) {
    passedTests++;
    console.log(`PASS: ${testCase.name}`);
  } else {
    failedTests++;
    console.log(`FAIL: ${testCase.name}`);
    console.log(`   Reason: ${failureReason}\n`);
  }
});

console.log('');

validationCases.forEach((testCase) => {
  const result = validateAndNormalizeSql(testCase.input);

  let passed = true;
  let failureReason = '';

  if (testCase.expectedSafe !== result.isSafe) {
    passed = false;
    failureReason = `Expected isSafe=${testCase.expectedSafe}, got ${result.isSafe}`;
  }

  if (passed && testCase.expectedSql !== undefined && result.safeSql !== testCase.expectedSql) {
    passed = false;
    failureReason = `SQL mismatch.\nExpected: ${testCase.expectedSql}\nGot:      ${result.safeSql}`;
  }

  if (passed) {
    passedTests++;
    console.log(`PASS: ${testCase.name}`);
  } else {
    failedTests++;
    console.log(`FAIL: ${testCase.name}`);
    if (failureReason) {
      console.log(`   Reason: ${failureReason}\n`);
    }
  }
});

// Summary
const totalTests = allChecks.length + validationCases.length;
console.log('\n' + '='.repeat(60));
console.log('Test Summary:');
console.log(`   Passed: ${passedTests}/${totalTests}`);
console.log(`   Failed: ${failedTests}/${totalTests}`);
console.log('='.repeat(60));

if (failedTests === 0) {
  console.log('All tests passed!');
  process.exit(0);
} else {
  console.log('Some tests failed.');
  process.exit(1);
}
