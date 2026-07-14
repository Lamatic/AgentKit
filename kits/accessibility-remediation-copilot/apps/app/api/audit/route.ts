import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auditRequestSchema, auditResultSchema } from "@/lib/audit-schema";
import { createLamaticClient } from "@/lib/lamatic-client";
import { fetchPublicPage, prepareHtmlEvidence } from "@/lib/safe-page-fetch";

export const runtime = "nodejs";
export const maxDuration = 60;

function findAuditPayload(value: unknown) {
  const candidates: unknown[] = [value];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    candidates.push(record.result, record.output, record.data);
    if (record.result && typeof record.result === "object") {
      const nested = record.result as Record<string, unknown>;
      candidates.push(nested.result, nested.output, nested.data);
    }
  }

  for (const candidate of candidates) {
    const parsed = auditResultSchema.safeParse(candidate);
    if (parsed.success) return parsed.data;
    if (typeof candidate === "string") {
      try {
        const parsedJson = auditResultSchema.safeParse(JSON.parse(candidate));
        if (parsedJson.success) return parsedJson.data;
      } catch {
        // Continue through possible response envelopes.
      }
    }
  }
  throw new Error("Lamatic returned an unexpected audit response.");
}

export async function POST(request: Request) {
  try {
    const input = auditRequestSchema.parse(await request.json());
    const page =
      input.mode === "url"
        ? await fetchPublicPage(input.url)
        : {
            url: input.url || "user-supplied-html",
            pageContent: prepareHtmlEvidence(input.pageContent),
          };

    const { client, flowId } = createLamaticClient();
    const response = await client.executeFlow(flowId, {
      url: page.url,
      pageContent: page.pageContent,
      framework: input.framework,
      targetLevel: input.targetLevel,
    });

    if (response.status === "error") {
      throw new Error(response.message || "Lamatic workflow execution failed.");
    }

    return NextResponse.json({ data: findAuditPayload(response) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Check the audit input and try again." },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "The audit could not be completed.";
    const safeMessage =
      message.includes("Missing server configuration")
        ? "AccessFix is not configured yet. Add the required Lamatic environment variables."
        : message.includes("API key") || message.includes("Unauthorized")
          ? "Lamatic authentication failed. Check the server configuration."
          : message;

    return NextResponse.json({ error: safeMessage }, { status: 502 });
  }
}
