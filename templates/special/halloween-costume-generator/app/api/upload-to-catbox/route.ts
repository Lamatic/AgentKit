import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { base64Data } = await request.json()

    if (!base64Data) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    // Remove data URL prefix if present
    const base64WithoutPrefix = base64Data.split(",")[1] || base64Data
    const buffer = Buffer.from(base64WithoutPrefix, "base64")

    // Create form data for catbox.moe upload
    const formData = new FormData()
    const blob = new Blob([buffer], { type: "image/png" })
    formData.append("reqtype", "fileupload")
    formData.append("time", "12h")
    formData.append("fileToUpload", blob, "halloween-costume.png")

    console.log("[v0] Uploading to catbox.moe...")

    const response = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      console.error("[v0] Upload response status:", response.status)
      const errorText = await response.text()
      console.error("[v0] Upload error response:", errorText)
      return NextResponse.json({ error: `Upload failed with status ${response.status}` }, { status: 500 })
    }

    const imageUrl = await response.text()
    const trimmedUrl = imageUrl.trim()

    console.log("[v0] Upload successful:", trimmedUrl)

    return NextResponse.json(
      { url: trimmedUrl },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
