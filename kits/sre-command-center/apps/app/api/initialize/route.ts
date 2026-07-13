import { NextRequest, NextResponse } from "next/server";
import { callLamaticGraphQL, isLamaticConfigured } from "../../../lib/lamatic";

const FLOW_ID = process.env.LAMATIC_FLOW_INGESTION_ID || "";

const GRAPHQL_QUERY = `
  query ExecuteWorkflow(
    $workflowId: String!
    $contents: [String]
    $metadata: [JSON]        
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: {
        contents: $contents
        metadata: $metadata
      }
    ) {
      status
      result
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const { content, source } = await req.json();

    if (!content || !source) {
      return NextResponse.json(
        { error: "content and source are required" },
        { status: 400 }
      );
    }

    if (!isLamaticConfigured() || !FLOW_ID) {
      // Return simulated success for local challenge demo mode
      return NextResponse.json({
        success: true,
        source,
        chunks_indexed: Math.floor(content.length / 300) + 1,
        mode: "demo",
      });
    }

    const res = await callLamaticGraphQL(GRAPHQL_QUERY, {
      workflowId: FLOW_ID,
      contents: [content],
      metadata: [{ runbook_id: source }],
    });

    if (res.error) {
      console.warn("Lamatic API error in initialize, falling back to simulated mode:", res.error);
      return NextResponse.json({
        success: true,
        source,
        chunks_indexed: Math.floor(content.length / 300) + 1,
        mode: "demo",
      });
    }

    return NextResponse.json({
      success: true,
      data: res.result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to initialize runbook database: " + msg },
      { status: 500 }
    );
  }
}
