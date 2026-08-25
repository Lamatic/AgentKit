/**
 * SparkTrace — Investigation orchestrator (Module C, v2)
 * ------------------------------------------------------------------
 * The PLANNER-driven loop (replaces v1's fixed hypothesis-queue ReAct
 * loop). Every turn, an Opus-tier planner decides the next action from
 * the evidence accumulated so far — there is no pre-baked plan/queue:
 *
 *   1. ingestor.ingest(source)                -> PipelineContext   [emit: pipeline]
 *   2. status "investigating". Loop up to deps.stepBudget turns:
 *        a. reasoner.plan({symptom, pipeline, evidence, hypothesesTried})
 *                                              -> PlannerDecision  [emit: decision]
 *        b. switch decision.action:
 *             "conclude"   -> stop looping.
 *             "read_repo"  -> reasoner.readRepo(...) -> RepoInsight
 *                              [emit: repo-insight], fold into evidence.
 *             "gen_query"  -> reasoner.generateQuery(...) -> DiagnosticQuery
 *                           -> guardQuery(query)      [HARD GATE — see below]
 *                           -> executor.execute(...)  -> QueryExecutionResult
 *                           -> compact(...)           -> CompactResult
 *                              [MUST happen before the analyst sees anything]
 *                           -> reasoner.analyze(...)  -> StepAnalysis
 *                              [emit: step], fold into evidence.
 *   3. reasoner.report(investigation)          -> RootCauseReport   [emit: report]
 *
 * Two deterministic layers sit between the model tiers and are NOT
 * skippable by any code path in this file:
 *   - `deps.guardQuery`: every DiagnosticQuery is checked BEFORE it is
 *     ever handed to `deps.executor.execute()`. A rejected query is
 *     recorded (for the record/UI) and NEVER executed.
 *   - `deps.compact`: every QueryExecutionResult is compacted BEFORE
 *     it is handed to `deps.reasoner.analyze()` — the analyst never
 *     sees raw rows (see contracts.ts CompactResult / MAX_SAMPLE_ROWS).
 *
 * This module is intentionally mode-agnostic: it only ever touches the
 * interfaces in ../lib/contracts.ts (`OrchestratorDeps`). Swapping
 * live AWS/Lamatic implementations for demo fixtures is entirely a
 * matter of which concrete objects `buildDeps()` wires up.
 *
 * NOTE: this file does NOT use the `"use server"` directive. A Next.js
 * Server Action's arguments/return value must be serializable across
 * the client/server RPC boundary, but `OrchestratorDeps` carries live
 * function values (guardQuery, compact, executor/catalog/ingestor/
 * reasoner methods) and `runInvestigation` returns an AsyncGenerator —
 * neither is serializable. This module is meant to be imported
 * directly from server-side code only (a Route Handler, RSC, or
 * another server action that adapts the event stream into something
 * serializable, e.g. SSE) — see apps/app/api/investigate/route.ts,
 * which is the existing consumer.
 */

import type {
  CompactResult,
  DiagnosticQuery,
  ExecutionMode,
  Hypothesis,
  Investigation,
  InvestigationEvent,
  InvestigationStep,
  OrchestratorDeps,
  PlannerDecision,
  PlannerEvidence,
  QueryEngine,
  QueryExecutionResult,
  RunInvestigationInput,
  TableRef,
} from "../lib/contracts";

const DEFAULT_STEP_BUDGET = 6;

