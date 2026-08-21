/*
 * # property-analysis-flow
 * Ingests a property list from Google Sheets, runs deterministic financial math
 * (NOI, Cap Rate, Cash-on-Cash Return, DSCR, GRM) in a code node, then has an LLM
 * turn the computed metrics into an investor-grade brief with a Buy/Hold/Pass verdict.
 *
 * ## Node walkthrough
 * 1. `Google Sheets` (googleSheetsNode, trigger) — reads property rows (Address,
 *    Purchase Price, Expenses, Potential Rent, financing terms) from the sheet
 *    configured via PROPERTY_SHEET_ID.
 * 2. `Calculate_Metrics` (codeNode) — @scripts/calculations.ts. Deterministic math
 *    only; the LLM never recomputes these numbers.
 * 3. `Generate_Brief` (LLMNode) — @prompts/brief-generation_system.md +
 *    @model-configs/analyst-model.ts, governed by @constitutions/default.md.
 *    Interprets the metrics into a brief and verdict; does not do the math itself.
 *
 * This flow is a scaffold pending a Lamatic Studio export — `nodes` and `edges`
 * are empty until built in Studio. Keep `references` below in sync with the
 * actual node config once populated.
 */

// Flow: property-analysis-flow
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Property Analysis",
  "description": "Ingests a property list from Google Sheets, computes NOI, Cap Rate, Cash-on-Cash Return, DSCR, and GRM deterministically, then generates an investor-grade Buy/Hold/Pass brief.",
  "version": "1.0.0"
};

// ── Inputs ────────────────────────────────────────────
// Google Sheets trigger — no caller-supplied runtime inputs; sheet selection
// and credentials are configured on the trigger node once built in Studio.
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "brief_generation_system": "@prompts/brief-generation_system.md"
  },
  "modelConfigs": {
    "analyst_model": "@model-configs/analyst-model.ts"
  },
  "scripts": {
    "calculations": "@scripts/calculations.ts"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
// SCAFFOLD — populate once this flow is built and exported from Lamatic Studio.
export const nodes = [];

export const edges = [];

export default { meta, inputs, references, nodes, edges };
