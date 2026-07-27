/**
 * SparkTrace demo mode — PipelineIngestor that reads the bundled sample
 * repo (assets/sample-scenario/repo/) plus scenario.json off disk, with
 * no git clone and no network access. Mirrors the shape live/git-ingest
 * produces (PipelineContext) so orchestrate.ts is mode-agnostic.
 */

import fs from "node:fs";
import path from "node:path";

import type {
  DagNode,
  FileLanguage,
  FileRole,
  IngestSource,
  PipelineContext,
  PipelineFile,
  PipelineIngestor,
  TableRef,
  ExecutionMode,
} from "../contracts";
import { loadScenario } from "./scenario-paths";

function languageFor(filePath: string): FileLanguage {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".py") return "python";
  if (ext === ".sql") return "sql";
  if (ext === ".scala") return "scala";
  if (ext === ".yaml" || ext === ".yml") return "yaml";
  return "other";
}

function roleFor(filePath: string): FileRole {
  const base = path.basename(filePath);
  if (base === "daily_revenue.py") return "transform";
  if (base === "dim_customer_loader.py") return "source";
  if (languageFor(filePath) === "sql") return "config";
  return "unknown";
}

/** Recursively collect every file under repoDir into PipelineFile[]. */
function collectRepoFiles(repoDir: string): PipelineFile[] {
  const files: PipelineFile[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const rel = path.relative(repoDir, full).split(path.sep).join("/");
        files.push({
          path: `repo/${rel}`,
          language: languageFor(full),
          role: roleFor(full),
          content: fs.readFileSync(full, "utf-8"),
        });
      }
    }
  }

  walk(repoDir);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Rough DAG for the bundled scenario, hand-authored to mirror what a
 * regex/heuristic parser would extract from daily_revenue.py and
 * dim_customer_loader.py (read -> join -> aggregate -> write).
 */
function buildDag(): DagNode[] {
  return [
    {
      id: "read_orders",
      op: "read_parquet",
      inputs: ["raw.orders"],
      outputs: ["orders_df"],
      file: "repo/jobs/daily_revenue.py",
    },
    {
      id: "read_dim_customer",
      op: "read_parquet",
      inputs: ["raw.dim_customer"],
      outputs: ["dim_customer_df"],
      file: "repo/jobs/daily_revenue.py",
    },
    {
      id: "join_orders_dim_customer",
      op: "join",
      inputs: ["orders_df", "dim_customer_df"],
      outputs: ["joined_df"],
      file: "repo/jobs/daily_revenue.py",
    },
    {
      id: "aggregate_daily_revenue",
      op: "groupBy",
      inputs: ["joined_df"],
      outputs: ["daily_revenue_df"],
      file: "repo/jobs/daily_revenue.py",
    },
    {
      id: "write_daily_revenue",
      op: "write",
      inputs: ["daily_revenue_df"],
      outputs: ["finance.daily_revenue"],
      file: "repo/jobs/daily_revenue.py",
    },
    {
      id: "read_crm_export",
      op: "read_json",
      inputs: ["raw.crm_export"],
      outputs: ["crm_export_df"],
      file: "repo/jobs/dim_customer_loader.py",
    },
    {
      id: "write_dim_customer",
      op: "write",
      inputs: ["crm_export_df"],
      outputs: ["raw.dim_customer"],
      file: "repo/jobs/dim_customer_loader.py",
    },
  ];
}

export class DemoPipelineIngestor implements PipelineIngestor {
  readonly mode: ExecutionMode = "demo";

  async ingest(source: IngestSource): Promise<PipelineContext> {
    const { dir, scenario } = loadScenario();

    if (source.scenarioId && source.scenarioId !== scenario.id) {
      throw new Error(
        `SparkTrace demo mode only bundles scenario "${scenario.id}"; ` +
          `requested scenarioId "${source.scenarioId}" is not available.`
      );
    }

    const repoDir = path.join(dir, "repo");
    const files = collectRepoFiles(repoDir);

    const tables: TableRef[] = scenario.tables.map((t) => ({
      database: t.database,
      name: t.name,
      kind: t.kind,
      columns: t.columns,
      location: t.location,
    }));

    return {
      repoUrl: source.repoUrl ?? `demo://${scenario.id}`,
      files,
      tables,
      dag: buildDag(),
      summary: scenario.pipelineSummary,
    };
  }
}

export function makeDemoIngestor(): PipelineIngestor {
  return new DemoPipelineIngestor();
}
