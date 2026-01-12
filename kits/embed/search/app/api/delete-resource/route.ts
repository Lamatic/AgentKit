import { type NextRequest, NextResponse } from "next/server"
import { executeResourceDeletion } from "@/actions/orchestrate"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title = "", type = "", urls = [] } = body

    console.log("[v0] Delete-resource API received:", { title, type, urls })

    // Validate the payload structure
    if (!type || (type !== "pdf" && type !== "webpages")) {
      console.error("[v0] Invalid type:", type)
      return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 })
    }

    if (!Array.isArray(urls)) {
      console.error("[v0] URLs is not an array:", urls)
      return NextResponse.json({ success: false, error: "URLs must be an array" }, { status: 400 })
    }

    // For webpages, ensure we have at least one URL
    if (type === "webpages" && urls.length === 0) {
      console.error("[v0] No URLs provided for webpages deletion")
      return NextResponse.json({ success: false, error: "No URLs provided for webpages" }, { status: 400 })
    }

    // For PDF, ensure we have exactly one empty string in the array
    if (type === "pdf" && (urls.length !== 1 || urls[0] !== "")) {
      console.error("[v0] Invalid URLs for PDF deletion:", urls)
      return NextResponse.json({ success: false, error: "Invalid URLs for PDF" }, { status: 400 })
    }

    const result = await executeResourceDeletion(title, type, urls)

    if (!result.success) {
      console.error("[v0] Deletion workflow error:", result.error)
      return NextResponse.json(
        { success: false, error: result.error || "Failed to delete from Lamatic" },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("[v0] Error in delete-resource API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
