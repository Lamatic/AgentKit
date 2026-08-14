"use server";

import { headers } from "next/headers";
import { parseBillingCsv, BillingParseError } from "../lib/parse-billing";
import { validateUploadSize, validateRowCount, UploadValidationError } from "../lib/validate-upload";
import { detectAnomalies } from "../lib/detect-anomalies";
import { getLamaticClient, flowIdFor } from "../lib/lamatic-client";
import { consumeAnalyzeRequest, getClientIdentifier } from "../lib/rate-limit";
import type { AnomalyEpisode, ChangeEvent, Report } from "../lib/types";

export type AnalyzeResponse = { ok: true; data: Report } | { ok: false; error: string };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function stripForWire(anomaly: AnomalyEpisode): Omit<AnomalyEpisode, "hourlySeries"> {
  const { hourlySeries, ...rest } = anomaly;
  return {
    ...rest,
    currentCost: round2(anomaly.currentCost),
    baselineCost: round2(anomaly.baselineCost),
    deltaAbs: round2(anomaly.deltaAbs),
    deltaPct: round2(anomaly.deltaPct),
    shareOfTotalDelta: round2(anomaly.shareOfTotalDelta),
    robustZ: round2(anomaly.robustZ),
    quantityDeltaPct: round2(anomaly.quantityDeltaPct),
  };
}

function unwrap(raw: any): Report {
  if (raw?.status === "error" || raw?.message) {
    const detail = raw.message ?? "unknown error";
    const code = raw.statusCode ? ` (HTTP ${raw.statusCode})` : "";
    throw new Error(`Lamatic rejected the request${code}: ${detail}`);
  }
  const payload = raw?.result ?? raw;
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.anomalies)) {
    throw new Error("The flow returned an unexpected shape — no `anomalies` array was present in the response.");
  }
  return payload as Report;
}

export async function analyze(input: {
  billingCsv: string;
  changeEventsJson: string;
  periodLabel: string;
}): Promise<AnalyzeResponse> {
  try {
    const headerList = await headers();
    const clientId = getClientIdentifier(headerList);
    const rate = consumeAnalyzeRequest(clientId);
    if (!rate.allowed) {
      return { ok: false, error: `Rate limit exceeded. Try again in ${rate.retryAfterSeconds}s.` };
    }

    validateUploadSize(Buffer.byteLength(input.billingCsv, "utf8"));
    validateUploadSize(Buffer.byteLength(input.changeEventsJson, "utf8"));

    const rows = parseBillingCsv(input.billingCsv);
    validateRowCount(rows.length);

    let changeEvents: ChangeEvent[];
    try {
      changeEvents = JSON.parse(input.changeEventsJson);
    } catch {
      throw new Error("Change events file is not valid JSON.");
    }
    if (!Array.isArray(changeEvents)) {
      throw new Error("Change events file must be a JSON array.");
    }
    validateRowCount(changeEvents.length);

    const anomalies = detectAnomalies(rows);
    if (anomalies.length === 0) {
      return {
        ok: true,
        data: {
          periodLabel: input.periodLabel,
          currency: rows[0]?.BillingCurrency ?? "USD",
          totalCurrent: 0,
          totalBaseline: 0,
          totalDeltaAbs: 0,
          totalDeltaPct: 0,
          anomalies: [],
          totalEstimatedSavings: 0,
          unattributedCount: 0,
          execSummary: "No anomalies above the significance floor were found in this period.",
        },
      };
    }

    const seriesById = new Map(anomalies.map((a) => [a.id, a.hourlySeries]));

    const client = getLamaticClient();
    const raw = await client.executeFlow(flowIdFor("step1"), {
      anomalies: anomalies.map((a) => JSON.stringify(stripForWire(a))),
      changeEvents: changeEvents.map((e) => JSON.stringify(e)),
      periodLabel: input.periodLabel,
      currency: rows[0]?.BillingCurrency ?? "USD",
    });

    const data = unwrap(raw);
    data.anomalies = data.anomalies.map((a) => ({
      ...a,
      hourlySeries: seriesById.get(a.id) ?? a.hourlySeries,
    }));

    return { ok: true, data };
  } catch (e: any) {
    if (e instanceof UploadValidationError || e instanceof BillingParseError) {
      return { ok: false, error: e.message };
    }
    let message = e?.message ?? "Analysis failed.";
    if (typeof message === "string" && message.includes("fetch failed")) {
      message = "Could not reach Lamatic. Check LAMATIC_API_URL and your network connection.";
    } else if (typeof message === "string" && message.includes("HTTP 403")) {
      message += " — check LAMATIC_API_KEY is an API key from Studio > Settings > API Keys, not the Project ID.";
    }
    return { ok: false, error: message };
  }
}
