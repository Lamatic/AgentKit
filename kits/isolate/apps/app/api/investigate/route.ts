import { NextResponse } from "next/server";
import { z } from "zod";

import { investigateIssue } from "../../../lib/investigate";
import { allowInvestigationRequest } from "../../../lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  issueUrl: z.string().url().max(500),
  ref: z.string().trim().min(1).max(255).optional(),
});

export async function POST(request: Request) {
  const client =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  const rateLimit = allowInvestigationRequest(client);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many investigations. Try again after the current window." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }
  try {
    const input = requestSchema.parse(await request.json());
    return NextResponse.json(await investigateIssue(input));
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Enter a valid public GitHub issue URL and repository ref."
        : error instanceof Error
          ? error.message
          : "The investigation could not be completed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
