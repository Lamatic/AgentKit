import { NextResponse } from "next/server";
import { z } from "zod";

import { MAX_DATABASE_BYTES, MAX_QUERY_CHARACTERS, runModeSchema } from "../../../lib/contracts";
import { checkLiveRateLimit, RateLimitConfigurationError } from "../../../lib/rate-limit";
import {
  InvalidRequestBodyError,
  readBoundedJsonBody,
  RequestBodyTooLargeError,
} from "../../../lib/request-body";
import { tuneQuery } from "../../../lib/tuner";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  query: z.string().min(1).max(MAX_QUERY_CHARACTERS),
  mode: runModeSchema.default("demo"),
  databaseBase64: z.string().max(Math.ceil(MAX_DATABASE_BYTES * 4 / 3) + 8).optional(),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await readBoundedJsonBody(request));
    if (input.mode === "live") {
      const rateLimit = await checkLiveRateLimit(request);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { status: "failed", conclusion: "Live mode rate limit reached. Try again shortly.", experiments: [] },
          { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
        );
      }
    }
    const databaseBytes = input.databaseBase64
      ? Uint8Array.from(Buffer.from(input.databaseBase64, "base64"))
      : undefined;
    if (databaseBytes && databaseBytes.byteLength > MAX_DATABASE_BYTES) {
      return NextResponse.json(
        { status: "invalid-input", conclusion: "SQLite uploads are limited to 4 MB.", experiments: [] },
        { status: 400 },
      );
    }
    if (databaseBytes) {
      const header = Buffer.from(databaseBytes.subarray(0, 16)).toString("utf8");
      if (header !== "SQLite format 3\u0000") {
        return NextResponse.json(
          { status: "invalid-input", conclusion: "The uploaded file is not a valid SQLite 3 database.", experiments: [] },
          { status: 400 },
        );
      }
    }
    const report = await tuneQuery(input.query, input.mode, databaseBytes, request.signal);
    const status = report.status === "invalid-input" ? 400 : report.status === "failed" ? 500 : 200;
    return NextResponse.json(report, { status });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { status: "invalid-input", conclusion: error.message, experiments: [] },
        { status: 413 },
      );
    }
    if (error instanceof InvalidRequestBodyError) {
      return NextResponse.json(
        { status: "invalid-input", conclusion: error.message, experiments: [] },
        { status: 400 },
      );
    }
    if (error instanceof RateLimitConfigurationError) {
      return NextResponse.json(
        { status: "failed", conclusion: error.message, experiments: [] },
        { status: 503 },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { status: "invalid-input", conclusion: error.issues[0]?.message ?? "Invalid request.", experiments: [] },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { status: "failed", conclusion: error instanceof Error ? error.message : "Tuning failed.", experiments: [] },
      { status: 500 },
    );
  }
}
