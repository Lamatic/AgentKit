import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { executePDFDeletion } from "@/actions/orchestrate"

export async function POST(request: NextRequest) {
  try {
    const { title, blobUrl } = await request.json()

    console.log("[v0] Delete API received:", { title, blobUrl })

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const result = await executePDFDeletion(title)

    console.log("[v0] PDF deletion result:", result)

    if (!result.success) {
      console.error("[v0] Failed to delete from Lamatic:", result.error)
      return NextResponse.json(
        { success: false, error: result.error || "Failed to delete from Lamatic" },
        { status: 500 },
      )
    }

    // Delete from Blob storage if URL provided
    if (blobUrl) {
      try {
        await del(blobUrl)
        console.log("[v0] Blob deleted successfully:", blobUrl)
      } catch (error) {
        console.error("[v0] Failed to delete from Blob storage:", error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete document" },
      { status: 500 },
    )
  }
}
