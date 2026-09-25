/**
 * SQL Validation and Normalization Script
 *
 * Validates that generated SQL is safe (read-only) and normalizes result limits.
 * - Ensures SQL is a single SELECT statement
 * - Blocks write operations (INSERT, UPDATE, DELETE, etc.)
 * - Blocks DDL operations (CREATE, ALTER, DROP, etc.)
 * - Blocks ad-hoc rowset functions (OPENROWSET, OPENQUERY, OPENDATASOURCE,
 *   OPENXML) that can initiate outbound connections from the database host
 * - Blocks SELECT ... INTO (table creation, not read-only)
 * - Blocks TOP ... PERCENT (can return the whole table, bypassing row limit)
 * - Blocks TOP ... WITH TIES (can return > MAX_RESULT_ROWS rows)
 * - Blocks top-level set operations (UNION, UNION ALL, EXCEPT, INTERSECT) whose
 *   combined result can exceed MAX_RESULT_ROWS because a TOP on one branch does
 *   not limit the combined set
 * - Enforces maximum result limit of 1000 rows by normalizing TOP clauses
 *
 * Input: {{LLMNode_sql_gen.output.generatedResponse}} (generated SQL)
 * Output:
 *   - safeSql: The validated and normalized SQL ready for execution
 *   - isSafe: Boolean indicating if SQL passed all safety checks
 *   - error: Error message if validation failed
 *   - limitCapped: Boolean indicating if TOP value was capped to MAX_RESULT_ROWS
 *   - originalSql: The SQL before normalization (for transparency)
 */

// Configuration
const MAX_RESULT_ROWS = 1000;

// Unsafe keywords that indicate write or DDL operations
const UNSAFE_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'CREATE',
  'TRUNCATE',
  'MERGE',
  'CALL',
  'EXEC',
  'EXECUTE',
  'OPENROWSET',
  'OPENQUERY',
  'OPENDATASOURCE',
  'OPENXML',
];

/**
 * Scan the SQL and locate a TOP clause that belongs to the OUTER executable
 * SELECT. A TOP inside a nested query (scalar subquery, derived table, CTE
 * body) or inside a string literal or comment does NOT satisfy the row-limit
 * requirement for the outer query, so it must not be treated as an existing
 * TOP.
 *
 * Parenthesis depth is tracked while skipping string literals, quoted
 * identifiers, and comments (so their parens/keywords are ignored). Only a TOP
 * encountered at depth 0 is returned.
 *
 * @returns { value, clauseStart, clauseEnd } where `value` is the outer TOP's
 *          numeric value and `clauseStart`/`clauseEnd` span the whole TOP
 *          clause (keyword through optional parenthesized value) so it can be
 *          replaced when capped. Returns null when the outer query has no TOP.
 */
function findOuterTop(sql: string): { value: number; clauseStart: number; clauseEnd: number } | null {
  let depth = 0;
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const ch = sql[i];

    const skipped = skipScannerRegion(sql, i);
    if (skipped !== null) {
      i = skipped;
      continue;
    }

    // Track parenthesis depth.
    if (ch === '(') { depth++; i++; continue; }
    if (ch === ')') { if (depth > 0) depth--; i++; continue; }

    // Only consider TOP at the outer depth.
    if (
      depth === 0 &&
      i + 3 <= n &&
      sql.slice(i, i + 3).toUpperCase() === 'TOP' &&
      (i === 0 || !/[a-zA-Z0-9_]/.test(sql[i - 1])) &&
      (i + 3 >= n || !/[a-zA-Z0-9_]/.test(sql[i + 3]))
    ) {
      const clauseStart = i;
      let j = i + 3;
      while (j < n && /\s/.test(sql[j])) j++;
      let hasParens = false;
      if (j < n && sql[j] === '(') {
        hasParens = true;
        j++;
        while (j < n && /\s/.test(sql[j])) j++;
      }
      const numStart = j;
      while (j < n && /\d/.test(sql[j])) j++;
      const numStr = sql.slice(numStart, j);
      if (numStr.length === 0) return null;
      let clauseEnd = j;
      if (hasParens) {
        while (clauseEnd < n && /\s/.test(sql[clauseEnd])) clauseEnd++;
        if (clauseEnd < n && sql[clauseEnd] === ')') clauseEnd++;
      }
      return { value: parseInt(numStr, 10), clauseStart, clauseEnd };
    }

    i++;
  }

  return null;
}

