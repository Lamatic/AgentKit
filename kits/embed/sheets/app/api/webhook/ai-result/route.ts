import { type NextRequest, NextResponse } from "next/server"
import { addPendingResult } from "@/lib/pending-results"

export async function POST(request: NextRequest) {
  try {
    console.log("Webhook received AI result")

    const payload = await request.json()
    console.log("Webhook payload:", payload)

    const { value, metadata } = payload

    if (!metadata) {
      console.error("Missing metadata in webhook payload")
      return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 })
    }

    const { sheetId, columnId, rowId } = metadata

    if (!sheetId || !columnId || !rowId) {
      console.error("Missing required fields in webhook payload")
      return NextResponse.json({ error: "Missing required fields: sheetId, columnId, rowId" }, { status: 400 })
    }

    if (!value) {
      console.error("Missing value in webhook payload")
      return NextResponse.json({ error: "Missing value in result" }, { status: 400 })
    }

    console.log("AI result successfully parsed:", {
      sheetId,
      columnId,
      rowId,
      value,
    })

    addPendingResult({
      sheetId,
      columnId,
      rowId,
      value,
    })

    console.log("Result added to pending queue")

    return NextResponse.json({
      success: true,
      message: "Result received and queued for client",
      data: { sheetId, columnId, rowId },
    })
  } catch (error) {
    console.error("[v0] Error processing webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
