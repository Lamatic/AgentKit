"use server";

import { getLamaticClient, unwrap, unwrapRecord, asArray } from "@/lib/lamatic-client";

const INDEX_FLOW_ID = process.env.INDEX_ARTICLES_FLOW_ID!;
const SYNTHESIZE_FLOW_ID = process.env.SYNTHESIZE_DIGEST_FLOW_ID!;

function formatLamaticNetworkError(label: string, err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/EXECUTE_SOFT_TIMEOUT/i.test(msg)) {
    console.error(`[point-proven] ${label} soft timeout:`, msg);
    return new Error(
      `${label}: the flow did not respond in time. Check that it is deployed and Vector DB is configured.`
    );
  }
  if (/fetch failed|ECONNRESET|ETIMEDOUT|socket hang up|UND_ERR/i.test(msg)) {
    console.error(`[point-proven] ${label} connection error:`, msg);
    return new Error(
      `${label}: connection dropped while waiting. Check that the flow is deployed and Vector DB is configured, then retry.`
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

  return fromResult ?? (fromRoot && looksLikeFinalPayload(fromRoot) ? fromRoot : null);
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
    console.info(`[point-proven] ${label} start (${flowHint})`, {
      keys: Object.keys(payload),
    });
    const client = getLamaticClient();
    // Fail fast if Lamatic is still on realtime (holds HTTP open until scrape finishes).
    let softTimeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let res: LamaticRes;
    try {
      res = (await Promise.race([
        client.executeFlow(flowId, payload),
        new Promise<never>((_, reject) => {
          softTimeoutHandle = setTimeout(
            () => reject(new Error("EXECUTE_SOFT_TIMEOUT")),
            55_000
          );
        }),
      ])) as LamaticRes;
    } finally {
      if (softTimeoutHandle !== undefined) clearTimeout(softTimeoutHandle);
    }

    const isTimeout =
      res?.statusCode === 504 ||
      /timed?\s*out|timeout/i.test(res?.message ?? "");

    if (res?.status === "error" || (!res?.result && res?.message)) {
      console.error(`[point-proven] ${label} execute error:`, {
        status: res?.status,
        statusCode: res?.statusCode,
        message: res?.message,
        kind: classifyLamaticMessage(res?.message),
      });
      if (isTimeout) {
        throw new Error(
          `${label} timed out. Check that the flow is deployed with async response mode, then retry.`
        );
      }
      const kind = classifyLamaticMessage(res?.message);
      if (kind === "vectorize_got_string") {
        throw new Error(
          `${label} failed: Vectorize expected string[] but received a string. Check flow deployment and Vector DB configuration.`
        );
      }
      if (kind === "vectordb_empty") {
        throw new Error(
          `${label} failed: Vector DB received empty vectors/metadata. Check flow deployment and Vector DB configuration.`
        );
      }
      if (/reading ['"]?output['"]?/i.test(res?.message ?? "")) {
        throw new Error(
          `${label} failed: a code node referenced an undefined output. Check that your flow nodes are properly wired and deployed, then retry.`
        );
      }
      throw new Error(
        `${label} failed. Check that the flow is deployed and environment flow IDs match Studio.`
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
      console.info(`[point-proven] ${label} polling requestId=${requestId}`);
      res = (await client.checkStatus(requestId, 2, pollTimeout)) as LamaticRes;
      payloadOut = extractPayloadFromResponse(res);
    }

    if (res?.status === "error") {
      console.error(`[point-proven] ${label} poll error:`, {
        status: res?.status,
        statusCode: res?.statusCode,
        message: res?.message,
        kind: classifyLamaticMessage(res?.message),
      });
      if (
        res?.statusCode === 504 ||
        res?.statusCode === 408 ||
        /timed?\s*out|timeout/i.test(res?.message ?? "")
      ) {
        throw new Error(
          `${label} timed out while waiting for results. Check Studio logs and retry.`
        );
      }
      const kind = classifyLamaticMessage(res?.message);
      if (kind === "vectorize_got_string") {
        throw new Error(
          `${label} failed: Vectorize expected string[] but received a string. Check flow deployment and Vector DB configuration.`
        );
      }
      if (kind === "vectordb_empty") {
        throw new Error(
          `${label} failed: Vector DB is empty because Vectorize produced no vectors. Check flow deployment and Vector DB configuration.`
        );
      }
      throw new Error(
        `${label} failed. Check that the flow is deployed and environment flow IDs match Studio.`
      );
    }

    if (!payloadOut) {
      const onlyAck =
        requestId &&
        res?.result &&
        typeof res.result === "object" &&
        Object.keys(res.result).length <= 2 &&
        ("requestId" in res.result || "request_id" in res.result);
      console.warn(`[point-proven] ${label} empty payload`, {
        status: res?.status,
        onlyAck: !!onlyAck,
        resultKeys:
          res?.result && typeof res.result === "object"
            ? Object.keys(res.result)
            : [],
      });
      throw new Error(
        onlyAck
          ? `${label}: received an async acknowledgement but no final result. Check that the synthesize flow is deployed with realtime response mode.`
          : `${label} returned no result. Check that the flow is deployed and its API Response mapping is configured.`
      );
    }

    return payloadOut;
  } catch (err) {
    throw formatLamaticNetworkError(label, err);
  }
}

function indexPayloadForUrl(url: string): Record<string, string> {
  // Kit flow reads {{triggerNode_1.output.urls}}. sampleInput kept for Studio graphs that still bind it.
  return { sampleInput: url, urls: url };
}

/** Index one article URL (one Lamatic API call — avoids sync 504 on multi-URL batch). */
export async function indexSingleArticle(
  url: string,
  options?: { deadlineMs?: number }
): Promise<IndexResult> {
  requireFlowIds();
  // UI validates shape; strip trailing / as a safety net for Firecrawl.
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed.startsWith("http")) {
    throw new Error("URL must start with http:// or https://");
  }

  const remainingMs =
    options?.deadlineMs != null
      ? options.deadlineMs - Date.now()
      : 270_000;
  if (remainingMs < 5_000) {
    throw new Error(
      "Indexing stopped: approached the serverless time limit."
    );
  }

  const pollTimeoutSec = Math.min(
    280,
    Math.max(5, Math.floor((remainingMs - 2_000) / 1000))
  );
  const raceMs = Math.max(1_000, remainingMs - 1_000);

  let raceTimer: ReturnType<typeof setTimeout> | undefined;
  let raw: Record<string, unknown>;
  try {
    raw = await Promise.race([
      runFlow(INDEX_FLOW_ID, indexPayloadForUrl(trimmed), "Index Articles", {
        pollTimeoutSec,
      }),
      new Promise<never>((_, reject) => {
        raceTimer = setTimeout(
          () =>
            reject(
              new Error(
                "Indexing stopped: approached the serverless time limit."
              )
            ),
          raceMs
        );
      }),
    ]);
  } finally {
    if (raceTimer !== undefined) clearTimeout(raceTimer);
  }

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

function isSourceItem(value: unknown): value is SourceItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "number" &&
    typeof v.domain === "string" &&
    typeof v.title === "string" &&
    typeof v.url === "string"
  );
}