function skipScannerRegion(sql: string, start: number): number | null {
  const ch = sql[start];
  let i = start;

  if (ch === "'" || ch === '"') {
    i++;
    while (i < sql.length) {
      if (sql[i] === ch) {
        if (sql[i + 1] === ch) { i += 2; continue; }
        return i + 1;
      }
      i++;
    }
    return i;
  }

  if (ch === '-' && sql[start + 1] === '-') {
    while (i < sql.length && sql[i] !== '\n' && sql[i] !== '\r') i++;
    return i;
  }

  if (ch === '/' && sql[start + 1] === '*') {
    i += 2;
    while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
    return Math.min(i + 2, sql.length);
  }

  if (ch === '[') {
    i++;
    while (i < sql.length) {
      if (sql[i] === ']') {
        if (sql[i + 1] === ']') { i += 2; continue; }
        return i + 1;
      }
      i++;
    }
    return i;
  }

  return null;
}

/**
 * Normalize TOP clause to enforce maximum result limit
 * @param sql - The SQL query to normalize
 * @returns Object with normalized SQL and a flag indicating if limit was capped
 */
/**
 * Find the position immediately after the outer SELECT keyword. TOP belongs
 * before DISTINCT or ALL, and needs a separator when SELECT is immediately
 * followed by a comment or parenthesis.
 */
function findSelectInsertionPoint(sql: string): number {
  let depth = 0;
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const ch = sql[i];

    const skipped = skipScannerRegion(sql, i);
    if (skipped !== null) {
      i = skipped;
      continue;
    }

    // Track parenthesis depth
    if (ch === '(') { depth++; i++; continue; }
    if (ch === ')') { if (depth > 0) depth--; i++; continue; }

    // At depth 0, look for SELECT (case-insensitive)
    if (depth === 0 && i + 6 <= n && sql.slice(i, i + 6).toUpperCase() === 'SELECT') {
      // Check word boundaries
      const before = i === 0 || !/[a-zA-Z0-9_]/.test(sql[i - 1]);
      const afterPos = i + 6;
      const after = afterPos >= n || !/[a-zA-Z0-9_]/.test(sql[afterPos]);

      if (before && after) {
        // Skip past DISTINCT or ALL so TOP is inserted before them, letting
        // findQuantifierEnd also skip comments/whitespace before the quantifier
        // so TOP never lands ahead of it:
        // SELECT DISTINCT TOP 1000 Name          (valid)
        // SELECT/* c */DISTINCT TOP 1000 Name    (valid, comment skipped)
        // SELECT /* c */ALL TOP 1000 Name        (valid)
        return findQuantifierEnd(sql, i + 6);
      }
    }

    i++;
  }

  return -1; // Cannot confidently locate the outer SELECT
}

/**
 * Find the position immediately after a DISTINCT / ALL quantifier that follows
 * the outer SELECT, skipping intervening whitespace, line comments, and block
 * comments. T-SQL requires the quantifier BEFORE TOP (SELECT DISTINCT TOP 1000
 * ...), so when a block comment sits between SELECT and the quantifier the
 * previous insertion point landed on SELECT and produced an invalid
 * "SELECT TOP 1000 ... DISTINCT" form that SQL Server rejects. Comments are
 * whitespace-equivalent separators, so they must be skipped just like spaces
 * before the quantifier is detected.
 *
 * Anything other than a quantifier (including a string literal or bracketed
 * identifier, which can never separate SELECT from a top-level quantifier)
 * leaves the insertion point right after SELECT, preserving the pre-existing
 * behavior for non-comment inputs.
 *
 * @returns The index just past the quantifier keyword when one is present;
 *          otherwise the index immediately after SELECT.
 */
