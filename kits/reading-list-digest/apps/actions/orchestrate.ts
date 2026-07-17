"use server";

import { getLamaticClient, unwrap, unwrapRecord } from "@/lib/lamatic-client";

const INDEX_FLOW_ID = process.env.INDEX_ARTICLES_FLOW_ID!;
const SYNTHESIZE_FLOW_ID = process.env.SYNTHESIZE_DIGEST_FLOW_ID!;

function formatLamaticNetworkError(label: string, err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/EXECUTE_SOFT_TIMEOUT/i.test(msg)) {
    return new Error(
      `${label}: Lamatic did not return within 55s (realtime wait). ` +
        `Set index-article → API Request → Response Type = async, then Deploy. ` +
        `Also fix CodeNode204 so Vectorize gets string[] (not a string), or VectorDB stays empty.`
    );
  }
  if (/fetch failed|ECONNRESET|ETIMEDOUT|socket hang up|UND_ERR/i.test(msg)) {
    return new Error(
      `${label}: connection dropped while waiting ("${msg}"). ` +
        `Often the server action hits the 300s Hobby/local maxDuration while Lamatic is still on realtime. ` +
        `Set API Request → async + Deploy. ` +
        `If Studio Logs show Vectorize "array of strings…found string", fix CodeNode204 (output = string[]) before retrying.`
    );
  }
  return err instanceof Error ? err : new Error(msg);
}

function extractRequestId(result: Record<string, unknown> | null | undefined): string | null {
  if (!result || typeof result !== "object") return null;
  const direct = result.requestId ?? result.request_id;
  if (direct != null && String(direct).length > 0 && String(direct) !== "studio") {
    return String(direct);
  }
  const nested = result.data;
  if (nested && typeof nested === "object") {
    const id = (nested as Record<string, unknown>).requestId;
    if (id != null && String(id).length > 0) return String(id);
  }
  return null;
}

function looksLikeFinalPayload(result: Record<string, unknown>): boolean {
  return (
    result.indexed_count != null ||
    result.executive_brief != null ||
    Array.isArray(result.article_summaries) ||
    result.query != null
  );
}

