import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getLamaticClient } from "@/lib/lamatic-client";
import { assertFlowSuccess, type FlowResponse } from "@/lib/pipeline";
import { PdfValidationError, safeBlobName, validatePdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const flowId = process.env.DOC_PARSE_PDF_FLOW;
  if (!flowId || !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "PDF upload is not configured. Set DOC_PARSE_PDF_FLOW and BLOB_READ_WRITE_TOKEN to enable it.",
      },
      { status: 501 },
    );
  }

  let file: File;
  try {
    const formData = await request.formData();
    const candidate = formData.get("file");
    if (!(candidate instanceof File)) {
      return NextResponse.json({ error: "No PDF file was provided." }, { status: 400 });
    }
    file = candidate;

    const bytes = new Uint8Array(await file.arrayBuffer());
    validatePdf({ name: file.name, type: file.type, size: file.size, bytes });
  } catch (error) {
    if (error instanceof PdfValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  // Upload to short-lived public storage, parse, and always clean up the blob.
  let blobUrl: string | null = null;
  try {
    const blob = await put(safeBlobName(file.name), file, {
      access: "public",
      addRandomSuffix: false,
    });
    blobUrl = blob.url;

    const response = (await getLamaticClient().executeFlow(flowId, {
      fileUrl: blob.url,
    })) as FlowResponse;
    const result = assertFlowSuccess(response, "Parse PDF");

    const text = typeof result.text === "string" ? result.text : "";
    if (!text.trim()) {
      return NextResponse.json(
        {
          error:
            "No extractable text found. This looks like a scanned or image-only PDF — those need OCR and are out of scope. Paste the text instead.",
        },
        { status: 422 },
      );
    }

    const pageCount =
      typeof result.page_count === "number" ? result.page_count : undefined;
    return NextResponse.json({ text, pageCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse the PDF.";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    if (blobUrl) {
      // Best-effort cleanup — never let deletion failures mask the response.
      await del(blobUrl).catch(() => undefined);
    }
  }
}
