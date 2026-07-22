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

/**
 * Handles HTTP POST requests to chunk and ingest runbook content into Lamatic Vector DB.
 * @param req Incoming Next.js HTTP request containing `{ content: string, source: string }`.
 * @returns JSON response indicating ingestion status and indexed chunk count.
 */
export async function POST(req: NextRequest) {
  try {
    const { content, source, tags } = await req.json();

    if (
      typeof content !== "string" ||
      content.trim() === "" ||
      typeof source !== "string" ||
      source.trim() === ""
    ) {
      return NextResponse.json(
        { error: "content and source are required and must be non-empty strings" },
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
      metadata: [{ runbook_id: source, tags: Array.isArray(tags) ? tags : [] }],
    });

    if (res.error) {
      return NextResponse.json(
        { error: "Upstream ingestion failed: " + res.error },
        { status: 502 }
      );
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