function makeId(prefix: string): string {
  try {
    return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function emptyPipeline(repoUrl?: string): Investigation["pipeline"] {
  return { repoUrl, files: [], tables: [], dag: [], summary: "" };
}

/**
 * Schema-grounding step: resolve full TableRef (with columns) for every
 * table the ingestor found in the pipeline. Falls back to
 * `catalog.listTables()` when the ingestor found no tables (e.g. a
 * minimal/unparseable repo), so the query-gen flow still has *some*
 * schema context. Individual `describeTable` failures degrade to the
 * ingestor's bare TableRef rather than aborting the investigation.
 */
async function gatherTables(investigation: Investigation, deps: OrchestratorDeps): Promise<TableRef[]> {
  const known = investigation.pipeline.tables;
  if (known.length === 0) {
    try {
      return await deps.catalog.listTables();
    } catch {
      return [];
    }
  }
  return Promise.all(
    known.map(async (table) => {
      try {
        return await deps.catalog.describeTable(table.database, table.name);
      } catch {
        return table;
      }
    })
  );
}

/**
 * Executes a query the executor way — `deps.executor.execute` never
 * throws per its contract (QueryExecutor doc in contracts.ts), but we
 * defend anyway: any thrown error is folded into the same
 * `{error}`-carrying QueryExecutionResult shape so `deps.compact` (and
 * the analyst) can reason about a failure exactly like they would a
 * backend-reported one.
 */
async function safeExecute(query: DiagnosticQuery, deps: OrchestratorDeps): Promise<QueryExecutionResult> {
  try {
    return await deps.executor.execute(query);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      queryId: query.id,
      columns: [],
      rows: [],
      rowCount: 0,
      runtimeMs: 0,
      engine: query.engine,
      error: message,
    };
  }
}

/**
 * The planner-driven investigation loop. Mode-agnostic: everything it
 * touches comes through `deps` (see OrchestratorDeps in
 * ../lib/contracts.ts). Any thrown error is caught, surfaced as
 * `{type:"error"}` + `{type:"status", status:"error"}`, and the
 * generator ends.
 */
export async function* runInvestigation(
  input: RunInvestigationInput,
  deps: OrchestratorDeps
): AsyncGenerator<InvestigationEvent> {
  const stepBudget = deps.stepBudget ?? DEFAULT_STEP_BUDGET;

  const investigation: Investigation = {
    id: makeId("inv"),
    symptom: input.symptom,
    mode: input.mode,
    pipeline: emptyPipeline(input.source.repoUrl),
    decisions: [],
    hypotheses: [],
    steps: [],
    repoInsights: [],
    status: "ingesting",
  };

  try {
    // 1. Ingest
    yield { type: "status", status: "ingesting" };
    const pipeline = await deps.ingestor.ingest(input.source);
    investigation.pipeline = pipeline;
    yield { type: "pipeline", pipeline };

    // 2. Investigate: the planner-driven loop.
    investigation.status = "investigating";
    yield { type: "status", status: "investigating" };

    const engine: QueryEngine = "athena";
    const evidence: PlannerEvidence[] = [];
    const hypothesesTried: Hypothesis[] = [];

    // Schema grounding is derived purely from `investigation.pipeline`,
    // which is fixed once ingestion completes — so resolve it lazily on
    // the first gen_query turn and reuse it for every later one instead
    // of re-running listTables()/describeTable() per query generation.
    // `null` (not `[]`) means "not resolved yet", so a genuinely empty
    // catalog result is cached too rather than retried every turn.
    let resolvedTables: TableRef[] | null = null;

    for (let turn = 0; turn < stepBudget; turn++) {
      const decision: PlannerDecision = await deps.reasoner.plan({
        symptom: investigation.symptom,
        pipeline: investigation.pipeline,
        evidence,
        hypothesesTried,
      });
      investigation.decisions.push(decision);
      yield { type: "decision", decision };

      if (decision.action === "conclude") {
        break;
      }

      if (decision.action === "read_repo") {
        const insight = await deps.reasoner.readRepo({
          symptom: investigation.symptom,
          pipeline: investigation.pipeline,
          focus: decision.focus ?? "",
        });
        investigation.repoInsights.push(insight);
        yield { type: "repo-insight", insight };
        evidence.push({ kind: "repo", summary: insight.insight });
        continue;
      }

      // decision.action === "gen_query"
      const hypothesis = decision.hypothesis;
      if (!hypothesis) {
        // Guard: the planner asked to generate a query but gave no
        // hypothesis to test it against. Treat as inconclusive and
        // keep looping rather than crashing the investigation — the
        // next planner turn gets this folded into its evidence.
        evidence.push({
          kind: "query",
          summary: "planner chose gen_query with no hypothesis attached; skipped.",
        });
        continue;
      }

      hypothesesTried.push(hypothesis);
      const existingIdx = investigation.hypotheses.findIndex((h) => h.id === hypothesis.id);
      if (existingIdx >= 0) {
        investigation.hypotheses[existingIdx] = hypothesis;
      } else {
        investigation.hypotheses.push(hypothesis);
      }

      if (resolvedTables === null) {
        resolvedTables = await gatherTables(investigation, deps);
      }
      const query = await deps.reasoner.generateQuery({
        symptom: investigation.symptom,
        hypothesis,
        tables: resolvedTables,
        engine,
      });

      // HARD GATE: never reaches executor.execute() on a failed guard.
      const guard = deps.guardQuery(query);
      if (!guard.ok) {
        hypothesis.status = "inconclusive";
        const step: InvestigationStep = { hypothesis, query, guard };
        investigation.steps.push(step);
        yield { type: "step", step };
        evidence.push({
          kind: "query",
          hypothesisId: hypothesis.id,
          summary: `query blocked by guard: ${guard.violations.join("; ")}`,
        });
        continue;
      }

      const lintedQuery: DiagnosticQuery = guard.normalizedSql ? { ...query, sql: guard.normalizedSql } : query;

      const execution = await safeExecute(lintedQuery, deps);

      // MUST happen before the analyst ever sees this result.
      const compactResult: CompactResult = deps.compact(execution);

      const analysis = await deps.reasoner.analyze({
        symptom: investigation.symptom,
        hypothesis,
        query: lintedQuery,
        result: compactResult,
      });

      hypothesis.status = analysis.verdict;

      const step: InvestigationStep = {
        hypothesis,
        query: lintedQuery,
        guard,
        execution,
        compact: compactResult,
        analysis,
      };
      investigation.steps.push(step);
      yield { type: "step", step };

      evidence.push({
        kind: "query",
        hypothesisId: hypothesis.id,
        summary: analysis.reasoning,
      });
    }

    // 3. Report
    investigation.status = "reporting";
    yield { type: "status", status: "reporting" };
    const report = await deps.reasoner.report({ investigation });
    investigation.report = report;
    yield { type: "report", report };

    investigation.status = "done";
    yield { type: "status", status: "done" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    investigation.status = "error";
    investigation.error = message;
    yield { type: "error", message };
    yield { type: "status", status: "error" };
  }
}

// ─────────────────────────────────────────────────────────────
// Dependency wiring (mode -> concrete implementations)
// ─────────────────────────────────────────────────────────────

/**
 * Wires `OrchestratorDeps` for a given execution mode. Imports are
 * dynamic/lazy so this file — and therefore `runInvestigation`, which
 * is mode-agnostic — never hard-fails to load just because a sibling
 * module (owned by Modules A/B/D) isn't finished yet or a mode's
 * dependencies (e.g. AWS SDK creds) aren't configured in the current
 * environment. Only the mode actually requested pays the import cost.
 *
 * Because dynamic `import()` is inherently async, and because this
 * file avoids `"use server"` (see file-level note above), `buildDeps`
 * is an async function returning `Promise<OrchestratorDeps>` rather
 * than a sync `OrchestratorDeps` — call it with `await`.
 *
 * Step ids/envKeys (sparktrace-planner, sparktrace-repo-reader,
 * sparktrace-query-gen, sparktrace-analyst, sparktrace-reporter) are
 * declared once, as the canonical source of truth, in the parent kit's
 * `../../lamatic.config`. `lib/lamatic-client.ts` imports it and resolves
 * each step's `envKey` from there, so the flow-id env var names
 * (SPARKTRACE_*_FLOW_ID) are never duplicated as literals.
 */
export async function buildDeps(mode: ExecutionMode): Promise<OrchestratorDeps> {
  // apps/lib/safety/query-guard.ts — Module B, pure function, no deps.
  // apps/lib/economy/compactor.ts  — Module B, pure function, no deps.
  const [{ guardQuery }, { compact }] = await Promise.all([
    import("../lib/safety/query-guard"),
    import("../lib/economy/compactor"),
  ]);

  if (mode === "live") {
    const [{ makeLamaticReasoner }, athenaMod, glueMod, gitMod] = await Promise.all([
      import("../lib/lamatic-client"),
      import("../lib/aws/athena-client"),
      import("../lib/aws/glue-client"),
      import("../lib/ingest/git-ingest"),
    ]);

    return {
      reasoner: makeLamaticReasoner(),
      executor: athenaMod.makeAthenaExecutor(),
      catalog: glueMod.makeGlueCatalog(),
      ingestor: gitMod.makeGitIngestor(),
      guardQuery,
      compact,
      stepBudget: DEFAULT_STEP_BUDGET,
    };
  }

  // mode === "demo" — fully offline: the demo reasoner is deterministic
  // and makes NO Lamatic API calls, so demo mode needs zero credentials
  // (CI + graders). See apps/lib/demo/demo-reasoner.ts.
  const [{ makeDemoReasoner }, demoExecMod, demoCatalogMod, demoIngestMod] = await Promise.all([
    import("../lib/demo/demo-reasoner"),
    import("../lib/demo/demo-executor"),
    import("../lib/demo/demo-catalog"),
    import("../lib/demo/demo-ingestor"),
  ]);

  return {
    reasoner: makeDemoReasoner(),
    executor: demoExecMod.makeDemoExecutor(),
    catalog: demoCatalogMod.makeDemoCatalog(),
    ingestor: demoIngestMod.makeDemoIngestor(),
    guardQuery,
    compact,
    stepBudget: DEFAULT_STEP_BUDGET,
  };
}
