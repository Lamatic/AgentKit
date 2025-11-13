import { type NextRequest, NextResponse } from "next/server"
import { executePDFIndexation } from "@/actions/orchestrate"

export async function POST(request: NextRequest) {
  try {
    const { title, url } = await request.json()

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 })
    }

    const result = await executePDFIndexation(title, url)

    if (!result.success) {
      throw new Error(result.error || "Indexation failed")
    }

    // Extract the message from the result
    const message =
      typeof result.data?.status?.response === "string"
        ? result.data.status.response
        : JSON.stringify(result.data?.status || "")

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error("Indexation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Indexation failed",
      },
      { status: 500 },
    )
  }
}
