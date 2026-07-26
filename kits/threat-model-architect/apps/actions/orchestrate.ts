"use server";

import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { executeFlow } from "@/lib/lamatic-client";
import { runThreatModel } from "@/lib/pipeline";
import { createRateLimiter } from "@/lib/rate-limit";
import type { GenerateReportResponse, IntakeInput } from "@/lib/types";

const requestLimit = positiveInteger(process.env.THREAT_MODEL_RATE_LIMIT, 10);
const windowMs = positiveInteger(
  process.env.THREAT_MODEL_RATE_WINDOW_MS,
  10 * 60 * 1_000,
);
const limiter = createRateLimiter({ limit: requestLimit, windowMs });

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function matchesAccessToken(provided: string | undefined) {
  const expected = process.env.THREAT_MODEL_ACCESS_TOKEN;
  if (!expected) return true;
  if (!provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

async function clientKey() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown-client"
  );
}

export async function generateThreatModel(input: IntakeInput): Promise<GenerateReportResponse> {
  try {
    const rate = limiter.check(await clientKey());
    if (!rate.allowed) {
      return {
        status: "error",
        error: `Too many requests. Try again in ${Math.ceil(rate.retryAfterMs / 60_000)} minute(s).`,
      };
    }
    if (!matchesAccessToken(input.accessToken)) {
      return { status: "error", error: "The access token is invalid." };
    }
    return await runThreatModel(input, { execute: executeFlow });
  } catch (error) {
    console.error(
      "Threat-model generation failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "error", error: "Threat-model generation failed. Please try again." };
  }
}
