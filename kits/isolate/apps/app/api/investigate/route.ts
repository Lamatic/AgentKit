import { NextResponse } from "next/server";
import { z } from "zod";

import { investigateIssue } from "../../../lib/investigate";
import {
  InvalidInvestigationRequestError,
  publicInvestigationError,
} from "../../../lib/http-errors";
import { acquireInvestigationSlot } from "../../../lib/concurrency";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  issueUrl: z.string().url().max(500),
  ref: z.string().trim().min(1).max(255).optional(),
});

/**
 * Run one investigation for a submitted public GitHub issue URL.
 *
 * Requests are validated, bounded by a concurrency slot, and answered with a
 * sanitised error when anything fails.
 */
export async function POST(request: Request) {
  const release = acquireInvestigationSlot();
  if (!release) {
    return NextResponse.json(
      { error: "Too many investigations are already running. Try again shortly." },
      { status: 429, headers: { "Retry-After": "30" } },
    );
  }
  try {
    let input: z.infer<typeof requestSchema>;
    try {
      input = requestSchema.parse(await request.json());
    } catch {
      throw new InvalidInvestigationRequestError();
    }
    return NextResponse.json(await investigateIssue(input));
  } catch (error) {
    const publicError = publicInvestigationError(error);
    if (publicError.status === 500) console.error("Isolate investigation failed", error);
    return NextResponse.json(
      { error: publicError.message },
      { status: publicError.status },
    );
  } finally {
    release();
  }
}
