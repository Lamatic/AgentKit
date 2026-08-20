/**
 * SparkTrace demo mode — offline reasoner (v2, integration layer)
 * ------------------------------------------------------------------
 * Implements `LamaticReasoner` (v2: per-turn planner + repo reader +
 * query generator + analyst + reporter) deterministically, with NO
 * Lamatic API calls and NO network access of any kind, so demo mode
 * runs fully offline (CI + graders + `npm run dev` with zero
 * credentials).
 *
 * It is intentionally NOT a fake — it produces genuine, read-only SQL
 * that the demo executor (alasql over the sample CSVs) actually runs,
 * and `analyze()` reaches its verdict FROM the compacted result's
 * `stats`/`sampleRows` (never from a hardcoded answer). `readRepo()`
 * likewise derives its insight by scanning the real repo file content
 * handed to it in `pipeline.files`, not from a canned string. The only
 * "canned" part is the hypothesis vocabulary and which query template
 * maps to each hypothesis category — same as v1.
 *
 * In `live` mode the real `makeLamaticReasoner()` (Lamatic flows) is
 * used instead — same `LamaticReasoner` interface, so the orchestrator
 * never knows the difference.
 */

import type {
  CompactResult,
  DiagnosticQuery,
  Hypothesis,
  HypothesisCategory,
  Investigation,
  LamaticReasoner,
  PipelineContext,
  PlannerDecision,
  PlannerEvidence,
  QueryEngine,
  RepoInsight,
  RootCauseReport,
  StepAnalysis,
  TableRef,
} from "../contracts";
import { MAX_SAMPLE_ROWS } from "../contracts";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Find a table by (fuzzy) name from whatever the ingestor/catalog gave us. */
function findTable(tables: TableRef[], needle: string): TableRef | undefined {
  return tables.find((t) => t.name.toLowerCase().includes(needle));
}

function findHypothesisByCategory(
  hypotheses: Hypothesis[],
  category: HypothesisCategory
): Hypothesis | undefined {
  return hypotheses.find((h) => h.category === category);
}

function makeLateArrivingHypothesis(): Hypothesis {
  return {
    id: uid("hyp"),
    title: "Late-arriving customer dimension drops recent orders via INNER JOIN",
    rationale:
      "The undercount is confined to the most recent days and the pipeline joins orders to a separately-loaded customer dimension. If the dimension lags, an inner join silently drops orders for not-yet-loaded customers.",
    category: "late-arriving",
    confidence: 0.8,
    status: "open",
  };
}

function makeVolumeAnomalyHypothesis(): Hypothesis {
  return {
    id: uid("hyp"),
    title: "Upstream order volume genuinely dropped on recent days",
    rationale:
      "The mart could be correct and the business simply saw fewer/smaller orders. Tested by comparing raw order totals per day for a real drop-off, not just a join artifact.",
    category: "volume-anomaly",
    confidence: 0.45,
    status: "open",
  };
}

class DemoReasoner implements LamaticReasoner {
  async plan(input: {
    symptom: string;
    pipeline: PipelineContext;
    evidence: PlannerEvidence[];
    hypothesesTried: Hypothesis[];
  }): Promise<PlannerDecision> {
    const { evidence, hypothesesTried } = input;

    // Turn 0: no evidence gathered at all yet. Peek at the repo first to
    // show real repo-grounded reasoning before committing to a query.
    if (evidence.length === 0 && hypothesesTried.length === 0) {
      return {
        action: "read_repo",
        reasoning:
          "Before generating any diagnostic SQL, inspect the transform job that produces the affected mart — the join semantics there (inner vs. outer, and against what dimension) narrow the hypothesis space cheaply and for free.",
        focus: "daily_revenue.py join",
      };
    }

    const lateArriving = findHypothesisByCategory(hypothesesTried, "late-arriving");
    const volumeAnomaly = findHypothesisByCategory(hypothesesTried, "volume-anomaly");

    if (lateArriving?.status === "confirmed") {
      return {
        action: "conclude",
        reasoning:
          "The late-arriving-dimension hypothesis was confirmed by the anti-join evidence: unmatched orders exist and cluster on recent dates. No further hypotheses need to be tested.",
      };
    }

    if (!lateArriving) {
      return {
        action: "gen_query",
        reasoning:
          "The repo shows orders joined to dim_customer; test the strongest prior — a dropping inner join against a lagged dimension — with an anti-join query.",
        hypothesis: makeLateArrivingHypothesis(),
      };
    }

    if (lateArriving.status === "refuted" || lateArriving.status === "inconclusive") {
      if (!volumeAnomaly) {
        return {
          action: "gen_query",
          reasoning:
            "The late-arriving-dimension hypothesis did not hold up. Test the remaining plausible explanation — a genuine drop in upstream order volume — before concluding.",
          hypothesis: makeVolumeAnomalyHypothesis(),
        };
      }
      return {
        action: "conclude",
        reasoning:
          "Both the late-arriving-dimension and volume-anomaly hypotheses have been tested. Time to synthesize a final report from the evidence gathered so far.",
      };
    }

    // Defensive fallback: the late-arriving hypothesis exists but hasn't
    // been queried/analyzed yet (status still "open").
    return {
      action: "gen_query",
      reasoning: "Re-issuing the diagnostic query for the open hypothesis.",
      hypothesis: lateArriving,
    };
  }

