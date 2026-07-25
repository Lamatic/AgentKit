import { NextResponse } from "next/server";
import { z } from "zod";

import { investigateIssue } from "../../../lib/investigate";
import { publicInvestigationError } from "../../../lib/http-errors";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  issueUrl: z.string().url().max(500),
  ref: z.string().trim().min(1).max(255).optional(),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    return NextResponse.json(await investigateIssue(input));
  } catch (error) {
    const publicError = publicInvestigationError(error);
    if (publicError.status === 500) console.error("Isolate investigation failed", error);
    return NextResponse.json(
      { error: publicError.message },
      { status: publicError.status },
    );
  }
}
