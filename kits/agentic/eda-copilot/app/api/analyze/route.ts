import { NextRequest, NextResponse } from "next/server";

const LAMATIC_API_URL = process.env.LAMATIC_API_URL!;
const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY!;
const LAMATIC_PROJECT_ID = process.env.LAMATIC_PROJECT_ID!;

const FLOW_IDS = {
  schema: process.env.EDA_SCHEMA_ANALYSIS_FLOW_ID!,
  statistical: process.env.EDA_STATISTICAL_INSIGHTS_FLOW_ID!,
  mlReadiness: process.env.EDA_ML_READINESS_FLOW_ID!,
};

/**
 * Calls a single Lamatic flow and returns the result.
 */
async function callLamaticFlow(
  flowId: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  const url = `${LAMATIC_API_URL}/flow/${flowId}/run`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LAMATIC_API_KEY}`,
      "X-Project-Id": LAMATIC_PROJECT_ID,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Lamatic flow ${flowId} failed: ${res.status} — ${errorText}`);
  }

  const data = await res.json();
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { datasetSummary, fileName, step } = body;

    if (!datasetSummary) {
      return NextResponse.json({ error: "datasetSummary is required" }, { status: 400 });
    }

    // ── Step 1: Schema Analysis ────────────────────────────────────────────
    if (step === "schema") {
      const result = await callLamaticFlow(FLOW_IDS.schema, {
        datasetSummary,
        fileName: fileName || "dataset.csv",
      });
      return NextResponse.json({ success: true, step: "schema", result });
    }

    // ── Step 2: Statistical Insights ──────────────────────────────────────
    if (step === "statistical") {
      const { schemaInsights } = body;
      if (!schemaInsights) {
        return NextResponse.json({ error: "schemaInsights required for step 2" }, { status: 400 });
      }
      const result = await callLamaticFlow(FLOW_IDS.statistical, {
        datasetSummary,
        schemaInsights,
      });
      return NextResponse.json({ success: true, step: "statistical", result });
    }

    // ── Step 3: ML Readiness ──────────────────────────────────────────────
    if (step === "mlReadiness") {
      const { schemaInsights, statisticalInsights } = body;
      if (!schemaInsights || !statisticalInsights) {
        return NextResponse.json(
          { error: "schemaInsights and statisticalInsights required for step 3" },
          { status: 400 }
        );
      }
      const result = await callLamaticFlow(FLOW_IDS.mlReadiness, {
        datasetSummary,
        schemaInsights,
        statisticalInsights,
      });
      return NextResponse.json({ success: true, step: "mlReadiness", result });
    }

    return NextResponse.json({ error: "Invalid step. Use: schema | statistical | mlReadiness" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[EDA Copilot API Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
