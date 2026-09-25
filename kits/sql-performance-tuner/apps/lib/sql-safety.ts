import type { TableSchema } from "./contracts";
import { MAX_QUERY_CHARACTERS } from "./contracts";

const FORBIDDEN_QUERY_TOKENS = new Set([
  "ATTACH", "DETACH", "PRAGMA", "VACUUM", "INSERT", "UPDATE", "DELETE", "REPLACE",
  "DROP", "ALTER", "CREATE", "REINDEX", "ANALYZE", "LOAD_EXTENSION",
]);
const NONDETERMINISTIC_FUNCTIONS = new Set(["RANDOM", "RANDOMBLOB"]);
const NONDETERMINISTIC_LITERALS = new Set([
  "CURRENT_TIMESTAMP", "CURRENT_DATE", "CURRENT_TIME",
]);
const UNBOUNDED_RESULT_FUNCTIONS = new Set([
  "CONCAT", "CONCAT_WS", "FORMAT", "GROUP_CONCAT", "HEX", "JSON_ARRAY",
  "JSON_GROUP_ARRAY", "JSON_GROUP_OBJECT", "JSON_OBJECT", "JSON_QUOTE", "PRINTF",
  "QUOTE", "REPLACE", "ZEROBLOB",
]);
const SIMPLE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

type SqlToken = {
  kind: "word" | "identifier" | "string" | "symbol";
  value: string;
  depth: number;
};

const SELECT_BOUNDARIES = new Set([
  "WHERE", "GROUP", "HAVING", "WINDOW", "ORDER", "LIMIT", "UNION", "INTERSECT", "EXCEPT",
]);

function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let depth = 0;
  let index = 0;

  while (index < sql.length) {
    const character = sql[index];
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (character === "-" && sql[index + 1] === "-") {
      throw new Error("SQL comments are not accepted.");
    }
    if (character === "/" && sql[index + 1] === "*") {
      throw new Error("SQL comments are not accepted.");
    }
    if (character === "'") {
      let value = "";
      index += 1;
      let closed = false;
      while (index < sql.length) {
        if (sql[index] === "'" && sql[index + 1] === "'") {
          value += "'";
          index += 2;
        } else if (sql[index] === "'") {
          index += 1;
          closed = true;
          break;
        } else {
          value += sql[index];
          index += 1;
        }
      }
      if (!closed) throw new Error("The SQL query contains an unterminated string literal.");
      tokens.push({ kind: "string", value, depth });
      continue;
    }
    if (character === '"' || character === "`" || character === "[") {
      const closing = character === "[" ? "]" : character;
      let value = "";
      index += 1;
      let closed = false;
      while (index < sql.length) {
        if (sql[index] === closing && sql[index + 1] === closing) {
          value += closing;
          index += 2;
        } else if (sql[index] === closing) {
          index += 1;
          closed = true;
          break;
        } else {
          value += sql[index];
          index += 1;
        }
      }
      if (!closed) throw new Error("The SQL query contains an unterminated quoted identifier.");
      tokens.push({ kind: "identifier", value: value.toUpperCase(), depth });
      continue;
    }
    if (/[A-Za-z_]/.test(character)) {
      const start = index;
      index += 1;
      while (index < sql.length && /[A-Za-z0-9_$]/.test(sql[index])) index += 1;
      tokens.push({ kind: "word", value: sql.slice(start, index).toUpperCase(), depth });
      continue;
    }
    if (character === "(") {
      tokens.push({ kind: "symbol", value: character, depth });
      depth += 1;
      index += 1;
      continue;
    }
    if (character === ")") {
      depth -= 1;
      if (depth < 0) throw new Error("The SQL query contains unmatched parentheses.");
      tokens.push({ kind: "symbol", value: character, depth });
      index += 1;
      continue;
    }
    tokens.push({ kind: "symbol", value: character, depth });
    index += 1;
  }

  if (depth !== 0) throw new Error("The SQL query contains unmatched parentheses.");
  return tokens;
}

