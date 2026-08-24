"use server";

import { z } from "zod";
import { lamatic, getFlowId } from "../lib/lamatic-client";
import kitConfig from "../../lamatic.config";
import type { Competitor, CompetitorInput, TrackResult } from "../lib/types";

// The step id in lamatic.config.ts (matches flows/<id>.ts).
const STEP_ID = "competitor-pricing-tracker";

// Guard against runaway requests exhausting flow quota / server capacity.
const MAX_COMPETITORS = 8;
// How many flows run at once (bounded concurrency pool).
const CONCURRENCY = 3;

// Resolve the step from the parent kit config so the action reads its own
// contract (id + envKey) rather than hardcoding it.
const step = kitConfig.steps.find((s: { id: string }) => s.id === STEP_ID);
if (!step) {
  throw new Error(`Step "${STEP_ID}" is not declared in lamatic.config.ts`);
}

// Full response contract — validates every scalar, plan object, and string
// array. A malformed field (e.g. features: "included") fails validation
// instead of being returned as a Competitor.
const PlanSchema = z.object({
  name: z.string(),
  price: z.string(),
  billingPeriod: z.string(),
  features: z.array(z.string()),
});

const CompetitorSchema = z.object({
  competitorName: z.string(),
  url: z.string(),
  currency: z.string(),
  plans: z.array(PlanSchema),
  notableFeatures: z.array(z.string()),
  freeTrial: z.string(),
  extractionNotes: z.string(),
});

/**
 * The flow returns { result: <Competitor> }. Depending on how the LLM node
 * serializes it, the value may be an object or a JSON string. Coerce loose
 * fields, then validate the whole shape with zod. Returns null on any
 * structural problem so the caller can retry.
 */
function parseResult(result: unknown): Competitor | null {
  if (!result) return null;

  let obj: unknown = result;
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;

  // Coerce common LLM shape drift (missing keys, null) into defaults before
  // strict validation, so only genuinely broken data is rejected.
  const raw = obj as Record<string, unknown>;
  const candidate = {
    competitorName: typeof raw.competitorName === "string" ? raw.competitorName : "",
    url: typeof raw.url === "string" ? raw.url : "",
    currency: typeof raw.currency === "string" ? raw.currency : "",
    plans: Array.isArray(raw.plans)
      ? raw.plans.map((p) => {
          const plan = (p ?? {}) as Record<string, unknown>;
          return {
            name: typeof plan.name === "string" ? plan.name : "",
            price: typeof plan.price === "string" ? plan.price : "",
            billingPeriod:
              typeof plan.billingPeriod === "string" ? plan.billingPeriod : "",
            features: Array.isArray(plan.features)
              ? plan.features.filter((f): f is string => typeof f === "string")
              : [],
          };
        })
      : [],
    notableFeatures: Array.isArray(raw.notableFeatures)
      ? raw.notableFeatures.filter((f): f is string => typeof f === "string")
      : [],
    freeTrial: typeof raw.freeTrial === "string" ? raw.freeTrial : "",
    extractionNotes:
      typeof raw.extractionNotes === "string" ? raw.extractionNotes : "",
  };

  const parsed = CompetitorSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Track a single competitor. Calls the deployed Lamatic flow.
 * Retries once if the scrape came back empty (plans === []), since the
 * upstream scraper can occasionally return an empty page on the first hit.
 */
async function trackOne(input: CompetitorInput): Promise<TrackResult> {
  const flowId = getFlowId(STEP_ID);
  const payload = { competitorName: input.competitorName, url: input.url };

  const attempts = 2;
  let lastError = "Unknown error";

  for (let i = 0; i < attempts; i++) {
    try {
      const response = await lamatic.executeFlow(flowId, payload);

      if (response.status !== "success") {
        lastError = response.message ?? "Flow returned an error status.";
        continue;
      }

      const raw =
        (response.result as { result?: unknown })?.result ?? response.result;
      const competitor = parseResult(raw);

      if (!competitor) {
        lastError = "Could not parse the flow response.";
        continue;
      }

      // Empty scrape — retry once before giving up.
      if (competitor.plans.length === 0 && i < attempts - 1) {
        continue;
      }

      return { ok: true, competitor, input };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Request failed.";
    }
  }

  return { ok: false, error: lastError, input };
}

/**
 * Run tasks with a bounded concurrency pool so we never launch more than
 * CONCURRENCY flows at once, preserving input order in the results.
 */
async function runPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function next(): Promise<void> {
    const index = cursor++;
    if (index >= items.length) return;
    results[index] = await worker(items[index]);
    await next();
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, next);
  await Promise.all(runners);
  return results;
}

/**
 * Track several competitors with bounded concurrency. Each returns
 * independently, so one failed scrape doesn't sink the whole comparison.
 */
export async function trackCompetitors(
  inputs: CompetitorInput[]
): Promise<TrackResult[]> {
  const cleaned = inputs
    .map((i) => ({
      competitorName: i.competitorName.trim(),
      url: i.url.trim(),
    }))
    .filter((i) => i.url.length > 0)
    .slice(0, MAX_COMPETITORS);

  if (cleaned.length === 0) return [];

  return runPool(cleaned, CONCURRENCY, trackOne);
}