"use server";

// orchestrate.ts — the one server action, and the seam of the whole design.
//
// Read the pipeline below and the thesis is visible in the control flow: the
// model is called exactly once, to read a photograph. Every decision after that
// — what contains an allergen, what a diner may eat, what the table should
// order — is made by pure functions in `lib/`, each covered by tests.
//
// Nothing here asks a model what to order.

import { enrichDishes } from "@/lib/allergen-engine";
import { isUploadConfigured, uploadMenuImage, UploadError } from "@/lib/blob-upload";
import { executeStep, toUserMessage } from "@/lib/lamatic-client";
import { consumeRequest, getClientIdentifier } from "@/lib/rate-limit";
import {
  fieldErrors,
  parseFlowResult,
  ScanRequestSchema,
  type ScanRequest,
} from "@/lib/scan-schema";
import { planTable, type TablePlan } from "@/lib/table-solver";
import type { EnrichedDish } from "@/lib/types";
import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

export interface ScanReport {
  /** Every dish read from the menu, enriched with verdicts. */
  dishes: EnrichedDish[];
  /** The order, and everything the solver rejected on the way to it. */
  plan: TablePlan;
  meta: {
    detectedLanguage: string;
    currency: string;
    /** The flow's own remarks — legibility problems, sections it skipped. */
    notes: string;
  };
}

export type ScanResponse =
  | { ok: true; report: ScanReport }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

// ---------------------------------------------------------------------------
// The pipeline
// ---------------------------------------------------------------------------

/**
 * Scans a menu and plans one order for the table.
 *
 * Steps, in order:
 *  1. Rate-limit — a scan costs a vision call.
 *  2. Validate the request strictly; return field errors the form can attach.
 *  3. Execute `menu-scan`. **This is the only model call.**
 *  4. Parse the result permissively — a model omitting a field must not 500.
 *  5. Enrich: allergens, diets, prices. Deterministic.
 *  6. Solve: the order. Deterministic.
 *
 * Never throws. Every failure comes back as `{ ok: false }` with a message
 * written for a diner rather than an operator.
 */
export async function scanMenu(input: unknown): Promise<ScanResponse> {
  // ── 1. Rate limit ──
  const requestHeaders = await headers();
  const limit = consumeRequest(getClientIdentifier(requestHeaders));
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return {
      ok: false,
      error: `That's ${limit.limit} menus in ten minutes. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  // ── 2. Validate ──
  const parsed = ScanRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some details are missing or invalid.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  const request: ScanRequest = parsed.data;

  // ── 3. The single model call ──
  let raw: unknown;
  try {
    raw = await executeStep("menu-scan", {
      menuImage: request.imageUrl,
      targetLanguage: request.targetLanguage,
      sourceLanguageHint: request.sourceLanguageHint ?? "",
    });
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }

  // ── 4. Parse, permissively ──
  const result = parseFlowResult(raw);

  // ── 5 & 6. Decide, deterministically ──
  const dishes = enrichDishes(result.dishes, result.currency);
  const plan = planTable({
    dishes,
    diners: request.diners,
    budget: request.budget,
    servingModel: request.servingModel,
  });

  return {
    ok: true,
    report: {
      dishes,
      plan,
      meta: {
        detectedLanguage: result.detectedLanguage,
        currency: result.currency,
        notes: result.notes,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export type UploadResponse =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Uploads a menu photo and returns a publicly-fetchable URL.
 *
 * Separate from `scanMenu` so the browser can show the photo, and any upload
 * problem, before the party and budget are even filled in.
 */
export async function uploadMenuPhoto(formData: FormData): Promise<UploadResponse> {
  const requestHeaders = await headers();
  const limit = consumeRequest(`upload:${getClientIdentifier(requestHeaders)}`);
  if (!limit.allowed) {
    return { ok: false, error: "Too many uploads. Please wait a few minutes." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No photo was received." };
  }

  try {
    return { ok: true, url: await uploadMenuImage(file) };
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, error: error.message };
    return { ok: false, error: "That photo could not be uploaded." };
  }
}

/** Tells the client whether to offer a file picker or only a URL field. */
export async function uploadsAvailable(): Promise<boolean> {
  return isUploadConfigured();
}
