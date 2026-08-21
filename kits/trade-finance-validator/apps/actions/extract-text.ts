"use server";

export async function extractDocumentText(
  fileBase64: string,
  mimeType: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const buffer = Buffer.from(fileBase64, "base64");

    if (mimeType === "application/pdf") {
      const { PDFParse } = await import("pdf-parse");
      const data = new Uint8Array(buffer);
      const parser = new PDFParse({ data });
      const result = await parser.getText();
      await parser.destroy();
      return { success: true, text: result.text };
    }

    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return { success: true, text: result.value };
    }

    return { success: false, error: `Unsupported file type: ${mimeType}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: `Failed to extract text: ${message}` };
  }
}
