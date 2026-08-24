"use server";

import { lamatic, getFlowId } from "../lib/lamatic-client";
import type { Competitor, CompetitorInput, TrackResult } from "../lib/types";

// The step id in lamatic.config.ts (matches flows/<id>.ts).
const STEP_ID = "competitor-pricing-tracker";

/**
 * The flow returns { result: <Competitor> }. Depending on how the LLM node
 * serializes it, `result` may already be an object or a JSON string.
 * Normalize both into a Competitor object.
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
  const c = obj as Partial<Competitor>;
  if (!c || typeof c !== "object" || !Array.isArray(c.plans)) return null;
  return {
    competitorName: c.competitorName ?? "",
    url: c.url ?? "",
    currency: c.currency ?? "",
    plans: c.plans ?? [],
    notableFeatures: c.notableFeatures ?? [],
    freeTrial: c.freeTrial ?? "",
    extractionNotes: c.extractionNotes ?? "",
  };
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

      // SDK returns { result }, and our flow wraps output as { result: {...} }.
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
 * Track several competitors in parallel. Each returns independently, so one
 * failed scrape doesn't sink the whole comparison.
 */
export async function trackCompetitors(
  inputs: CompetitorInput[]
): Promise<TrackResult[]> {
  const cleaned = inputs
    .map((i) => ({
      competitorName: i.competitorName.trim(),
      url: i.url.trim(),
    }))
    .filter((i) => i.url.length > 0);

  if (cleaned.length === 0) return [];

  return Promise.all(cleaned.map(trackOne));
}