function findQuantifierEnd(sql: string, start: number): number {
  let i = start;
  const n = sql.length;

  while (i < n) {
    // Whitespace can be skipped freely.
    if (/\s/.test(sql[i])) {
      i++;
      continue;
    }

    // -- line comment (terminated by \n or \r, matching SQL Server).
    if (sql[i] === '-' && sql[i + 1] === '-') {
      while (i < n && sql[i] !== '\n' && sql[i] !== '\r') i++;
      continue;
    }

    // /* block comment */.
    if (sql[i] === '/' && sql[i + 1] === '*') {
      i += 2;
      while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i = Math.min(i + 2, n);
      continue;
    }

    break;
  }

  if (
    i + 8 <= n &&
    sql.slice(i, i + 8).toUpperCase() === 'DISTINCT' &&
    (i + 8 >= n || !/[a-zA-Z0-9_]/.test(sql[i + 8]))
  ) {
    return i + 8;
  }

  if (
    i + 3 <= n &&
    sql.slice(i, i + 3).toUpperCase() === 'ALL' &&
    (i + 3 >= n || !/[a-zA-Z0-9_]/.test(sql[i + 3]))
  ) {
    return i + 3;
  }

  return start;
}

function normalizeTopClause(sql: string): { normalizedSql: string; limitCapped: boolean; cappable: boolean } {
  const outerTop = findOuterTop(sql);

  if (outerTop === null) {
    // No outer TOP clause found, add TOP MAX_RESULT_ROWS at the beginning of
    // the outer SELECT using the stateful scanner
    const insertionPoint = findSelectInsertionPoint(sql);

    if (insertionPoint === -1) {
      // Fail closed: cannot locate outer SELECT, mark as unsafe
      return {
        normalizedSql: sql, // Leave SQL unchanged, validation will reject it
        limitCapped: false,
        cappable: false,
      };
    }

    const suffix = /\s/.test(sql[insertionPoint] || '') ? '' : ' ';
    const normalizedSql = sql.slice(0, insertionPoint) + ` TOP ${MAX_RESULT_ROWS}${suffix}` + sql.slice(insertionPoint);

    return {
      normalizedSql,
      limitCapped: false,
      cappable: true,
    };
  }

  if (outerTop.value > MAX_RESULT_ROWS) {
    // Replace the whole outer TOP clause (keyword and optional parens) with
    // the normalized bare form, matching the previous `TOP 1000` output.
    const normalizedSql =
      sql.slice(0, outerTop.clauseStart) + `TOP ${MAX_RESULT_ROWS}` + sql.slice(outerTop.clauseEnd);
    return {
      normalizedSql,
      limitCapped: true,
      cappable: true,
    };
  }

  // Outer TOP is within limits, no change needed.
  return {
    normalizedSql: sql,
    limitCapped: false,
    cappable: true,
  };
}

/**
 * Remove quoted string literals and comments so keyword checks do not match
 * text that lives inside data values or comments.
 *
 * This is a single-pass, stateful scanner rather than a sequence of regex
 * substitutions, so comment and literal markers are interpreted only in the
 * ACTIVE parser state:
 *   - An apostrophe inside a `--` line comment cannot open (or close the
 *     search for) a string literal, so a trailing unbalanced quote cannot hide
 *     a later statement that reaches database execution.
 *   - `--` or `/*` inside a string literal are literal data, not comments.
 *   - A comment inside a string literal is data; a `'` inside a comment is part
 *     of the comment.
 *
 * Each consumed region (literal or comment) is replaced with a single space so
 * that two surrounding SQL tokens cannot be concatenated into one — for
 * example, `SELECT CustomerId blockComment INTO Audit` must not collapse
 * `CustomerId` and `INTO` into one token, which would otherwise evade the
 * SELECT INTO check. Whitespace replacement is always safe: it can never forge
 * a keyword.
 *
 * An unterminated literal is left verbatim (its contents stay visible to the
 * safety checks) so it can never swallow text that follows it.
 */
