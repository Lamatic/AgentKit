import { NextResponse } from "next/server"
import { checkWorkflowStatus } from "@/actions/orchestrate"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ success: false, error: "Request ID is required" }, { status: 400 })
    }

    const result = await checkWorkflowStatus(requestId)

    if (!result.success) {
      throw new Error(result.error || "Failed to check status")
    }

    return NextResponse.json(
      { success: true, status: result.status },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Status check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check status",
      },
      { status: 500 },
    )
  }
}