  async readRepo(input: {
    symptom: string;
    pipeline: PipelineContext;
    focus: string;
  }): Promise<RepoInsight> {
    const { pipeline, focus } = input;

    const transformFile = pipeline.files.find((f) => f.path.includes("daily_revenue.py"));
    const dimLoaderFile = pipeline.files.find((f) => f.path.includes("dim_customer_loader.py"));

    const lines: string[] = [];

    if (transformFile) {
      const joinMatch = /how\s*=\s*"(\w+)"/.exec(transformFile.content);
      const joinType = joinMatch ? joinMatch[1] : "unknown";
      lines.push(
        `${transformFile.path} joins orders to dim_customer with how="${joinType}" on customer_id.`
      );
      if (joinType === "inner") {
        lines.push(
          "An inner join silently drops any order row whose customer_id has no match on the right side — i.e. any order from a customer not yet present in dim_customer."
        );
      }
      if (/overwrite/i.test(transformFile.content)) {
        lines.push(
          "The job writes its output with mode(\"overwrite\"), replacing the mart's prior contents on every run rather than reprocessing/backfilling earlier partitions."
        );
      }
    } else {
      lines.push(`Could not locate a transform file matching focus "${focus}" in the ingested pipeline files.`);
    }

    if (dimLoaderFile) {
      const cadenceMatch = /every\s+(\d+)\s+days?/i.exec(dimLoaderFile.content);
      const lagMatch = /(\d+)[\s-]*(?:to|-)[\s-]*(\d+)\s*day/i.exec(dimLoaderFile.content);
      if (cadenceMatch) {
        lines.push(
          `${dimLoaderFile.path} refreshes dim_customer on a ${cadenceMatch[1]}-day cadence, so newly-signed-up customers are absent from the dimension for up to that long.`
        );
      } else if (lagMatch) {
        lines.push(
          `${dimLoaderFile.path} indicates a ${lagMatch[1]}-${lagMatch[2]} day lag before new customers appear in dim_customer.`
        );
      }
    }

    return {
      focus,
      insight: lines.join(" "),
    };
  }

  async generateQuery(input: {
    symptom: string;
    hypothesis: Hypothesis;
    tables: TableRef[];
    engine: QueryEngine;
  }): Promise<DiagnosticQuery> {
    const { hypothesis, tables, engine } = input;
    const orders = findTable(tables, "order")?.name ?? "orders";
    const dim = findTable(tables, "customer")?.name ?? "dim_customer";

    let sql: string;
    let purpose: string;

    switch (hypothesis.category) {
      case "late-arriving":
      case "join-explosion":
      case "schema-drift": {
        // Anti-join: orders with no matching dimension row. If this
        // returns rows clustered on recent dates, the dimension join is
        // dropping data.
        sql =
          `SELECT o.order_date, COUNT(*) AS dropped_orders, ROUND(SUM(o.amount), 2) AS dropped_amount\n` +
          `FROM ${orders} o\n` +
          `LEFT JOIN ${dim} d ON o.customer_id = d.customer_id\n` +
          `WHERE d.customer_id IS NULL\n` +
          `GROUP BY o.order_date\n` +
          `ORDER BY o.order_date`;
        purpose =
          "Anti-join the fact table against the customer dimension; any orders with a NULL dimension match are being dropped by an inner join. Clustering on recent dates confirms a late-arriving dimension.";
        break;
      }
      case "volume-anomaly":
      default: {
        // Compare raw order totals per day, unaffected by any join.
        sql =
          `SELECT o.order_date, COUNT(*) AS order_count, ROUND(SUM(o.amount), 2) AS raw_revenue\n` +
          `FROM ${orders} o\n` +
          `GROUP BY o.order_date\n` +
          `ORDER BY o.order_date`;
        purpose =
          "Aggregate the raw fact table per day, independent of any dimension join. If recent-day volume is at the normal run rate here, the loss is introduced downstream in the pipeline, not by upstream volume.";
        break;
      }
    }

    return {
      id: uid("q"),
      hypothesisId: hypothesis.id,
      engine,
      sql,
      purpose,
    };
  }