function hasCartesianJoin(tokens: SqlToken[]): boolean {
  for (let selectIndex = 0; selectIndex < tokens.length; selectIndex += 1) {
    const select = tokens[selectIndex];
    if (select.kind !== "word" || select.value !== "SELECT") continue;

    const depth = select.depth;
    let fromIndex = -1;
    for (let index = selectIndex + 1; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (token.depth < depth) break;
      if (token.depth === depth && token.kind === "word" && token.value === "FROM") {
        fromIndex = index;
        break;
      }
    }
    if (fromIndex < 0) continue;

    let pendingJoin = false;
    let naturalJoin = false;
    for (let index = fromIndex + 1; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (token.depth < depth) break;
      if (token.depth !== depth) continue;
      if (token.kind === "word" && SELECT_BOUNDARIES.has(token.value)) break;
      if (token.kind === "symbol" && token.value === ",") return true;
      if (token.kind !== "word") continue;
      if (token.value === "CROSS") return true;
      if (token.value === "NATURAL") naturalJoin = true;
      if (token.value === "JOIN") {
        if (pendingJoin) return true;
        pendingJoin = !naturalJoin;
        naturalJoin = false;
      } else if (pendingJoin && (token.value === "ON" || token.value === "USING")) {
        pendingJoin = false;
      }
    }
    if (pendingJoin) return true;
  }
  return false;
}

function isFunctionCall(tokens: SqlToken[], index: number): boolean {
  const name = tokens[index];
  const openingParenthesis = tokens[index + 1];
  return (
    (name?.kind === "word" || name?.kind === "identifier")
    && openingParenthesis?.kind === "symbol"
    && openingParenthesis.value === "("
    && openingParenthesis.depth === name.depth
  );
}

function hasNondeterministicCall(tokens: SqlToken[]): boolean {
  if (tokens.some((token) => (
    token.kind === "word" && NONDETERMINISTIC_LITERALS.has(token.value)
  ))) {
    return true;
  }
  if (tokens.some((token, index) => (
    NONDETERMINISTIC_FUNCTIONS.has(token.value) && isFunctionCall(tokens, index)
  ))) {
    return true;
  }

  const currentTimeFunctions = new Set([
    "DATE", "TIME", "DATETIME", "JULIANDAY", "UNIXEPOCH", "STRFTIME",
  ]);
  return tokens.some((token, index) => {
    if (!currentTimeFunctions.has(token.value) || !isFunctionCall(tokens, index)) return false;

    const openingDepth = tokens[index + 1].depth;
    const argumentsList: SqlToken[][] = [];
    let currentArgument: SqlToken[] = [];
    let foundClosing = false;
    for (let cursor = index + 2; cursor < tokens.length; cursor += 1) {
      const argumentToken = tokens[cursor];
      if (argumentToken.value === ")" && argumentToken.depth === openingDepth) {
        if (currentArgument.length || argumentsList.length) argumentsList.push(currentArgument);
        foundClosing = true;
        break;
      }
      if (argumentToken.value === "," && argumentToken.depth === openingDepth + 1) {
        argumentsList.push(currentArgument);
        currentArgument = [];
      } else {
        currentArgument.push(argumentToken);
      }
    }
    if (!foundClosing) return false;

    const timeValueIndex = token.value === "STRFTIME" ? 1 : 0;
    if (argumentsList.length <= timeValueIndex) return true;
    const timeValue = argumentsList[timeValueIndex];
    if (timeValue.length !== 1) return true;
    return (timeValue[0].kind === "string" || timeValue[0].kind === "identifier")
      && ["now", "subsec", "subsecond"].includes(timeValue[0].value.toLowerCase());
  });
}

function matchingClosingParenthesis(tokens: SqlToken[], openingIndex: number): number {
  const depth = tokens[openingIndex]?.depth;
  for (let index = openingIndex + 1; index < tokens.length; index += 1) {
    if (tokens[index].value === ")" && tokens[index].depth === depth) return index;
  }
  return -1;
}

function isIdentifier(token: SqlToken | undefined): token is SqlToken {
  return token?.kind === "word" || token?.kind === "identifier";
}

function hasRecursiveCte(tokens: SqlToken[]): boolean {
  if (tokens[0]?.kind !== "word" || tokens[0].value !== "WITH") return false;
  let index = tokens[1]?.kind === "word" && tokens[1].value === "RECURSIVE" ? 2 : 1;

  while (index < tokens.length) {
    const nameToken = tokens[index];
    if (!isIdentifier(nameToken) || nameToken.depth !== 0) break;
    const cteName = nameToken.value;
    index += 1;

    if (tokens[index]?.value === "(" && tokens[index].depth === 0) {
      const columnListEnd = matchingClosingParenthesis(tokens, index);
      if (columnListEnd < 0) break;
      index = columnListEnd + 1;
    }

    if (tokens[index]?.kind !== "word" || tokens[index].value !== "AS" || tokens[index].depth !== 0) {
      break;
    }
    index += 1;
    if (tokens[index]?.value === "NOT") index += 1;
    if (tokens[index]?.value === "MATERIALIZED") index += 1;
    if (tokens[index]?.value !== "(" || tokens[index].depth !== 0) break;

    const bodyEnd = matchingClosingParenthesis(tokens, index);
    if (bodyEnd < 0) break;
    for (let cursor = index + 1; cursor < bodyEnd; cursor += 1) {
      const reference = tokens[cursor];
      const previous = tokens[cursor - 1];
      if (
        isIdentifier(reference)
        && reference.value === cteName
        && previous?.kind === "word"
        && (previous.value === "FROM" || previous.value === "JOIN")
      ) {
        return true;
      }
    }

    index = bodyEnd + 1;
    if (tokens[index]?.value !== "," || tokens[index].depth !== 0) break;
    index += 1;
  }
  return false;
}

