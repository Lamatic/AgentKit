"use server";

import { runFlow } from "@/lib/lamatic-client";
import type { ActionResult, AppealResult, DenialFacts } from "@/lib/types";

/**
 * Normalise any thrown value into the ActionResult error shape and log it
 * server-side. Errors are surfaced to the client as plain messages so that
 * stack traces and credentials never leave the server.
 */
function fail(e: unknown): { ok: false; error: string } {
  const msg = e instanceof Error ? e.message : "Unknown error";
  console.error("[claim-appeal-writer]", msg);
  return { ok: false, error: msg };
}

/**
 * Extract plain text from an uploaded document.
 *
 * PDFs are parsed with `pdf-parse`; .txt/.md files are passed through as UTF-8.
 * Scanned PDFs with no text layer return an error rather than empty text, so the
 * caller can prompt the user to paste the text instead.
 *
 * @param formData - Must contain a `file` entry.
 * @returns The extracted text, or an error describing why extraction failed.
 */
export async function extractText(formData: FormData): Promise<ActionResult<string>> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "No file received" };
    const buf = Buffer.from(await file.arrayBuffer());
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      // pdf-parse's package entry runs a debug harness when imported at module scope; import the lib directly.
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (b: Buffer) => Promise<{ text: string }>;
      const parsed = await pdfParse(buf);
      const text = parsed.text.trim();
      if (!text) return { ok: false, error: "No text layer found in this PDF. If it is a scan, paste the text instead." };
      return { ok: true, data: text };
    }
    return { ok: true, data: buf.toString("utf8") };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Flow 1 — chunk, embed and index the policy document.
 *
 * The `policyId` scopes retrieval in {@link draftAppeal} so an appeal only ever
 * cites clauses from the policy it belongs to. NOTE: this scoping is not an
 * authorization boundary — see "Security model" in agent.md before deploying
 * this to real users.
 *
 * @param policyText - Full plain text of the policy document.
 * @param policyId - Caller-generated identifier for this policy.
 * @param policyTitle - Human-readable name used in citations.
 * @returns The policy id and the number of chunks indexed.
 */
export async function indexPolicy(
  policyText: string,
  policyId: string,
  policyTitle: string
): Promise<ActionResult<{ policyId: string; chunks: number }>> {
  try {
    const r = await runFlow<{ policyId: string; chunks: number | string | string[] }>("index-policy", {
      policyText,
      policyId,
      policyTitle
    });
    const chunks = Array.isArray(r.chunks) ? r.chunks.length : Number(r.chunks ?? 0) || 0;
    return { ok: true, data: { policyId: r.policyId ?? policyId, chunks } };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Flow 2 — extract structured facts from a denial letter.
 *
 * The flow is schema-constrained, so the result is shape-checked before it
 * reaches the UI. A string result is tolerated and parsed, since some model
 * providers return stringified JSON.
 *
 * @param denialText - Plain text of the denial letter.
 * @returns Structured denial facts for the user to confirm.
 */
export async function analyzeDenial(denialText: string): Promise<ActionResult<DenialFacts>> {
  try {
    const r = await runFlow<{ denialFacts: DenialFacts | string }>("analyze-denial", { denialText });
    const facts = typeof r.denialFacts === "string" ? (JSON.parse(r.denialFacts) as DenialFacts) : r.denialFacts;
    if (!facts?.denialReasons) throw new Error("analyze-denial returned an unexpected shape");
    return { ok: true, data: facts };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Flow 3 — retrieve the governing clauses and draft the appeal.
 *
 * Runs after the user has confirmed (and optionally corrected) the facts from
 * {@link analyzeDenial}. Retrieval is scoped to `policyId`; `state` drives the
 * regulatory web search.
 *
 * @param denialFacts - Confirmed denial facts.
 * @param policyId - Same identifier used in {@link indexPolicy}.
 * @param state - US state, used to look up appeal rights.
 * @param patientContext - Optional free-text notes from the policyholder.
 * @returns The letter, deadline, checklist, next steps and supporting sources.
 */
export async function draftAppeal(
  denialFacts: DenialFacts,
  policyId: string,
  state: string,
  patientContext: string
): Promise<ActionResult<AppealResult>> {
  try {
    const r = await runFlow<{ result: AppealResult | string }>("draft-appeal", {
      denialFacts,
      policyId,
      state,
      patientContext
    });
    const result = typeof r.result === "string" ? (JSON.parse(r.result) as AppealResult) : r.result;
    if (!result?.letter) throw new Error("draft-appeal returned no letter");
    return { ok: true, data: result };
  } catch (e) {
    return fail(e);
  }
}