  async analyze(input: {
    symptom: string;
    hypothesis: Hypothesis;
    query: DiagnosticQuery;
    result: CompactResult;
  }): Promise<StepAnalysis> {
    const { hypothesis, result } = input;

    if (result.error) {
      return {
        verdict: "inconclusive",
        reasoning: `The diagnostic query failed to execute (${result.error}), so this hypothesis could not be tested.`,
        hint: "next-hypothesis",
      };
    }

    if (
      hypothesis.category === "late-arriving" ||
      hypothesis.category === "join-explosion" ||
      hypothesis.category === "schema-drift"
    ) {
      return this.analyzeAntiJoin(result);
    }

    return this.analyzeVolume(result);
  }

  private analyzeAntiJoin(result: CompactResult): StepAnalysis {
    const droppedCol = result.stats.columns.find((c) => c.name === "dropped_orders");

    if (result.rowCount > 0 && droppedCol?.avg === undefined) {
      return {
        verdict: "inconclusive",
        reasoning:
          `The anti-join returned ${result.rowCount} row(s) but no numeric "dropped_orders" statistic was available to quantify the impact.`,
        hint: "refine-query",
      };
    }

    const totalDropped = droppedCol?.avg !== undefined ? Math.round(droppedCol.avg * result.rowCount) : 0;

    if (result.rowCount > 0 && totalDropped > 0) {
      const dateDescriptor = result.stats.dateSpan
        ? `${result.stats.dateSpan.min} through ${result.stats.dateSpan.max}`
        : result.sampleRows.map((r) => String(r.order_date)).join(", ");
      return {
        verdict: "confirmed",
        reasoning:
          `The anti-join returned ${result.rowCount} affected day(s) (${dateDescriptor}) with ~${totalDropped} orders that have no matching customer dimension row. ` +
          `The dropped orders cluster on the most recent dates, which matches the reported undercount window. This confirms the inner join is silently discarding orders for customers missing from the dimension.`,
        hint: "conclude",
      };
    }

    return {
      verdict: "refuted",
      reasoning: "The anti-join returned no unmatched orders, so a dropping join is not the cause.",
      hint: "next-hypothesis",
    };
  }

  private analyzeVolume(result: CompactResult): StepAnalysis {
    if (result.rowCount === 0) {
      return {
        verdict: "inconclusive",
        reasoning: "The per-day volume query returned no rows to compare.",
        hint: "next-hypothesis",
      };
    }

    const dropRatio = detectTailVolumeDrop(result);

    if (dropRatio === undefined) {
      return {
        verdict: "inconclusive",
        reasoning:
          "The per-day volume query returned rows, but not a usable multi-day numeric \"order_count\" series — there is nothing to compare the recent days against the earlier run rate with.",
        hint: "refine-query",
      };
    }

    if (dropRatio >= 0.3) {
      return {
        verdict: "confirmed",
        reasoning:
          `Raw per-day order counts drop by roughly ${Math.round(dropRatio * 100)}% on the most recent day(s) compared to the earlier run rate, so upstream volume genuinely fell — the mart's numbers may be accurately reflecting reality rather than a pipeline bug.`,
        hint: "conclude",
      };
    }

    return {
      verdict: "refuted",
      reasoning:
        "Raw per-day order totals remain at the normal run rate on the affected days (no meaningful drop-off versus earlier days), so upstream volume did not fall — the loss is introduced downstream in the pipeline.",
      hint: "next-hypothesis",
    };
  }

