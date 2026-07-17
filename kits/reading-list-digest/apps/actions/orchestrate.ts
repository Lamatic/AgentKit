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

function looksLikeFinalIndexResult(result: Record<string, unknown>): boolean {
  return (
    result.indexed_count != null ||
    result.executive_brief != null ||
    Array.isArray(result.article_summaries)
  );
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

/**
 * Execute a flow and resolve async runs (requestId) via checkStatus.
 * Index flows should use API Request responseType "async" so localhost does not
 * hold one realtime HTTP connection open for the full Firecrawl+embed duration.
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

    // Async mode returns requestId quickly; poll until final output.
    const requestId = extractRequestId(res?.result ?? undefined);
    if (requestId && res?.result && !looksLikeFinalIndexResult(res.result)) {
      console.info(`[reading-list-digest] ${label} polling requestId=${requestId}`);
      res = (await client.checkStatus(requestId, 5, pollTimeout)) as LamaticRes;
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

    const raw = res?.result;
    if (!raw || typeof raw !== "object") {
      throw new Error(
        `${label} returned no result (${flowHint}, status=${res?.status ?? "unknown"}). ` +
          `Confirm INDEX/SYNTHESIZE flow IDs in apps/.env.local, Deploy after Studio fixes, ` +
          `and API Request schema matches the payload (sampleInput / query).`
      );
    }

    return raw as Record<string, unknown>;
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

  return {
    indexed_count: Number(parsed.indexed_count ?? 0),
    collection: String(parsed.collection ?? "configured"),
    errors: (unwrap(parsed.errors) as unknown[]) ?? [],
  };
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

  return {
    query: String(parsed.query ?? query),
    executive_brief:
      (unwrap(parsed.executive_brief) as DigestResult["executive_brief"]) ?? [],
    article_summaries:
      (unwrap(parsed.article_summaries) as ArticleSummary[]) ?? [],
    cross_cutting_themes:
      (unwrap(parsed.cross_cutting_themes) as string[]) ?? [],
    cross_source_contradictions:
      (unwrap(parsed.cross_source_contradictions) as Contradiction[]) ?? [],
    consensus_points:
      (unwrap(parsed.consensus_points) as ConsensusPoint[]) ?? [],
    warnings: (unwrap(parsed.warnings) as DigestWarning[]) ?? [],
  };
}