function stripQuotedStringsAndComments(sql: string): string {
  let out = '';
  let i = 0;
  const n = sql.length;

  const findClosingQuote = (quote: string): number => {
    // Returns the index of the closing quote ('' / "" escapes honored), or -1
    // when the literal runs to end of input without closing.
    let j = i + 1;
    while (j < n) {
      if (sql[j] === quote) {
        if (sql[j + 1] === quote) { j += 2; continue; }
        return j;
      }
      j++;
    }
    return -1;
  };

  while (i < n) {
    const ch = sql[i];
    const next = sql[i + 1];

    // Single-quoted string literal.
    if (ch === "'") {
      const close = findClosingQuote("'");
      if (close === -1) {
        // Unterminated literal: keep it verbatim so following tokens stay visible.
        out += ch;
        i++;
        continue;
      }
      out += ' ';
      i = close + 1;
      continue;
    }

    // Double-quoted string literal / quoted identifier.
    if (ch === '"') {
      const close = findClosingQuote('"');
      if (close === -1) {
        out += ch;
        i++;
        continue;
      }
      out += ' ';
      i = close + 1;
      continue;
    }

    // Line comment (-- to end of line; the newline itself is preserved).
    // SQL Server terminates a -- comment at a carriage return OR line feed, so
    // a CR-only line ending must end the comment too (else it would swallow a
    // later statement, which is exactly how a write could bypass the guard).
    if (ch === '-' && next === '-') {
      out += ' ';
      i += 2;
      while (i < n && sql[i] !== '\n' && sql[i] !== '\r') i++;
      continue;
    }

    // Block comment (/* ... */).
    if (ch === '/' && next === '*') {
      out += ' ';
      i += 2;
      while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i = Math.min(i + 2, n);
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

/**
 * Detect a SET operator (UNION / UNION ALL / EXCEPT / INTERSECT) at the TOP
 * level of the query (parenthesis depth 0). A TOP clause applied to one branch
 * of a set operation does not limit the combined result in SQL Server, so such
 * queries would be able to return more than MAX_RESULT_ROWS rows. Set operators
 * inside nested subqueries are unaffected.
 *
 * Runs on the literal/comment-stripped SQL, so markers inside data are ignored
 * and only real code (with its original parenthesis depth) is examined.
 */
function hasTopLevelSetOperator(strippedSql: string): boolean {
  const setOperators = ['UNION', 'EXCEPT', 'INTERSECT'];
  let depth = 0;
  let i = 0;
  const n = strippedSql.length;

  while (i < n) {
    const ch = strippedSql[i];

    // Skip bracketed T-SQL identifiers ([...], with ]] escaping). A '(' inside
    // a column name must never affect the parenthesis depth.
    if (ch === '[') {
      i++;
      while (i < n) {
        if (strippedSql[i] === ']') {
          if (strippedSql[i + 1] === ']') { i += 2; continue; }
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (ch === '(') { depth++; i++; continue; }
    if (ch === ')') { if (depth > 0) depth--; i++; continue; }

    if (depth === 0) {
      for (const op of setOperators) {
        if (
          i + op.length <= n &&
          strippedSql.slice(i, i + op.length).toUpperCase() === op &&
          (i === 0 || !/[a-zA-Z0-9_]/.test(strippedSql[i - 1])) &&
          (i + op.length >= n || !/[a-zA-Z0-9_]/.test(strippedSql[i + op.length]))
        ) {
          return true;
        }
      }
    }

    i++;
  }

  return false;
}

/**
 * Validate that SQL is safe (read-only, single statement)
 * @param sql - The SQL query to validate
 * @returns Object with validation result and error message if any
 */
function validateSqlSafety(sql: string): { isSafe: boolean; error: string } {
  // Trim and remove leading/trailing whitespace
  const trimmedSql = sql.trim();

  // Check if empty
  if (!trimmedSql) {
    return {
      isSafe: false,
      error: 'SQL query cannot be empty.',
    };
  }

  // Strip literals and comments first (replacing with whitespace to preserve
  // token boundaries) so that keywords appearing only inside string values or
  // comments are never treated as operations, while real write/DDL keywords
  // outside literals/comments are still caught below.
  const stripped = stripQuotedStringsAndComments(trimmedSql);

  // Check for unsafe keywords FIRST (before SELECT check) so we catch write/DDL operations
  // Use word boundaries to avoid matching partial words
  const unsafeKeywordPattern = new RegExp(
    `\\b(${UNSAFE_KEYWORDS.join('|')})\\b`,
    'i'
  );

  if (unsafeKeywordPattern.test(stripped)) {
    return {
      isSafe: false,
      error: 'SQL contains write or DDL operations. Only read-only SELECT queries are allowed.',
    };
  }

  // Check if starts with SELECT (case-insensitive)
  if (!/^\s*SELECT\b/i.test(trimmedSql)) {
    return {
      isSafe: false,
      error: 'SQL must start with SELECT. Only read-only queries are allowed.',
    };
  }

  // Block SELECT ... INTO (creates/populates a table - not read-only)
  if (/\bSELECT\b[\s\S]*?\bINTO\b/i.test(stripped)) {
    return {
      isSafe: false,
      error: 'SQL contains SELECT INTO, which creates or populates a table. Only read-only SELECT queries are allowed.',
    };
  }

  // Block TOP ... PERCENT (can return the entire table, bypassing the row limit)
  // Matches: TOP 100 PERCENT, TOP (100) PERCENT, TOP(100)PERCENT, TOP (100)PERCENT
  if (/\bTOP\s*\(?\s*\d+\s*\)?\s*PERCENT\b/i.test(stripped)) {
    return {
      isSafe: false,
      error: 'TOP PERCENT is not allowed because it can bypass the maximum result limit.',
    };
  }

  // Block TOP ... WITH TIES (can return more than the maximum result limit)
  // Matches: TOP 100 WITH TIES, TOP (100) WITH TIES, TOP(100)WITH TIES
  if (/\bTOP\s*\(?\s*\d+\s*\)?\s*WITH\s+TIES\b/i.test(stripped)) {
    return {
      isSafe: false,
      error: 'TOP WITH TIES is not allowed because it can return more than the maximum result limit.',
    };
  }

  // Block top-level set operations (UNION / UNION ALL / EXCEPT / INTERSECT).
  // A TOP applied to a single branch does not limit the combined result in SQL
  // Server, so these queries could return more than MAX_RESULT_ROWS rows.
  if (hasTopLevelSetOperator(stripped)) {
    return {
      isSafe: false,
      error: 'Set operations (UNION, EXCEPT, INTERSECT) are not allowed because they can exceed the maximum result limit.',
    };
  }

  // Check for multiple statements (semicolon separator).
  // This runs on `stripped` (literals, comments, and quoted identifiers
  // removed) so a semicolon that only appears inside a string value or comment
  // is not mistaken for a statement separator, while real separators outside
  // data are still caught. This mirrors the unsafe-keyword check above.
  // Allow trailing semicolon but not semicolons in the middle.
  const sqlWithoutTrailingSemicolon = stripped.replace(/;\s*$/, '');
  if (sqlWithoutTrailingSemicolon.includes(';')) {
    return {
      isSafe: false,
      error: 'Multiple SQL statements are not allowed. Only a single SELECT is permitted.',
    };
  }

  // All checks passed
  return {
    isSafe: true,
    error: '',
  };
}

// Main validation logic
function validateAndNormalizeSql(generatedSql: unknown): {
  safeSql: string;
  isSafe: boolean;
  error: string;
  limitCapped: boolean;
  originalSql: string;
} {
  // Handle undefined/null/non-string input safely
  if (generatedSql === undefined || generatedSql === null || typeof generatedSql !== 'string') {
    return {
      safeSql: '',
      isSafe: false,
      error: 'Invalid SQL input: expected a string but received ' + (generatedSql === undefined ? 'undefined' : generatedSql === null ? 'null' : typeof generatedSql),
      limitCapped: false,
      originalSql: '',
    };
  }

  const originalSql = generatedSql;

  // Step 1: Validate SQL safety
  const safetyCheck = validateSqlSafety(originalSql);
  if (!safetyCheck.isSafe) {
    return {
      safeSql: '',
      isSafe: false,
      error: safetyCheck.error,
      limitCapped: false,
      originalSql,
    };
  }

  // Step 2: Normalize TOP clause
  const { normalizedSql, limitCapped, cappable } = normalizeTopClause(originalSql);

  // If normalizeTopClause cannot confidently locate the outer SELECT (insertionPoint = -1),
  // it returns the original SQL unchanged. We must fail closed.
  if (!cappable) {
    return {
      safeSql: '',
      isSafe: false,
      error: 'Cannot confidently enforce result limits. Query may bypass row-limit safety.',
      limitCapped: false,
      originalSql,
    };
  }

  return {
    safeSql: normalizedSql,
    isSafe: true,
    error: '',
    limitCapped,
    originalSql,
  };
}

// Execute validation and normalization.
// Input boundary: the generated SQL response is supplied through a Lamatic
// template variable ({{LLMNode_sql_gen.output.generatedResponse}}) that the
// Lamatic runtime resolves before this script executes.
const result = validateAndNormalizeSql({{LLMNode_sql_gen.output.generatedResponse}});

// Return the result object for the flow to use
result;