  async report(input: { investigation: Investigation }): Promise<RootCauseReport> {
    const { investigation } = input;
    const confirmedStep = investigation.steps.find((s) => s.analysis?.verdict === "confirmed");

    const evidence = investigation.steps
      .filter((s) => s.compact && !s.compact.error && s.analysis)
      .map((s) => ({
        hypothesisId: s.hypothesis.id,
        queryId: s.query.id,
        finding: s.analysis!.reasoning,
      }));

    if (!confirmedStep) {
      return {
        rootCause: "Inconclusive — no hypothesis was confirmed by the available diagnostic queries.",
        confidence: 0.2,
        evidence,
        suggestedFix: "Broaden the investigation window or provide additional pipeline context.",
        caveats: ["Demo mode reasons over a small fixture dataset."],
      };
    }

    const confidence = Math.min(0.95, Math.max(0.75, confirmedStep.hypothesis.confidence + 0.1));

    // The diagnosis has to follow whichever hypothesis the queries
    // actually confirmed. `plan()` can refute late-arriving and then
    // confirm volume-anomaly, and narrating a dropping inner join in
    // that path would contradict the very evidence listed beneath it.
    if (confirmedStep.hypothesis.category === "volume-anomaly") {
      return {
        rootCause:
          "Upstream order volume genuinely fell on the affected days. Raw per-day order counts — measured without joining `dim_customer`, so they are immune to join artifacts — drop materially against the earlier run rate. " +
          "The `daily_revenue` mart is reporting that decline accurately rather than losing rows: this is a business/source-data change, not a pipeline defect.",
        confidence,
        evidence,
        suggestedFix:
          "Treat this as a data/business investigation rather than a pipeline fix: confirm with the upstream order source whether intake genuinely dropped (outage, checkout regression, seasonality, or a partner/region going quiet), and check the ingestion job for partial or delayed loads on those dates. Only revisit the transform if raw intake turns out to be intact.",
        caveats: [
          "Diagnosis is based on a small deterministic fixture dataset in demo mode.",
          "Confirms that raw volume fell; it does not establish why upstream volume changed.",
        ],
      };
    }

    const repoInsight = investigation.repoInsights.find((r) => /join/i.test(r.focus) || /daily_revenue/i.test(r.focus));

    const rootCause =
      "The nightly revenue job joins `orders` to `dim_customer` with an INNER JOIN, while the customer dimension is refreshed on a lagged cadence relative to new-customer signup. " +
      "Orders from customers not yet present in the dimension are silently dropped by the join, undercounting revenue on recent days. " +
      "Because the mart is overwritten each run rather than reprocessed, the gap never self-heals." +
      (repoInsight ? ` (Confirmed directly in the repo: ${repoInsight.insight})` : "");

    return {
      rootCause,
      confidence,
      evidence,
      suggestedFix:
        "Change the orders→dim_customer join to a LEFT JOIN so unmatched orders are retained (attribute region as 'unknown' pending dimension load), and/or reprocess prior partitions once the dimension catches up instead of overwriting the mart. Longer term, close the dimension-load lag or add a late-arriving-dimension backfill.",
      caveats: [
        "Diagnosis is based on a small deterministic fixture dataset in demo mode.",
        "Confirms the mechanism (dropping inner join on a lagged dimension); exact revenue impact should be quantified against full production data.",
      ],
    };
  }
}

/**
 * Compares the tail of a per-day order_count series against the head to
 * detect a genuine volume drop-off (as opposed to a join artifact, which
 * this query is immune to since it never touches dim_customer). Returns
 * the proportional drop (0..1) of the tail average vs. the head average,
 * or undefined if there isn't enough data to compare.
 *
 * IMPORTANT: `result.sampleRows` is NOT a contiguous slice of the result —
 * the compactor builds it as a head+tail composite (first ceil(k/2) rows
 * plus the last floor(k/2) rows, k = MAX_SAMPLE_ROWS). That is exactly the
 * right shape for this test — the earliest and the most recent days — but
 * only if we split it at the same seam the compactor used. Splitting it by
 * some other ratio mixes tail-window rows into the "head" baseline.
 *
 * We deliberately do NOT gate on `result.truncated`: the compactor sets it
 * whenever rowCount exceeds the sample size, so any series longer than
 * MAX_SAMPLE_ROWS days would skip the comparison entirely. The head+tail
 * sample is a valid basis for the comparison whether or not the middle of
 * the series was dropped.
 */
/** How many of the most recent sampled days count as "the tail" for a drop test. */
const TAIL_WINDOW_DAYS = 3;

function detectTailVolumeDrop(result: CompactResult): number | undefined {
  const sorted = [...result.sampleRows].sort((a, b) =>
    String(a.order_date).localeCompare(String(b.order_date))
  );
  const n = sorted.length;
  if (n < 2) return undefined;

  // Mirror the compactor's seam: it takes ceil(k/2) head rows, so for a
  // full sample the first half is the earliest days and the second half
  // the most recent ones. The head half is the baseline.
  const headCount = Math.ceil(Math.min(n, MAX_SAMPLE_ROWS) / 2);
  const head = sorted.slice(0, headCount);
  const recent = sorted.slice(headCount);
  if (head.length === 0 || recent.length === 0) return undefined;

  // Bound the tail window rather than averaging the whole second half. A
  // real outage is usually confined to the last day or two, and the sample's
  // tail half spans five days — averaging all of them dilutes a sharp drop
  // below the caller's threshold (3 days at -42% reads as -25% once two
  // healthy days are folded in, and the drop goes undetected).
  const tail = recent.slice(-Math.min(TAIL_WINDOW_DAYS, recent.length));

  const headAvg = averageOf(head, "order_count");
  const tailAvg = averageOf(tail, "order_count");
  if (headAvg === undefined || tailAvg === undefined || headAvg === 0) return undefined;
  return Math.max(0, (headAvg - tailAvg) / headAvg);
}

function averageOf(rows: Array<Record<string, unknown>>, column: string): number | undefined {
  const values = rows
    .map((r) => r[column])
    .filter((v): v is number => typeof v === "number");
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function makeDemoReasoner(): LamaticReasoner {
  return new DemoReasoner();
}