/** Normalize Lamatic executeFlow / checkStatus payloads into a plain object. */
function coerceFlowResult(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const stripped = raw.replace(/^\$/, "").trim();
    if (!stripped) return null;
    try {
      const parsed = JSON.parse(stripped);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  // Some deployments nest the API Response under data / output.
  if (
    !looksLikeFinalPayload(obj) &&
    obj.data &&
    typeof obj.data === "object" &&
    !Array.isArray(obj.data)
  ) {
    const nested = obj.data as Record<string, unknown>;
    if (looksLikeFinalPayload(nested)) return nested;
  }
  if (
    !looksLikeFinalPayload(obj) &&
    obj.output &&
    typeof obj.output === "object" &&
    !Array.isArray(obj.output)
  ) {
    const nested = obj.output as Record<string, unknown>;
    if (looksLikeFinalPayload(nested)) return nested;
  }
  return obj;
}

export type IndexResult = {
  indexed_count: number;
  collection: string;
  errors: unknown[];
  failed_urls?: string[];
};

export type SourceItem = {
  id: number;
  domain: string;
  title: string;
  url: string;
};

export type ArticleSummary = {
  source_id: number;
  title: string;
  url: string;
  summary: string;
  relevance: "high" | "medium" | "low";
};

export type Contradiction = {
  topic: string;
  claim_a: string;
  source_a_host: string;
  claim_b: string;
  source_b_host: string;
  note?: string;
};

export type ConsensusPoint = {
  point: string;
  supporting_sources: number[];
  excerpts: string[];
};

export type DigestWarning = {
  type: string;
  raw?: string;
  context?: string;
  message?: string;
};

export type DigestResult = {
  query: string;
  executive_brief: Array<string | { type: "sources"; items: SourceItem[] }>;
  article_summaries: ArticleSummary[];
  cross_cutting_themes: string[];
  cross_source_contradictions: Contradiction[];
  consensus_points: ConsensusPoint[];
  warnings: DigestWarning[];
};

type LamaticRes = {
  status?: string;
  result?: Record<string, unknown> | null;
  message?: string;
  statusCode?: number;
};

function requireFlowIds() {
  if (!INDEX_FLOW_ID || !SYNTHESIZE_FLOW_ID) {
    throw new Error(
      "Flow IDs missing. Set INDEX_ARTICLES_FLOW_ID and SYNTHESIZE_DIGEST_FLOW_ID in apps/.env.local"
    );
  }
}

/** Pull digest/index fields from executeFlow or checkStatus (shapes vary). */
function extractPayloadFromResponse(
  res: LamaticRes | null | undefined
): Record<string, unknown> | null {
  if (!res) return null;

  const fromResult = coerceFlowResult(res.result);
  if (fromResult && looksLikeFinalPayload(fromResult)) return fromResult;

  // checkStatus sometimes puts API Response fields on the root, not under result.
  const rootObj = { ...(res as Record<string, unknown>) };
  delete rootObj.status;
  delete rootObj.message;
  delete rootObj.statusCode;
  delete rootObj.result;
  const fromRoot = coerceFlowResult(rootObj);
  if (fromRoot && looksLikeFinalPayload(fromRoot)) return fromRoot;

  // Nested: result.data / result.output already handled in coerceFlowResult;
  // also try res.data if present.
  if (res.result == null && "data" in (res as object)) {
    const data = (res as Record<string, unknown>).data;
    const fromData = coerceFlowResult(data);
    if (fromData && looksLikeFinalPayload(fromData)) return fromData;
  }

  return fromResult ?? (Object.keys(rootObj).length ? fromRoot : null);
}

/**
 * Execute a flow and resolve async runs (requestId) via checkStatus.
 * Index should be API Request "async" (long scrape). Synthesize should be
 * "realtime" (~10s) so Studio Logs show the digest JSON, not only requestId.
 * The app still polls when it receives a requestId-only ACK.
 */
function classifyLamaticMessage(message: string | undefined): string {
  const m = message ?? "";
  if (/array of strings.*string|found data of type - 'string'/i.test(m)) {
    return "vectorize_got_string";
  }
  if (/metadata or vectors is empty/i.test(m)) {
    return "vectordb_empty";
  }
  if (/fetch failed|ECONNRESET|ETIMEDOUT/i.test(m)) {
    return "network_drop";
  }
  return "other";
}

async function runFlow(
  flowId: string,
  payload: Record<string, unknown>,
  label: string,
  options?: { pollTimeoutSec?: number }
): Promise<Record<string, unknown>> {
  const pollTimeout = options?.pollTimeoutSec ?? 600;
  const flowHint = flowId ? `flow …${flowId.slice(-8)}` : "missing flow id";
  try {
    console.info(`[reading-list-digest] ${label} start (${flowHint})`, {
      keys: Object.keys(payload),
    });
    const client = getLamaticClient();
    // Fail fast if Lamatic is still on realtime (holds HTTP open until scrape finishes).
    let res = (await Promise.race([
      client.executeFlow(flowId, payload),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("EXECUTE_SOFT_TIMEOUT")),
          55_000
        );
      }),
    ])) as LamaticRes;

    const isTimeout =
      res?.statusCode === 504 ||
      /timed?\s*out|timeout/i.test(res?.message ?? "");

    if (res?.status === "error" || (!res?.result && res?.message)) {
      if (isTimeout) {
        throw new Error(
          `${label} timed out on Lamatic realtime/sync limit (${flowHint}). ` +
            `Set index-article API Request → Response Type = async, Deploy, retry. ` +
            `Check Studio Logs for a new API run (not requestId "studio").`
        );
      }
      const kind = classifyLamaticMessage(res?.message);
      if (kind === "vectorize_got_string") {
        throw new Error(
          `${label} failed: Vectorize got a string, needs string[]. ` +
            `In Studio CodeNode204: use {{chunkNode_….output.chunks}}, then output = array of pageContent strings (not return, not a single string). Deploy, retry.`
        );
      }
      if (kind === "vectordb_empty") {
        throw new Error(
          `${label} failed: VectorDB got empty vectors/metadata (Vectorize failed upstream). Fix CodeNode204 → Vectorize first, then Deploy.`
        );
      }
      throw new Error(
        `${label} failed (${flowHint}): ${res.message || "Unknown Lamatic error"}. ` +
          `Check apps/.env.local flow IDs match Studio, project is Deployed, and credentials.`
      );
    }

    // Async ACK: { requestId } only — poll until digest/index fields appear.
    let payloadOut = extractPayloadFromResponse(res);
    const requestId = extractRequestId(
      coerceFlowResult(res?.result) ??
        (res?.result as Record<string, unknown> | null) ??
        undefined
    );
    if (requestId && !payloadOut) {
      console.info(`[reading-list-digest] ${label} polling requestId=${requestId}`);
      res = (await client.checkStatus(requestId, 2, pollTimeout)) as LamaticRes;
      payloadOut = extractPayloadFromResponse(res);
    }

    if (res?.status === "error") {
      if (
        res?.statusCode === 504 ||
        res?.statusCode === 408 ||
        /timed?\s*out|timeout/i.test(res?.message ?? "")
      ) {
        throw new Error(
          `${label} timed out while polling (${flowHint}). ` +
            `Open Studio Logs for this requestId — the write may still complete. Refresh Data.`
        );
      }
      const kind = classifyLamaticMessage(res?.message);
      if (kind === "vectorize_got_string") {
        throw new Error(
          `${label} failed: Vectorize got a string, needs string[]. ` +
            `Fix Studio CodeNode204 → output = string[]; bind Vectorize to that array; Deploy.`
        );
      }
      if (kind === "vectordb_empty") {
        throw new Error(
          `${label} failed: VectorDB empty because Vectorize produced no vectors. Fix CodeNode204 first.`
        );
      }
      throw new Error(
        `${label} failed (${flowHint}): ${res.message || "Workflow execution error in Studio"}`
      );
    }

    if (!payloadOut) {
      const onlyAck =
        requestId &&
        res?.result &&
        typeof res.result === "object" &&
        Object.keys(res.result).length <= 2 &&
        ("requestId" in res.result || "request_id" in res.result);
      console.warn(`[reading-list-digest] ${label} empty payload`, {
        status: res?.status,
        onlyAck: !!onlyAck,
        resultKeys:
          res?.result && typeof res.result === "object"
            ? Object.keys(res.result)
            : [],
      });
      throw new Error(
        onlyAck
          ? `${label}: API returned only requestId (async ACK), and checkStatus had no digest (${flowHint}). ` +
              `In Studio → Synthesize Digest → API Request → set Response Type to realtime (not async), Deploy. ` +
              `Async is for Index Articles; Synthesize is short (~10s) and should return query/executive_brief in the same response.`
          : `${label} returned no result (${flowHint}, status=${res?.status ?? "unknown"}). ` +
              `Studio can still show green while API Response is empty. ` +
              `In Synthesize Code nodes: use output = {…} not return; map API Response to codeNode output fields; Deploy.`
      );
    }

    return payloadOut;
  } catch (err) {
    throw formatLamaticNetworkError(label, err);
  }
}

