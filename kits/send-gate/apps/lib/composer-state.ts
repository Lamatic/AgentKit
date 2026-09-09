import { DEFAULT_POLICY, EMPTY_FACTS, EMPTY_RECIPIENT, extraJsonProblem, factsToForm, formToFacts, formToPolicy, formToRecipient, parseJsonObject, policyToForm, recipientToForm, toJsonText } from "./facts-form";
import type { FactsForm, PolicyForm, RecipientForm } from "./facts-form";
import { SCENARIOS } from "./scenarios";
import type { Scenario } from "./scenarios";
import type { GateRequest } from "./types";

export interface ComposerState {
  source: "scenario" | "custom";
  scenarioId: string | null;
  draft: string;
  facts: FactsForm;
  factsMode: "fields" | "json";
  factsJson: string;
  factsJsonError: string;
  recipient: RecipientForm;
  policy: PolicyForm;
  truthUrl: string;
  forceCheck: boolean;
  advancedOpen: boolean;
}

export function blankState(): ComposerState {
  return {
    source: "custom",
    scenarioId: null,
    draft: "",
    facts: { ...EMPTY_FACTS },
    factsMode: "fields",
    factsJson: "",
    factsJsonError: "",
    recipient: { ...EMPTY_RECIPIENT },
    policy: { ...DEFAULT_POLICY, disableRules: [] },
    truthUrl: "",
    forceCheck: false,
    advancedOpen: false
  };
}

export function stateFromScenario(s: Scenario): ComposerState {
  const base = blankState();
  return {
    ...base,
    source: "scenario",
    scenarioId: s.id,
    draft: s.draft,
    facts: factsToForm(parseJsonObject(s.facts) ?? {}),
    recipient: recipientToForm(parseJsonObject(s.recipient) ?? {}),
    policy: policyToForm(parseJsonObject(s.policy) ?? {}),
    truthUrl: s.truthUrl,
    forceCheck: s.needsFactCheck,
    advancedOpen: Boolean(s.truthUrl || s.needsFactCheck)
  };
}

export function initialState(): ComposerState {
  return stateFromScenario(SCENARIOS[0]);
}

/** Facts as the flow will see them, whichever editor is active. */
export function currentFactsObject(state: ComposerState): Record<string, unknown> | null {
  return state.factsMode === "json" ? parseJsonObject(state.factsJson) : formToFacts(state.facts);
}

export function toRequest(state: ComposerState): GateRequest {
  const facts = state.factsMode === "json" ? state.factsJson.trim() : toJsonText(formToFacts(state.facts));
  return {
    draft: state.draft,
    facts,
    recipient: toJsonText(formToRecipient(state.recipient)),
    policy: toJsonText(formToPolicy(state.policy)),
    needsFactCheck: state.forceCheck,
    truthUrl: state.truthUrl.trim()
  };
}

export function switchFactsMode(state: ComposerState, mode: "fields" | "json"): ComposerState {
  if (mode === state.factsMode) return state;
  if (mode === "json") return { ...state, factsMode: "json", factsJson: JSON.stringify(formToFacts(state.facts), null, 2), factsJsonError: "" };
  if (!state.factsJson.trim()) return { ...state, factsMode: "fields", facts: { ...EMPTY_FACTS }, factsJsonError: "" };
  const parsed = parseJsonObject(state.factsJson);
  if (!parsed) return { ...state, factsJsonError: "This is not a JSON object yet. Fix it, or clear it, to go back to fields." };
  return { ...state, factsMode: "fields", facts: factsToForm(parsed), factsJsonError: "" };
}

/** Why the current state cannot be submitted, or null. Malformed facts never reach the flow. */
export function composerProblem(state: ComposerState): string | null {
  if (!state.draft.trim()) return "Draft is required.";
  if (state.factsMode === "json") return state.factsJson.trim() && parseJsonObject(state.factsJson) === null ? "Facts must be a JSON object." : null;
  return extraJsonProblem(state.facts);
}

export const scenarioById = (id: string | null) => SCENARIOS.find((s) => s.id === id) ?? null;
