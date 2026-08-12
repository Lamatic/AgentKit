/**
 * SparkTrace — Pipeline Parser
 * ------------------------------------------------------------------
 * Turns a flat list of `PipelineFile`s (already read from disk by
 * `git-ingest.ts`) into a `PipelineContext`: per-file role
 * classification, a table inventory, a rough DAG, and a summary
 * string. Deliberately heuristic (regex-based, not a real
 * PySpark/SQL AST) — good enough to ground the LLM reasoner, not a
 * substitute for real static analysis.
 */

import type {
  ColumnRef,
  DagNode,
  FileRole,
  PipelineContext,
  PipelineFile,
  TableKind,
  TableRef,
} from "../contracts";

// ─────────────────────────────────────────────────────────────
// Regex heuristics
// ─────────────────────────────────────────────────────────────

/**
 * Matches `.table("db.tbl")` / `.table('tbl')` calls that are NOT preceded
 * by `spark` — e.g. `spark.read.table(...)` — so it never overlaps with
 * `RE_SPARK_TABLE`'s `spark.table(...)` shorthand (a negative lookbehind
 * keeps the two matchers disjoint and prevents double-counting a single
 * `spark.table(...)` call as two `read_table` mentions).
 */
const RE_TABLE_CALL = /(?<!spark)\.table\(\s*["']([\w.]+)["']\s*\)/gi;
/** `spark.table("db.tbl")` shorthand. */
const RE_SPARK_TABLE = /spark\.table\(\s*["']([\w.]+)["']\s*\)/gi;
/** `spark.read...parquet/csv/json/orc/load("path")` — path, not a catalog table, but still a read source. */
const RE_SPARK_READ_PATH = /spark\.read(?:\.format\(\s*["'][\w.\-]+["']\s*\))?(?:\.option\([^)]*\))*\.(parquet|csv|json|orc|load)\(\s*["']([^"']+)["']\s*\)/gi;
/** `.saveAsTable("db.tbl")`. */
const RE_SAVE_AS_TABLE = /\.saveAsTable\(\s*["']([\w.]+)["']\s*\)/gi;
/** `.insertInto("db.tbl")`. */
const RE_INSERT_INTO_CALL = /\.insertInto\(\s*["']([\w.]+)["']\s*\)/gi;
/** `.write...parquet/csv/json/orc("path")` — write to a path, not necessarily a catalog table. */
const RE_WRITE_PATH = /\.write(?:\.format\(\s*["'][\w.\-]+["']\s*\))?(?:\.mode\([^)]*\))?(?:\.option\([^)]*\))*\.(parquet|csv|json|orc)\(\s*["']([^"']+)["']\s*\)/gi;
/**
 * Generic `.write` / `spark.read` presence, for role classification even
 * without a captured target. Intentionally NOT global: these two are the
 * only heuristics used with `.test()`, and a `g` regex's `test()` resumes
 * from — and mutates — the shared `lastIndex`, which would make results
 * depend on which file was scanned before. `classifyFile` makes its own
 * global copy when it needs to count occurrences.
 */
const RE_WRITE_CALL = /\.write\b/i;
const RE_READ_CALL = /spark\.read\b/i;

/** SQL: `INSERT INTO [TABLE] db.tbl`. */
const RE_SQL_INSERT_INTO = /INSERT\s+INTO\s+(?:TABLE\s+)?[`"[]?([\w.]+)[`"\]]?/gi;
/** SQL: `CREATE [OR REPLACE] [EXTERNAL] TABLE [IF NOT EXISTS] db.tbl`. */
const RE_SQL_CREATE_TABLE = /CREATE\s+(?:OR\s+REPLACE\s+)?(?:EXTERNAL\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"[]?([\w.]+)[`"\]]?/gi;
/** SQL: `FROM db.tbl`. */
const RE_SQL_FROM = /\bFROM\s+[`"[]?([\w.]+)[`"\]]?/gi;
/** SQL: `JOIN db.tbl`. */
const RE_SQL_JOIN = /\bJOIN\s+[`"[]?([\w.]+)[`"\]]?/gi;

/** SQL keywords/aliases that a naive FROM/JOIN regex might mistake for a table name. */
const SQL_RESERVED_AFTER_FROM = new Set([
  "select", "where", "group", "order", "having", "limit", "join", "on", "as",
]);

interface TableMention {
  key: string; // "database.name"
  ref: TableRef;
  role: "read" | "write";
}

function splitDbName(qualified: string): { database: string; name: string } {
  const parts = qualified.split(".");
  if (parts.length >= 2) {
    return { database: parts[0], name: parts.slice(1).join(".") };
  }
  return { database: "default", name: qualified };
}

function isLikelyTableIdentifier(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  if (SQL_RESERVED_AFTER_FROM.has(lower)) return false;
  return /^[\w.]+$/.test(name);
}

function addMention(
  mentions: Map<string, TableMention>,
  qualified: string,
  role: "read" | "write",
  location?: string
) {
  if (!isLikelyTableIdentifier(qualified)) return;
  const { database, name } = splitDbName(qualified);
  const key = `${database}.${name}`;
  const existing = mentions.get(key);
  if (existing) {
    // A table that's both read and written somewhere is intermediate.
    if (existing.role !== role) {
      existing.ref.kind = "intermediate";
    }
    return;
  }
  const kind: TableKind = role === "write" ? "sink" : "source";
  mentions.set(key, {
    key,
    role,
    ref: { database, name, kind, location },
  });
}

/**
 * Scans a single file's content for table read/write mentions and
 * for DAG-worthy operations. Returns the mentions found and the
 * DagNodes to append (ids are file-scoped, prefixed by the caller).
 */
function scanFile(
  file: PipelineFile,
  mentions: Map<string, TableMention>
): DagNode[] {
  const nodes: DagNode[] = [];
  const content = file.content;
  let nodeSeq = 0;
  const nextId = (op: string) => `${file.path}#${nodeSeq++}:${op}`;

  const runGlobal = (re: RegExp, onMatch: (m: RegExpExecArray) => void) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      onMatch(m);
      if (re.lastIndex === m.index) re.lastIndex++; // guard against zero-width infinite loop
    }
  };

  if (file.language === "python" || file.language === "scala") {
    runGlobal(RE_SPARK_TABLE, (m) => {
      addMention(mentions, m[1], "read");
      nodes.push({ id: nextId("read_table"), op: "read_table", inputs: [m[1]], outputs: [], file: file.path });
    });
    runGlobal(RE_TABLE_CALL, (m) => {
      addMention(mentions, m[1], "read");
      nodes.push({ id: nextId("read_table"), op: "read_table", inputs: [m[1]], outputs: [], file: file.path });
    });
    runGlobal(RE_SPARK_READ_PATH, (m) => {
      const op = `read_${m[1]}`;
      nodes.push({ id: nextId(op), op, inputs: [m[2]], outputs: [], file: file.path });
    });
    runGlobal(RE_SAVE_AS_TABLE, (m) => {
      addMention(mentions, m[1], "write");
      nodes.push({ id: nextId("save_as_table"), op: "save_as_table", inputs: [], outputs: [m[1]], file: file.path });
    });
    runGlobal(RE_INSERT_INTO_CALL, (m) => {
      addMention(mentions, m[1], "write");
      nodes.push({ id: nextId("insert_into"), op: "insert_into", inputs: [], outputs: [m[1]], file: file.path });
    });
    runGlobal(RE_WRITE_PATH, (m) => {
      const op = `write_${m[1]}`;
      nodes.push({ id: nextId(op), op, inputs: [], outputs: [m[2]], file: file.path });
    });
    if (nodes.length === 0) {
      // Fall back to generic presence so role classification still has signal.
      if (RE_READ_CALL.test(content)) {
        nodes.push({ id: nextId("read"), op: "read", inputs: [], outputs: [], file: file.path });
      }
      if (RE_WRITE_CALL.test(content)) {
        nodes.push({ id: nextId("write"), op: "write", inputs: [], outputs: [], file: file.path });
      }
    }
  }

  if (file.language === "sql") {
    runGlobal(RE_SQL_CREATE_TABLE, (m) => {
      addMention(mentions, m[1], "write");
      nodes.push({ id: nextId("create_table"), op: "create_table", inputs: [], outputs: [m[1]], file: file.path });
    });
    runGlobal(RE_SQL_INSERT_INTO, (m) => {
      addMention(mentions, m[1], "write");
      nodes.push({ id: nextId("insert_into"), op: "insert_into", inputs: [], outputs: [m[1]], file: file.path });
    });
    runGlobal(RE_SQL_FROM, (m) => {
      addMention(mentions, m[1], "read");
      nodes.push({ id: nextId("from"), op: "from", inputs: [m[1]], outputs: [], file: file.path });
    });
    runGlobal(RE_SQL_JOIN, (m) => {
      addMention(mentions, m[1], "read");
      nodes.push({ id: nextId("join"), op: "join", inputs: [m[1]], outputs: [], file: file.path });
    });
  }

  return nodes;
}

/**
 * Classifies a file's role from its read/write signal balance and a
 * few filename hints. Pure heuristic — see ARCHITECTURE.md §4.B.
 */
export function classifyFile(file: PipelineFile): FileRole {
  if (file.language === "yaml") return "config";
  if (file.language === "other") return "unknown";

  const content = file.content;
  const lowerPath = file.path.toLowerCase();

  // RE_READ_CALL / RE_WRITE_CALL are deliberately non-global (see their
  // declaration), so counting needs a throwaway global copy rather than
  // `String.match`, which returns only the first match without `g`.
  const countOf = (re: RegExp): number =>
    [...content.matchAll(new RegExp(re.source, `${re.flags}g`))].length;

  const readSignals =
    (content.match(RE_SPARK_TABLE) || []).length +
    (content.match(RE_TABLE_CALL) || []).length +
    (content.match(RE_SPARK_READ_PATH) || []).length +
    (content.match(RE_SQL_FROM) || []).length +
    (content.match(RE_SQL_JOIN) || []).length +
    countOf(RE_READ_CALL);

  const writeSignals =
    (content.match(RE_SAVE_AS_TABLE) || []).length +
    (content.match(RE_INSERT_INTO_CALL) || []).length +
    (content.match(RE_WRITE_PATH) || []).length +
    (content.match(RE_SQL_CREATE_TABLE) || []).length +
    (content.match(RE_SQL_INSERT_INTO) || []).length +
    countOf(RE_WRITE_CALL);

  const nameHintsSink = /(sink|writer|load|export)/.test(lowerPath);
  const nameHintsSource = /(source|extract|ingest|reader)/.test(lowerPath);

  if (readSignals > 0 && writeSignals > 0) return "transform";
  if (writeSignals > 0) return nameHintsSource ? "transform" : "sink";
  if (readSignals > 0) return nameHintsSink ? "transform" : "source";
  if (nameHintsSink) return "sink";
  if (nameHintsSource) return "source";
  return "unknown";
}

function buildSummary(files: PipelineFile[], tables: TableRef[], dag: DagNode[], repoUrl?: string): string {
  const roleCounts: Record<string, number> = {};
  for (const f of files) roleCounts[f.role] = (roleCounts[f.role] ?? 0) + 1;

  const sources = tables.filter((t) => t.kind === "source").map((t) => `${t.database}.${t.name}`);
  const sinks = tables.filter((t) => t.kind === "sink").map((t) => `${t.database}.${t.name}`);
  const intermediates = tables.filter((t) => t.kind === "intermediate").map((t) => `${t.database}.${t.name}`);

  const roleSummary = Object.entries(roleCounts)
    .map(([role, n]) => `${n} ${role}`)
    .join(", ");

  const lines: string[] = [];
  lines.push(
    `Pipeline${repoUrl ? ` ingested from ${repoUrl}` : ""}: ${files.length} file(s) (${roleSummary || "unclassified"}).`
  );
  if (sources.length) lines.push(`Reads from: ${sources.join(", ")}.`);
  if (intermediates.length) lines.push(`Intermediate tables (both read and written): ${intermediates.join(", ")}.`);
  if (sinks.length) lines.push(`Writes to: ${sinks.join(", ")}.`);
  lines.push(`Detected ${dag.length} pipeline operation(s) across ${tables.length} table(s).`);
  if (tables.length === 0 && dag.length === 0) {
    lines.push("No read/write table operations were detected — heuristics may not match this codebase's patterns.");
  }
  return lines.join(" ");
}

/**
 * Classifies every file's role and extracts a table inventory + rough
 * DAG, producing the full `PipelineContext`. This is the single entry
 * point `git-ingest.ts` (and the demo ingestor) should call once raw
 * `PipelineFile`s have been read from disk.
 */
export function parsePipelineContext(rawFiles: PipelineFile[], repoUrl?: string): PipelineContext {
  const files: PipelineFile[] = rawFiles.map((f) => ({ ...f, role: classifyFile(f) }));

  const mentions = new Map<string, TableMention>();
  const dag: DagNode[] = [];

  for (const file of files) {
    const nodes = scanFile(file, mentions);
    dag.push(...nodes);
  }

  const tables: TableRef[] = Array.from(mentions.values()).map((m) => m.ref);

  const summary = buildSummary(files, tables, dag, repoUrl);

  return { repoUrl, files, tables, dag, summary };
}

// Re-export types used only for documentation/tests in this module.
export type { ColumnRef };
