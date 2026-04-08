import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    const cleanFilename = file.name
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/[^a-zA-Z0-9._-]/g, "") // Remove special characters except dots, underscores, and hyphens
      .toLowerCase()

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now()
    const finalFilename = `${timestamp}_${cleanFilename}`

    // Upload to Vercel Blob with public access
    const blob = await put(finalFilename, file, {
      access: "public",
      addRandomSuffix: false, // We're adding our own timestamp
    })

    console.log("[v0] Uploaded blob URL:", blob.url)

    return NextResponse.json({
      url: blob.url,
      filename: file.name, // Return original filename for display
      cleanFilename: finalFilename, // Return clean filename for reference
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
