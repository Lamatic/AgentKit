"use server";

import { headers } from "next/headers";
import { parseFocusCsv, FocusParseError } from "../lib/parse-focus";
import { validateUploadSize, validateRowCount, UploadValidationError } from "../lib/validate-upload";
import {
  computeFootprintLines,
  buildHotspots,
  averageGridIntensity,
  providerMix,
} from "../lib/compute-emissions";
import { getLamaticClient, flowIdFor, isFlowConfigured } from "../lib/lamatic-client";
import { coercePlan, localHeuristicPlan } from "../lib/plan";
import { assembleReport } from "../lib/assemble";
import { consumeAnalyzeRequest, getClientIdentifier } from "../lib/rate-limit";
import type { Hotspot, Report } from "../lib/types";

export type AnalyzeResponse =
  | { ok: true; data: Report; mode: "flow" | "heuristic" }
  | { ok: false; error: string };

// The compact, identifier-free view of a hotspot the flow's LLM nodes reason
// over. subAccount is deliberately not included.
function forWire(h: Hotspot) {
  return {
    id: h.id,
    provider: h.provider,
    service: h.service,
    serviceCategory: h.serviceCategory,
    region: h.region,
    regionLabel: h.regionLabel,
    gridIntensity: h.gridIntensity,
    usageClass: h.usageClass,
    usageUnit: h.usageUnit,
    usageAmount: Math.round(h.usageAmount * 100) / 100,
    energyKwh: Math.round(h.energyKwh * 100) / 100,
    emissionsKg: Math.round(h.emissionsKg * 100) / 100,
    shareOfTotal: Math.round(h.shareOfTotal * 1000) / 1000,
    cleanerRegion: h.cleanerRegion
      ? {
          region: h.cleanerRegion.region,
          regionLabel: h.cleanerRegion.regionLabel,
          gridIntensity: h.cleanerRegion.gridIntensity,
          reductionPct: h.cleanerRegion.reductionPct,
          crossContinent: h.cleanerRegion.crossContinent,
        }
      : null,
  };
}

function unwrapPlan(raw: unknown): { diagnoses: unknown; recommendations: unknown } {
  const r = raw as Record<string, unknown> | null;
  if (r && (r.status === "error" || r.message)) {
    const detail = (r.message as string) ?? "unknown error";
    const code = r.statusCode ? ` (HTTP ${r.statusCode})` : "";
    throw new Error(`Lamatic rejected the request${code}: ${detail}`);
  }
  const payload = (r?.result as Record<string, unknown>) ?? r ?? {};
  return { diagnoses: payload.diagnoses, recommendations: payload.recommendations };
}

export async function analyze(input: {
  usageCsv: string;
  periodLabel: string;
}): Promise<AnalyzeResponse> {
  try {
    const headerList = await headers();
    const clientId = getClientIdentifier(headerList);
    const rate = consumeAnalyzeRequest(clientId);
    if (!rate.allowed) {
      return { ok: false, error: `Rate limit exceeded. Try again in ${rate.retryAfterSeconds}s.` };
    }

    validateUploadSize(Buffer.byteLength(input.usageCsv, "utf8"));

    const rows = parseFocusCsv(input.usageCsv);
    validateRowCount(rows.length);

    const lines = computeFootprintLines(rows);
    const { hotspots, totalEmissionsKg, totalEnergyKwh, unrankedEmissionsKg } = buildHotspots(lines);
    const currency = rows.find((r) => r.billingCurrency)?.billingCurrency ?? "USD";

    const totals = {
      totalEmissionsKg,
      totalEnergyKwh,
      averageGridIntensity: averageGridIntensity(lines),
      unrankedEmissionsKg,
      providerMix: providerMix(lines),
    };

    if (hotspots.length === 0) {
      return {
        ok: true,
        mode: isFlowConfigured() ? "flow" : "heuristic",
        data: assembleReport({
          hotspots: [],
          plan: { diagnoses: [], recommendations: [], flagsByHotspot: {} },
          totals,
          periodLabel: input.periodLabel,
          currency,
        }),
      };
    }

    // Judgment: the Lamatic flow if configured, else the deterministic fallback.
    let plan;
    let mode: "flow" | "heuristic";
    if (isFlowConfigured()) {
      const client = getLamaticClient();
      const raw = await client.executeFlow(flowIdFor("step1"), {
        hotspots: hotspots.map((h) => JSON.stringify(forWire(h))),
        periodLabel: input.periodLabel,
        currency,
      });
      const { diagnoses, recommendations } = unwrapPlan(raw);
      plan = coercePlan(diagnoses, recommendations, hotspots);
      mode = "flow";
    } else {
      plan = localHeuristicPlan(hotspots);
      mode = "heuristic";
    }

    const data = assembleReport({ hotspots, plan, totals, periodLabel: input.periodLabel, currency });
    return { ok: true, data, mode };
  } catch (e: unknown) {
    if (e instanceof UploadValidationError || e instanceof FocusParseError) {
      return { ok: false, error: e.message };
    }
    let message = e instanceof Error ? e.message : "Analysis failed.";
    if (message.includes("fetch failed")) {
      message = "Could not reach Lamatic. Check LAMATIC_API_URL and your network connection.";
    } else if (message.includes("HTTP 403")) {
      message += " — check LAMATIC_API_KEY is an API key from Studio > Settings > API Keys, not the Project ID.";
    }
    return { ok: false, error: message };
  }
}
