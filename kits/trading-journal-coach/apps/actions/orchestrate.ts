"use server";

import { computeMetrics, type Trade } from "@/lib/metrics";
import type { Analysis } from "@/lib/types";
import { config, isConfigured, type FlowKey } from "../orchestrate";
import { getLamaticClient } from "@/lib/lamatic-client";

// Long flows run async: executeFlow returns a requestId, then we poll checkStatus for the result.
async function runFlow(flow: FlowKey, payload: Record<string, any>): Promise<any> {
  const client: any = getLamaticClient();
  const res: any = await client.executeFlow(config.flows[flow].workflowId, payload);
  const requestId =
    res?.result?.requestId ?? res?.requestId ?? res?.data?.requestId ?? res?.result?.result?.requestId;
  if (requestId && typeof client.checkStatus === "function") {
    return await client.checkStatus(requestId, 3, 180); // poll every 3s, up to 3 minutes
  }
  return res;
}

// The completed response is a full execution trace. Each LLM node exposes its text as `generatedResponse`.
// Collect them all, wherever they are nested, and let the caller classify them.
function collectGenerated(obj: any, acc: string[] = [], depth = 0): string[] {
  if (!obj || depth > 9 || typeof obj !== "object") return acc;
  if (typeof (obj as any).generatedResponse === "string") acc.push((obj as any).generatedResponse);
  for (const v of Object.values(obj)) collectGenerated(v, acc, depth + 1);
  return acc;
}

function tryParse(s: any): any {
  if (typeof s !== "string") return s;
  const t = s.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
  try { return JSON.parse(t); } catch { return null; }
}

function blankCoaching() {
  return { disciplineScore: 0, scoreRationale: "", headline: "", findings: [], topPriority: "", encouragement: "" };
}

// Surface flow-level errors (e.g. the model's rate limit) instead of a generic "not found".
function findError(raw: any): string | null {
  const msg = raw && typeof raw.message === "string" ? raw.message : "";
  const isErr = raw && (raw.status === "error" || (typeof raw.statusCode === "number" && raw.statusCode >= 400));
  if (isErr && /quota|rate.?limit|429/i.test(msg))
    return "Gemini rate limit reached (free tier). Wait ~a minute and try again, or raise your Google AI quota.";
  if (isErr && msg) return msg.slice(0, 220);
  return null;
}

/**
 * Run analyze-journal. Metrics are computed locally (deterministic, instant — same engine the flow uses),
 * and the AI pattern/coaching JSON is pulled from the deployed flow's response. Falls back to a local preview.
 */
export async function analyzeJournal(
  trades: Trade[],
): Promise<{ ok: boolean; analysis?: Analysis; error?: string }> {
  try {
    const metrics = computeMetrics(trades) as any;
    const status = metrics.insufficientData ? "insufficient_data" : "ok";
    const message = metrics.insufficientData
      ? `Need about 20 trades (~one month) for honest coaching — you have ${metrics.tradeCount}.`
      : undefined;

    if (isConfigured("analyze-journal") && status === "ok") {
      const raw = await runFlow("analyze-journal", { trades: JSON.stringify(trades) });
      const flowErr = findError(raw);
      if (flowErr) throw new Error(flowErr);
      let patterns: any[] = [];
      let coaching: any = null;
      for (const g of collectGenerated(raw)) {
        const p = tryParse(g);
        if (Array.isArray(p)) patterns = p;
        else if (p && typeof p === "object" && p.disciplineScore != null) coaching = p;
      }
      if (!coaching) {
        try { console.log("[analyze-journal] no coaching in trace. gens:", collectGenerated(raw).length, "| top keys:", Object.keys(raw ?? {})); } catch {}
        throw new Error("Flow ran but the coaching wasn't found in the response.");
      }
      return { ok: true, analysis: { status, message, metrics, patterns, coaching } };
    }

    // Local preview (flows not connected, or not enough data): real metrics, AI parts left blank.
    return {
      ok: true,
      analysis: {
        status,
        message,
        metrics,
        patterns: [],
        coaching: { ...blankCoaching(), headline: "Connect your Lamatic flows to unlock AI pattern detection and coaching." },
        mock: !isConfigured("analyze-journal"),
      },
    };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}

/** Ask a question about the analyzed journal. Deployed chat flow when configured; otherwise a grounded local answer. */
export async function chatWithJournal(
  question: string,
  analysis: Analysis,
): Promise<{ ok: boolean; answer?: string; error?: string }> {
  try {
    if (isConfigured("chat-with-journal")) {
      const raw = await runFlow("chat-with-journal", { question, analysis: JSON.stringify(analysis) });
      const gens = collectGenerated(raw);
      return { ok: true, answer: gens[gens.length - 1] || "No answer returned." };
    }
    return { ok: true, answer: localAnswer(question, analysis) };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}

function friendly(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Unknown error occurred";
  if (msg.includes("fetch failed")) return "Network error reaching Lamatic. Check your connection and flow IDs.";
  if (msg.toLowerCase().includes("api key") || msg.includes("401") || msg.includes("403"))
    return "Authentication error. Check LAMATIC_API_KEY in .env.local.";
  return msg;
}

// Grounded fallback so chat works before the chat flow is connected.
function localAnswer(question: string, a: Analysis): string {
  const s: any = a?.metrics?.signals || {};
  const q = question.toLowerCase();
  const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
  const pre = "(Preview — connect chat-with-journal for full answers.) ";
  if (q.includes("revenge") || q.includes("chase")) {
    return pre + `You took ${s.revenge?.episodes ?? 0} trades after a loss the same day; they cost ${inr(s.revenge?.pnlOnRevengeTrades ?? 0)}. Your rule: after a loss, stop for the day.`;
  }
  if (q.includes("size") || q.includes("lot")) {
    const b = s.sizingBenchmark;
    return pre + (b ? `Your average loss ${inr(b.avgActualLoss)} is ${b.avgLossVsBudget1pct}x the ₹500 (1%) risk budget on ₹50,000. Target risk ≤ ₹500/trade, reward ₹1,500 (1:3).` : "No sizing data yet.");
  }
  if (q.includes("worst") || q.includes("habit") || q.includes("improv")) {
    return pre + `The extra trades beyond your first each day cost ${inr(s.oneTradePerDay?.pnlOnExtraTrades ?? 0)} across ${s.oneTradePerDay?.daysWithMultipleTrades ?? 0} days. Trading once a day is your biggest lever.`;
  }
  return pre + `Net ${inr(a.metrics.performance.netPnl)} over ${a.metrics.tradeCount} trades, win rate ${(a.metrics.performance.winRate * 100).toFixed(0)}%. Ask me about revenge trades, sizing, or your one-trade-a-day rule.`;
}
