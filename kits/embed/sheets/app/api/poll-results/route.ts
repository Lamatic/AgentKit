import { NextResponse } from "next/server"
import { getPendingResults, clearPendingResults } from "@/lib/pending-results"

export async function GET() {
  try {
    const results = getPendingResults()

    // Clear results after sending to client
    if (results.length > 0) {
      clearPendingResults()
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("[v0] Error polling results:", error)
    return NextResponse.json({ error: "Failed to poll results" }, { status: 500 })
  }
}
