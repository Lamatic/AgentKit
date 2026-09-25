#!/usr/bin/env node
/**
 * SQL Validation and Normalization Tests
 *
 * Tests for the production validateAndNormalizeSql implementation in
 * scripts/nl-to-sql-agent_validation-node.ts to ensure:
 * 1. Queries without an outer TOP receive TOP 1000
 * 2. Queries with a safe outer TOP (<=1000) remain unchanged
 * 3. Queries with an outer TOP >1000 are normalized to TOP 1000
 * 4. A TOP inside a nested/subquery must NOT satisfy the outer row limit
 * 5. Unsafe SQL is properly rejected, including SELECT INTO hidden by comments
 * 6. Multiple statements are rejected
 * 7. Write/DDL operations are rejected
 *
 * The functions under test are extracted from the actual production script so
 * the tests exercise the real implementation, not a locally copied version.
 */

// ============================================================================
// LOAD THE REAL PRODUCTION IMPLEMENTATION
// ============================================================================

const { loadProductionValidator } = require('./load-validator');

const { normalizeTopClause, stripQuotedStringsAndComments, validateAndNormalizeSql } = loadProductionValidator();

// ============================================================================
// TEST CASES
// ============================================================================

const testCases = [
  // Case A: No TOP clause
  {
    name: 'No TOP clause',
    input: 'SELECT * FROM Customers',
    expectedSql: 'SELECT TOP 1000 * FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  // Case B: Safe TOP (below maximum)
  {
    name: 'Safe TOP (100)',
    input: 'SELECT TOP 100 * FROM Customers',
    expectedSql: 'SELECT TOP 100 * FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  // Case C: TOP equals maximum
  {
    name: 'TOP equals maximum (1000)',
    input: 'SELECT TOP 1000 * FROM Customers',
    expectedSql: 'SELECT TOP 1000 * FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  // Case D: Oversized TOP
  {
    name: 'Oversized TOP (5000)',
    input: 'SELECT TOP 5000 * FROM Customers',
    expectedSql: 'SELECT TOP 1000 * FROM Customers',
    expectedSafe: true,
    expectedCapped: true,
  },
  // Case E: Very large TOP
  {
    name: 'Very large TOP (999999)',
    input: 'SELECT TOP 999999 * FROM Customers',
    expectedSql: 'SELECT TOP 1000 * FROM Customers',
    expectedSafe: true,
    expectedCapped: true,
  },
  // Case F: SELECT DISTINCT no TOP
  {
    name: 'SELECT DISTINCT without TOP',
    input: 'SELECT DISTINCT Name FROM Customers',
    expectedSql: 'SELECT DISTINCT TOP 1000 Name FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'SELECT with parenthesized projection without whitespace is capped',
    input: 'SELECT(CustomerId) FROM Customers',
    expectedSql: 'SELECT TOP 1000 (CustomerId) FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'SELECT with an immediate block comment is capped',
    input: 'SELECT/* c */ * FROM Customers',
    expectedSql: 'SELECT TOP 1000 /* c */ * FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'SELECT DISTINCT with an immediate parenthesis is capped before DISTINCT',
    input: 'SELECT DISTINCT(Name) FROM Customers',
    expectedSql: 'SELECT DISTINCT TOP 1000 (Name) FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'SELECT ALL is capped before ALL',
    input: 'SELECT ALL Name FROM Customers',
    expectedSql: 'SELECT ALL TOP 1000 Name FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'SELECT with a block comment before DISTINCT is capped after DISTINCT',
    input: 'SELECT/* c */DISTINCT Name FROM Customers',
    expectedSql: 'SELECT/* c */DISTINCT TOP 1000 Name FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'SELECT with a block comment before ALL is capped after ALL',
    input: 'SELECT/* c */ALL Name FROM Customers',
    expectedSql: 'SELECT/* c */ALL TOP 1000 Name FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'SELECT with spaced block comment and DISTINCT is capped after DISTINCT',
    input: 'SELECT /* c */ DISTINCT Name FROM Customers',
    expectedSql: 'SELECT /* c */ DISTINCT TOP 1000 Name FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'SELECT with a line comment before DISTINCT is capped after DISTINCT',
    input: 'SELECT-- note\nDISTINCT Name FROM Customers',
    expectedSql: 'SELECT-- note\nDISTINCT TOP 1000 Name FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  // Case G: Complex query with columns and WHERE
  {
    name: 'Complex query with WHERE',
    input: 'SELECT TOP 5000 CustomerId, Name FROM Customers WHERE Status = "Active"',
    expectedSql: 'SELECT TOP 1000 CustomerId, Name FROM Customers WHERE Status = "Active"',
    expectedSafe: true,
    expectedCapped: true,
  },
  // Case H: TOP with parentheses
  {
    name: 'TOP with parentheses',
    input: 'SELECT TOP (2000) * FROM Customers',
    expectedSql: 'SELECT TOP 1000 * FROM Customers',
    expectedSafe: true,
    expectedCapped: true,
  },

  // === Issue #3: outer-query TOP detection ===
  {
    name: 'No outer TOP, no nested TOP -> outer TOP 1000',
    input: 'SELECT * FROM Customers',
    expectedSql: 'SELECT TOP 1000 * FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'Nested scalar subquery TOP 1, no outer TOP -> outer TOP 1000',
    input: 'SELECT (SELECT TOP 1 name FROM sys.objects) AS name FROM sys.objects',
    expectedSql: 'SELECT TOP 1000 (SELECT TOP 1 name FROM sys.objects) AS name FROM sys.objects',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'Nested derived-table TOP 1, no outer TOP -> outer TOP 1000',
    input: 'SELECT o.name FROM (SELECT TOP 1 name FROM sys.objects) o',
    expectedSql: 'SELECT TOP 1000 o.name FROM (SELECT TOP 1 name FROM sys.objects) o',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'Outer TOP 100 is preserved (even with nested TOP)',
    input: 'SELECT TOP 100 (SELECT TOP 1 name FROM sys.objects) AS name FROM sys.objects',
    expectedSql: 'SELECT TOP 100 (SELECT TOP 1 name FROM sys.objects) AS name FROM sys.objects',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'Outer TOP (100) preserved',
    input: 'SELECT TOP (100) * FROM Customers',
    expectedSql: 'SELECT TOP (100) * FROM Customers',
    expectedSafe: true,
    expectedCapped: false,
  },
  {
    name: 'Oversized outer TOP with nested TOP only caps the outer',
    input: 'SELECT TOP 5000 (SELECT TOP 1 name FROM sys.objects) AS name FROM sys.objects',
    expectedSql: 'SELECT TOP 1000 (SELECT TOP 1 name FROM sys.objects) AS name FROM sys.objects',
    expectedSafe: true,
    expectedCapped: true,
  },
  {
    name: 'TOP inside string literal does not satisfy outer limit',
    input: "SELECT 'TOP 5 literal' AS label FROM Customers",
    expectedSql: "SELECT TOP 1000 'TOP 5 literal' AS label FROM Customers",
    expectedSafe: true,
    expectedCapped: false,
  },

  // === Unsafe cases ===
  {
    name: 'DELETE statement',
    input: 'DELETE FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  {
    name: 'UPDATE statement',
    input: 'UPDATE Customers SET Status = "Inactive"',
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  {
    name: 'DROP statement',
    input: 'DROP TABLE Customers',
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  {
    name: 'Multiple SELECT statements',
    input: 'SELECT * FROM Customers; SELECT * FROM Orders',
    expectedSafe: false,
    expectedErrorPattern: /Multiple SQL statements/i,
  },
  {
    name: 'INSERT statement',
    input: 'INSERT INTO Customers VALUES (1, "John")',
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  {
    name: 'ALTER statement',
    input: 'ALTER TABLE Customers ADD COLUMN NewField INT',
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  {
    name: 'CREATE statement',
    input: 'CREATE TABLE Customers (id INT, name NVARCHAR(100))',
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  // Ad-hoc rowset functions (SSRF via outbound DB connections)
  {
    name: 'OPENROWSET is rejected',
    input: "SELECT * FROM OPENROWSET('SQLNCLI', 'Server=evil;Trusted_Connection=yes;', 'SELECT 1')",
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  {
    name: 'OPENQUERY is rejected',
    input: "SELECT * FROM OPENQUERY([LinkedServer], 'SELECT 1')",
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  {
    name: 'OPENDATASOURCE is rejected',
    input: "SELECT * FROM OPENDATASOURCE('SQLNCLI', 'Server=evil;Trusted_Connection=yes;').Database.dbo.Table",
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  {
    name: 'OPENXML is rejected',
    input: "SELECT * FROM OPENXML(@doc, '/root/item', 1)",
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  // SELECT INTO (table creation, not read-only)
  {
    name: 'SELECT INTO statement',
    input: 'SELECT * INTO NewTable FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /SELECT INTO/i,
  },
  {
    name: 'SELECT INTO specific columns',
    input: 'SELECT CustomerId, Name INTO CustomerBackup FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /SELECT INTO/i,
  },
  {
    name: 'SELECT INTO lower case',
    input: 'select * into NewTable from Customers',
    expectedSafe: false,
    expectedErrorPattern: /SELECT INTO/i,
  },

  // === Issue #2: comment stripping must preserve token boundaries ===
  {
    name: 'SELECT INTO hidden behind block comment is detected',
    input: 'SELECT CustomerId/* comment */INTO Audit FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /SELECT INTO/i,
  },
  {
    name: 'SELECT INTO hidden behind two block comments is detected',
    input: 'SELECT/* one */CustomerId/* two */INTO Audit FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /SELECT INTO/i,
  },
  {
    name: 'SELECT INTO hidden behind whitespace-around-comment is detected',
    input: 'SELECT CustomerId /* comment */ INTO Audit FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /SELECT INTO/i,
  },
  {
    name: 'SELECT INTO hidden behind line comment is detected',
    input: 'SELECT CustomerId -- drop me\nINTO Audit FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /SELECT INTO/i,
  },
  {
    name: 'SELECT INTO merged by uppercase block comment is detected',
    input: 'SELECT CustomerId/* hidden into */INTO Audit FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /SELECT INTO/i,
  },

  // Safe queries with keywords inside literals/comments must not be rejected.
  {
    name: 'DELETE inside a string literal is not treated as an operation',
    input: "SELECT * FROM Customers WHERE Status = 'DELETE'",
    expectedSafe: true,
    expectedSql: "SELECT TOP 1000 * FROM Customers WHERE Status = 'DELETE'",
    expectedCapped: false,
  },
  {
    name: 'Keywords inside a block comment are ignored',
    input: 'SELECT * FROM Customers /* DROP TABLE */',
    expectedSafe: true,
    expectedSql: 'SELECT TOP 1000 * FROM Customers /* DROP TABLE */',
    expectedCapped: false,
  },
  {
    name: 'Keyword-like column names in a comment are not false positives',
    input: 'SELECT * FROM Orders /* order INTO backup */',
    expectedSafe: true,
    expectedSql: 'SELECT TOP 1000 * FROM Orders /* order INTO backup */',
    expectedCapped: false,
  },

  // TOP PERCENT bypass
  {
    name: 'TOP 100 PERCENT',
    input: 'SELECT TOP 100 PERCENT * FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /TOP PERCENT/i,
  },
  {
    name: 'TOP PERCENT lower case',
    input: 'select top 100 percent * from Customers',
    expectedSafe: false,
    expectedErrorPattern: /TOP PERCENT/i,
  },
  {
    name: 'TOP PERCENT parenthesized',
    input: 'SELECT TOP (100) PERCENT * FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /TOP PERCENT/i,
  },
  {
    name: 'TOP PERCENT no space before paren',
    input: 'SELECT TOP(1000)PERCENT * FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /TOP PERCENT/i,
  },
  {
    name: 'TOP PERCENT paren followed directly by PERCENT',
    input: 'SELECT TOP (100)PERCENT * FROM Customers',
    expectedSafe: false,
    expectedErrorPattern: /TOP PERCENT/i,
  },
  // TOP WITH TIES bypass
  {
    name: 'TOP 1000 WITH TIES',
    input: 'SELECT TOP 1000 WITH TIES * FROM Customers ORDER BY CustomerId',
    expectedSafe: false,
    expectedErrorPattern: /WITH TIES/i,
  },
  {
    name: 'TOP WITH TIES smaller value',
    input: 'SELECT TOP 100 WITH TIES * FROM Customers ORDER BY CustomerId',
    expectedSafe: false,
    expectedErrorPattern: /WITH TIES/i,
  },
  {
    name: 'TOP WITH TIES lower case + paren',
    input: 'select top (1000) with ties * from Customers order by CustomerId',
    expectedSafe: false,
    expectedErrorPattern: /WITH TIES/i,
  },
  {
    name: 'TOP WITH TIES no space before paren',
    input: 'SELECT TOP(100)WITH TIES * FROM Customers ORDER BY CustomerId',
    expectedSafe: false,
    expectedErrorPattern: /WITH TIES/i,
  },
  {
    name: 'TOP WITH TIES paren followed directly by WITH',
    input: 'SELECT TOP (100)WITH TIES * FROM Customers ORDER BY CustomerId',
    expectedSafe: false,
    expectedErrorPattern: /WITH TIES/i,
  },

  // === Top-level set operations must not exceed MAX_RESULT_ROWS ===
  {
    name: 'Top-level UNION ALL is rejected (row limit bypass)',
    input: 'SELECT TOP 100 FROM A UNION ALL SELECT TOP 100 FROM B',
    expectedSafe: false,
    expectedErrorPattern: /Set operations/i,
  },
  {
    name: 'Top-level UNION is rejected (row limit bypass)',
    input: 'SELECT * FROM A UNION SELECT * FROM B',
    expectedSafe: false,
    expectedErrorPattern: /Set operations/i,
  },
  {
    name: 'Top-level EXCEPT is rejected (row limit bypass)',
    input: 'SELECT * FROM A EXCEPT SELECT * FROM B',
    expectedSafe: false,
    expectedErrorPattern: /Set operations/i,
  },
  {
    name: 'Top-level INTERSECT is rejected (row limit bypass)',
    input: 'SELECT * FROM A INTERSECT SELECT * FROM B',
    expectedSafe: false,
    expectedErrorPattern: /Set operations/i,
  },
  {
    name: 'Top-level UNION ALL lower case is rejected',
    input: 'select * from A union all select * from B',
    expectedSafe: false,
    expectedErrorPattern: /Set operations/i,
  },
  {
    name: 'Nested set operator inside a subquery stays safe',
    input: 'SELECT o.id FROM (SELECT id FROM A UNION SELECT id FROM B) o',
    expectedSafe: true,
    expectedSql: 'SELECT TOP 1000 o.id FROM (SELECT id FROM A UNION SELECT id FROM B) o',
    expectedCapped: false,
  },
  {
    name: 'UNION inside a comment is not treated as a set operator',
    input: 'SELECT * FROM Orders /* order UNION backup */',
    expectedSafe: true,
    expectedSql: 'SELECT TOP 1000 * FROM Orders /* order UNION backup */',
    expectedCapped: false,
  },
  {
    name: 'UNION inside a string literal is not treated as a set operator',
    input: "SELECT 'UNION ALL select from B' AS label FROM Customers",
    expectedSafe: true,
    expectedSql: "SELECT TOP 1000 'UNION ALL select from B' AS label FROM Customers",
    expectedCapped: false,
  },
  {
    name: 'UNION as the tail of an identifier is ignored',
    input: 'SELECT union_id FROM Customers',
    expectedSafe: true,
    expectedSql: 'SELECT TOP 1000 union_id FROM Customers',
    expectedCapped: false,
  },

  // === Bracketed T-SQL identifiers must not leak parens or keywords into the scan ===
  {
    name: 'TOP inside a bracketed column name is not treated as a TOP clause',
    input: 'SELECT [TOP(5] FROM T',
    expectedSafe: true,
    expectedSql: 'SELECT TOP 1000 [TOP(5] FROM T',
    expectedCapped: false,
  },
  {
    name: 'A bracket identifier with ( does not hide a top-level UNION',
    input: 'SELECT [a(b] FROM A UNION SELECT [c(d] FROM B',
    expectedSafe: false,
    expectedErrorPattern: /Set operations/i,
  },
  {
    name: 'An escaped ]] bracket identifier with ( does not hide a top-level UNION',
    input: 'SELECT [a]]b(c] FROM T UNION SELECT [x] FROM Y',
    expectedSafe: false,
    expectedErrorPattern: /Set operations/i,
  },

  // === Stateful scanner: an apostrophe in a -- comment must not hide a later statement ===
  {
    name: 'Unbalanced apostrophe in a comment hides no write statement',
    input: "SELECT 1 -- don't\n; DROP TABLE Customers --'",
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  {
    name: 'Unbalanced apostrophe in a comment hides no later statement',
    input: "SELECT 1 -- don't\n; SELECT 2 --'",
    expectedSafe: false,
    expectedErrorPattern: /Multiple SQL statements/i,
  },
  {
    name: 'Comment markers inside a string literal are not comments',
    input: "SELECT '-- hidden' AS label FROM Customers",
    expectedSafe: true,
    expectedSql: "SELECT TOP 1000 '-- hidden' AS label FROM Customers",
    expectedCapped: false,
  },
  {
    name: 'Block comment markers inside a string literal are not comments',
    input: "SELECT '/* hidden DROP */' AS label FROM Customers",
    expectedSafe: true,
    expectedSql: "SELECT TOP 1000 '/* hidden DROP */' AS label FROM Customers",
    expectedCapped: false,
  },

  // === CR-only line endings must terminate a -- comment ===
  {
    name: 'CR-only line break ends a comment (no hidden DROP)',
    input: 'SELECT 1 -- drop\r; DROP TABLE Customers',
    expectedSafe: false,
    expectedErrorPattern: /write or DDL/i,
  },
  {
    name: 'CR-only line break ends a comment (no hidden statement)',
    input: 'SELECT 1 -- drop\r; SELECT 2',
    expectedSafe: false,
    expectedErrorPattern: /Multiple SQL statements/i,
  },
  {
    name: 'CRLF line break ends a comment (no hidden statement)',
    input: 'SELECT 1 -- drop\r\n; SELECT 2',
    expectedSafe: false,
    expectedErrorPattern: /Multiple SQL statements/i,
  },
  {
    name: 'Empty SQL',
    input: '',
    expectedSafe: false,
    expectedErrorPattern: /empty/i,
  },
];

// ============================================================================
// RUN TESTS
// ============================================================================

let passedTests = 0;
let failedTests = 0;

console.log('🧪 Running SQL Validation and Normalization Tests...\n');

testCases.forEach((testCase, index) => {
  const result = validateAndNormalizeSql(testCase.input);

  let passed = true;
  let failureReason = '';

  // Check if test is safe or unsafe
  if (testCase.expectedErrorPattern) {
    // Unsafe SQL test
    if (result.isSafe !== false) {
      passed = false;
      failureReason = 'Expected unsafe SQL but got safe result';
    } else if (!testCase.expectedErrorPattern.test(result.error)) {
      passed = false;
      failureReason = `Error message mismatch. Expected pattern: ${testCase.expectedErrorPattern}, Got: "${result.error}"`;
    }
  } else {
    // Safe SQL test
    if (result.isSafe !== testCase.expectedSafe) {
      passed = false;
      failureReason = `Expected isSafe=${testCase.expectedSafe}, got ${result.isSafe}`;
    }

    if (result.safeSql !== testCase.expectedSql) {
      passed = false;
      failureReason = `SQL mismatch.\nExpected: ${testCase.expectedSql}\nGot:      ${result.safeSql}`;
    }

    if (result.limitCapped !== testCase.expectedCapped) {
      passed = false;
      failureReason = `Expected limitCapped=${testCase.expectedCapped}, got ${result.limitCapped}`;
    }
  }

  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${testCase.name}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Reason: ${failureReason}\n`);
  }
});

// ============================================================================
// UNIT-LEVEL CHECKS ON THE PRODUCTION STRIPPER
// ============================================================================

console.log('');

function stripCheck(name, input, expected) {
  const actual = stripQuotedStringsAndComments(input);
  if (actual === expected) {
    passedTests++;
    console.log(`✅ PASS: ${name}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${name}\n   Expected: ${JSON.stringify(expected)}\n   Got:      ${JSON.stringify(actual)}`);
  }
}

stripCheck(
  'Comment stripping preserves token boundaries (block comment)',
  'SELECT CustomerId/* comment */INTO Audit',
  'SELECT CustomerId INTO Audit'
);

stripCheck(
  'Comment stripping preserves token boundaries (line comment)',
  'SELECT CustomerId -- drop\nINTO Audit',
  'SELECT CustomerId  \nINTO Audit'
);

stripCheck(
  'Not-topped query keeps its SELECT prefix aligned',
  'SELECT  FROM Customers',
  'SELECT  FROM Customers'
);

stripCheck(
  'Comment markers inside a string literal are ignored',
  "SELECT '-- x */ DROP'",
  'SELECT  '
);

stripCheck(
  'Apostrophe inside a line comment does not open a literal',
  "SELECT 1 -- don't\n; SELECT 2 --'",
  'SELECT 1  \n; SELECT 2  '
);

stripCheck(
  'Comment terminated by CR does not hide later text',
  'SELECT 1 -- drop\r; SELECT 2',
  'SELECT 1  \r; SELECT 2'
);

[
  ['undefined input', undefined],
  ['null input', null],
  ['number input', 42],
  ['object input', { sql: 'SELECT 1' }],
].forEach(([name, input]) => {
  const result = validateAndNormalizeSql(input);
  const passed = result.isSafe === false && result.safeSql === '' && /Invalid SQL input/.test(result.error);
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${name} fails closed`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${name} fails closed`);
  }
});

const uncappable = normalizeTopClause('WITH data AS (SELECT 1)');
if (uncappable.cappable === false && uncappable.normalizedSql === 'WITH data AS (SELECT 1)') {
  passedTests++;
  console.log('✅ PASS: Uncappable TOP normalization reports failure explicitly');
} else {
  failedTests++;
  console.log('❌ FAIL: Uncappable TOP normalization reports failure explicitly');
}

// Summary
const stripCheckCount = 6;
const totalTests = testCases.length + stripCheckCount + 5;
console.log(`\n${'='.repeat(60)}`);
console.log(`📊 Test Summary:`);
console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
console.log(`   ❌ Failed: ${failedTests}/${totalTests}`);
console.log(`${'='.repeat(60)}`);

if (failedTests === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
