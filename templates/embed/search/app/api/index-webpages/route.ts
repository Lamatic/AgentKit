import { NextResponse } from "next/server"
import { executeWebpageIndexation } from "@/actions/orchestrate"

export async function POST(request: Request) {
  try {
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ success: false, error: "URLs are required" }, { status: 400 })
    }

    const result = await executeWebpageIndexation(urls)

    if (!result.success) {
      throw new Error(result.error || "Failed to index webpages")
    }

    // For async workflows, return the requestId
    if (result.data?.mode === "async" && result.data?.requestId) {
      return NextResponse.json({ success: true, requestId: result.data.requestId })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("[v0] Webpage indexation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to index webpages",
      },
      { status: 500 },
    )
  }
}