function indexPayloadForUrl(url: string): Record<string, string> {
  // Studio binds Firecrawl to sampleInput; urls kept for kit-aligned flows.
  return { sampleInput: url, urls: url };
}

/** Index one article URL (one Lamatic API call — avoids sync 504 on multi-URL batch). */
export async function indexSingleArticle(url: string): Promise<IndexResult> {
  requireFlowIds();
  // UI validates shape; strip trailing / as a safety net for Firecrawl.
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed.startsWith("http")) {
    throw new Error("URL must start with http:// or https://");
  }

  const raw = await runFlow(
    INDEX_FLOW_ID,
    indexPayloadForUrl(trimmed),
    "Index Articles",
    { pollTimeoutSec: 280 }
  );
  const parsed = unwrapRecord(raw);

  // Ensure Server Action returns plain JSON (avoids opaque RSC production errors).
  return JSON.parse(
    JSON.stringify({
      indexed_count: Number(parsed.indexed_count ?? 0),
      collection: String(parsed.collection ?? "configured"),
      errors: (unwrap(parsed.errors) as unknown[]) ?? [],
    })
  ) as IndexResult;
}

/** Index many URLs sequentially (one flow run per URL). */
export async function indexArticles(urls: string[]): Promise<IndexResult> {
  requireFlowIds();
  if (!urls.length) throw new Error("Add at least one article URL.");

  let totalIndexed = 0;
  const allErrors: unknown[] = [];
  const failedUrls: string[] = [];

  for (const url of urls) {
    try {
      const one = await indexSingleArticle(url);
      totalIndexed += one.indexed_count;
      if (one.errors?.length) allErrors.push(...one.errors);
    } catch (e) {
      failedUrls.push(url);
      allErrors.push({
        url,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (failedUrls.length === urls.length) {
    const first = allErrors[0];
    const msg =
      first && typeof first === "object" && first !== null && "message" in first
        ? String((first as { message: unknown }).message)
        : "All URLs failed to index.";
    throw new Error(msg);
  }

  return {
    indexed_count: totalIndexed,
    collection: "configured",
    errors: allErrors,
    failed_urls: failedUrls.length ? failedUrls : undefined,
  };
}

export async function synthesizeDigest(
  query: string,
  maxArticles = 5
): Promise<DigestResult> {
  requireFlowIds();
  if (!query.trim()) throw new Error("Enter a research query.");

  const raw = await runFlow(
    SYNTHESIZE_FLOW_ID,
    {
      query: query.trim(),
      // Lamatic API Request schemas treat fields as strings ("number" in Studio
      // schema JSON is still typed as string at the trigger boundary).
      max_articles: String(maxArticles),
    },
    "Synthesize Digest"
  );
  const parsed = unwrapRecord(raw);

  // Plain JSON only — Lamatic sometimes returns shapes that break RSC serialization in production.
  return JSON.parse(
    JSON.stringify({
      query: String(parsed.query ?? query),
      executive_brief:
        (unwrap(parsed.executive_brief) as DigestResult["executive_brief"]) ??
        [],
      article_summaries:
        (unwrap(parsed.article_summaries) as ArticleSummary[]) ?? [],
      cross_cutting_themes:
        (unwrap(parsed.cross_cutting_themes) as string[]) ?? [],
      cross_source_contradictions:
        (unwrap(parsed.cross_source_contradictions) as Contradiction[]) ?? [],
      consensus_points:
        (unwrap(parsed.consensus_points) as ConsensusPoint[]) ?? [],
      warnings: (unwrap(parsed.warnings) as DigestWarning[]) ?? [],
    })
  ) as DigestResult;
}
