import { NextRequest, NextResponse } from "next/server";
import { Lamatic } from "lamatic";

// Lazy-init so the module can be imported at build time without real env vars
function getLamatic() {
  return new Lamatic({
    endpoint: process.env.LAMATIC_API_URL!,
    projectId: process.env.LAMATIC_PROJECT_ID!,
    apiKey: process.env.LAMATIC_API_KEY!,
  });
}

const FLOW_IDS = {
  schema: process.env.EDA_SCHEMA_ANALYSIS_FLOW_ID,
  statistical: process.env.EDA_STATISTICAL_INSIGHTS_FLOW_ID,
  mlReadiness: process.env.EDA_ML_READINESS_FLOW_ID,
};

export async function POST(req: NextRequest) {
  try {
    const lamatic = getLamatic();
    const body = await req.json();
    const { datasetSummary, fileName, step } = body;

    if (!datasetSummary) {
      return NextResponse.json({ error: "datasetSummary is required" }, { status: 400 });
    }

    // ── Step 1: Schema Analysis ────────────────────────────────────────────
    if (step === "schema") {
      const response = await lamatic.executeFlow(FLOW_IDS.schema!, {
        datasetSummary,
        fileName: fileName || "dataset.csv",
      });

      if (response.status !== "success") {
        throw new Error(response.message || "Schema analysis flow failed");
      }

      return NextResponse.json({ success: true, step: "schema", result: response.result });
    }

    // ── Step 2: Statistical Insights ──────────────────────────────────────
    if (step === "statistical") {
      const { schemaInsights } = body;
      if (!schemaInsights) {
        return NextResponse.json(
          { error: "schemaInsights is required for step 2" },
          { status: 400 }
        );
      }

      const response = await lamatic.executeFlow(FLOW_IDS.statistical!, {
        datasetSummary,
        schemaInsights,
      });

      if (response.status !== "success") {
        throw new Error(response.message || "Statistical insights flow failed");
      }

      return NextResponse.json({ success: true, step: "statistical", result: response.result });
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

      const response = await lamatic.executeFlow(FLOW_IDS.mlReadiness!, {
        datasetSummary,
        schemaInsights,
        statisticalInsights,
      });

      if (response.status !== "success") {
        throw new Error(response.message || "ML readiness flow failed");
      }

      return NextResponse.json({ success: true, step: "mlReadiness", result: response.result });
    }

    return NextResponse.json(
      { error: "Invalid step. Use: schema | statistical | mlReadiness" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[EDA Copilot API Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