function isSourcesBlock(
  value: unknown
): value is { type: "sources"; items: SourceItem[] } {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.type === "sources" &&
    Array.isArray(v.items) &&
    v.items.every(isSourceItem)
  );
}

function isBriefEntry(
  value: unknown
): value is string | { type: "sources"; items: SourceItem[] } {
  return typeof value === "string" || isSourcesBlock(value);
}

function isArticleSummary(value: unknown): value is ArticleSummary {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.source_id === "number" &&
    typeof v.title === "string" &&
    typeof v.url === "string" &&
    typeof v.summary === "string" &&
    (v.relevance === "high" ||
      v.relevance === "medium" ||
      v.relevance === "low")
  );
}

function isContradiction(value: unknown): value is Contradiction {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.topic === "string" &&
    typeof v.claim_a === "string" &&
    typeof v.source_a_host === "string" &&
    typeof v.claim_b === "string" &&
    typeof v.source_b_host === "string"
  );
}

function isConsensusPoint(value: unknown): value is ConsensusPoint {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.point === "string" &&
    Array.isArray(v.supporting_sources) &&
    v.supporting_sources.every((n) => typeof n === "number") &&
    Array.isArray(v.excerpts) &&
    v.excerpts.every((e) => typeof e === "string")
  );
}

function isDigestWarning(value: unknown): value is DigestWarning {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.type === "string";
}

function filterArray<T>(value: unknown, guard: (v: unknown) => v is T): T[] {
  return asArray(value).filter(guard);
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
  // API Response often maps missing fields as "" instead of [] — coerce and validate elements.
  return JSON.parse(
    JSON.stringify({
      query: String(parsed.query ?? query),
      executive_brief: filterArray(parsed.executive_brief, isBriefEntry),
      article_summaries: filterArray(parsed.article_summaries, isArticleSummary),
      cross_cutting_themes: asArray(parsed.cross_cutting_themes).filter(
        (v): v is string => typeof v === "string"
      ),
      cross_source_contradictions: filterArray(
        parsed.cross_source_contradictions,
        isContradiction
      ),
      consensus_points: filterArray(parsed.consensus_points, isConsensusPoint),
      warnings: filterArray(parsed.warnings, isDigestWarning),
    })
  ) as DigestResult;
}