function withoutTrailingSemicolon(sql: string): string {
  return sql.trim().replace(/;\s*$/, "").trim();
}

export function validateReadOnlyQuery(sql: string): string {
  const query = sql.trim();

  if (!query) throw new Error("Enter a SQL query.");
  if (query.length > MAX_QUERY_CHARACTERS) throw new Error("The query is too large for this bounded runner.");
  const tokens = tokenizeSql(query);
  const normalized = withoutTrailingSemicolon(query);
  const semicolons = tokens.filter((token) => token.depth === 0 && token.value === ";");
  if (semicolons.length > 1 || (semicolons.length === 1 && tokens.at(-1)?.value !== ";")) {
    throw new Error("Only one SQL statement is allowed.");
  }
  const first = tokens[0]?.value;
  if (first !== "SELECT" && first !== "WITH") throw new Error("Only SELECT and WITH queries are allowed.");
  if (tokens.some((token) => token.kind === "word" && FORBIDDEN_QUERY_TOKENS.has(token.value))) {
    throw new Error("The query contains a blocked database operation.");
  }
  if (tokens.some((token, index) => (
    UNBOUNDED_RESULT_FUNCTIONS.has(token.value) && isFunctionCall(tokens, index)
  ))) {
    throw new Error("Result-expanding SQL functions are not accepted by this bounded runner.");
  }
  if (hasNondeterministicCall(tokens)) {
    throw new Error("Non-deterministic SQL functions cannot be compared safely.");
  }
  if (
    (first === "WITH" && tokens[1]?.kind === "word" && tokens[1].value === "RECURSIVE")
    || hasRecursiveCte(tokens)
    || hasCartesianJoin(tokens)
  ) {
    throw new Error("Recursive CTEs and Cartesian joins are not accepted by this bounded runner.");
  }

  return normalized;
}

export type ValidatedIndex = {
  sql: string;
  name: string;
  table: string;
  columns: string[];
};

export function validateCreateIndex(sql: string, schema: TableSchema[]): ValidatedIndex {
  const normalized = withoutTrailingSemicolon(sql);
  if (/--|\/\*/.test(normalized) || normalized.includes(";")) {
    throw new Error("The index candidate must contain exactly one statement without comments.");
  }

  const match = normalized.match(
    /^create\s+index\s+(?:if\s+not\s+exists\s+)?([A-Za-z_][A-Za-z0-9_]*)\s+on\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]+)\)$/i,
  );
  if (!match) throw new Error("Only a simple CREATE INDEX ... ON table(column, ...) statement is allowed.");

  const [, name, tableName, rawColumns] = match;
  const columns = rawColumns.split(",").map((column) => column.trim());
  if (!columns.length || columns.some((column) => !SIMPLE_IDENTIFIER.test(column))) {
    throw new Error("Index columns must be plain existing column names.");
  }

  const table = schema.find((candidate) => candidate.name.toLowerCase() === tableName.toLowerCase());
  if (!table) throw new Error(`Index candidate references unknown table "${tableName}".`);
  const available = new Set(table.columns.map((column) => column.name.toLowerCase()));
  const unknown = columns.find((column) => !available.has(column.toLowerCase()));
  if (unknown) throw new Error(`Index candidate references unknown column "${unknown}".`);

  return { sql: `${normalized};`, name, table: table.name, columns };
}

export function queryHasExplicitOrder(sql: string): boolean {
  const tokens = tokenizeSql(sql);
  return tokens.some((token, index) => (
    token.kind === "word"
    && token.depth === 0
    && token.value === "ORDER"
    && tokens[index + 1]?.kind === "word"
    && tokens[index + 1]?.depth === 0
    && tokens[index + 1]?.value === "BY"
  ));
}
