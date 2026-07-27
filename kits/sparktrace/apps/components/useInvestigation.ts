"use client";

import { useCallback, useRef, useState } from "react";
import type { Investigation, InvestigationEvent, RunInvestigationInput } from "../lib/contracts";
import { streamInvestigation } from "./investigation-client";

export interface UseInvestigationResult {
  investigation: Investigation | null;
  isRunning: boolean;
  error: string | null;
  /**
   * Core primitive: accumulate an Investigation by draining ANY async
   * iterable of InvestigationEvent. Transport-agnostic on purpose — pass
   * whatever produces events (the default fetch/NDJSON transport, a mocked
   * iterable in tests, or a future direct server-action async generator).
   */
  consume: (events: AsyncIterable<InvestigationEvent>, input: RunInvestigationInput) => Promise<void>;
  /** Convenience: run via the default /api/investigate NDJSON transport. */
  start: (input: RunInvestigationInput) => Promise<void>;
  /** Aborts the in-flight default-transport request, if any. */
  cancel: () => void;
  reset: () => void;
}

function emptyInvestigation(input: RunInvestigationInput): Investigation {
  return {
    id: `inv_${Date.now().toString(36)}`,
    symptom: input.symptom,
    mode: input.mode,
    pipeline: { files: [], tables: [], dag: [], summary: "" },
    decisions: [],
    hypotheses: [],
    steps: [],
    repoInsights: [],
    status: "ingesting",
  };
}

function applyEvent(inv: Investigation, event: InvestigationEvent): Investigation {
  switch (event.type) {
    case "status":
      return { ...inv, status: event.status };
    case "pipeline":
      return { ...inv, pipeline: event.pipeline };
    case "decision": {
      // A gen_query decision carries the hypothesis the planner is about to test —
      // fold it into the running hypothesis list (dedup by id) so HypothesisCard-style
      // consumers see the full set without a separate "plan" event.
      const decisions = [...inv.decisions, event.decision];
      const incoming = event.decision.hypothesis;
      const hypotheses = incoming
        ? inv.hypotheses.some((h) => h.id === incoming.id)
          ? inv.hypotheses.map((h) => (h.id === incoming.id ? incoming : h))
          : [...inv.hypotheses, incoming]
        : inv.hypotheses;
      return { ...inv, decisions, hypotheses };
    }
    case "repo-insight":
      return { ...inv, repoInsights: [...inv.repoInsights, event.insight] };
    case "step": {
      // Replace an in-place step (same query id) if the loop re-emits a refined
      // step, otherwise append. Keeps refine-query loops from duplicating.
      const existingIndex = inv.steps.findIndex((s) => s.query.id === event.step.query.id);
      const steps =
        existingIndex >= 0
          ? inv.steps.map((s, i) => (i === existingIndex ? event.step : s))
          : [...inv.steps, event.step];
      const hypotheses = inv.hypotheses.some((h) => h.id === event.step.hypothesis.id)
        ? inv.hypotheses.map((h) => (h.id === event.step.hypothesis.id ? event.step.hypothesis : h))
        : [...inv.hypotheses, event.step.hypothesis];
      return { ...inv, steps, hypotheses };
    }
    case "report":
      return { ...inv, report: event.report };
    case "error":
      return { ...inv, status: "error", error: event.message };
    default: {
      // Exhaustiveness check: if InvestigationEvent grows a variant, this fails to compile.
      const _exhaustive: never = event;
      return inv;
    }
  }
}

/**
 * Accumulates a full Investigation from a live InvestigationEvent stream.
 * `start()` uses the default NDJSON transport (apps/components/investigation-client.ts);
 * `consume()` is the transport-agnostic primitive underneath it.
 */
export function useInvestigation(): UseInvestigationResult {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setInvestigation(null);
    setIsRunning(false);
    setError(null);
  }, []);

  const consume = useCallback(async (events: AsyncIterable<InvestigationEvent>, input: RunInvestigationInput) => {
    setIsRunning(true);
    setError(null);
    let current = emptyInvestigation(input);
    setInvestigation(current);

    try {
      for await (const event of events) {
        if (event.type === "error") setError(event.message);
        current = applyEvent(current, event);
        setInvestigation(current);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Investigation stream failed";
      setError(message);
      current = { ...current, status: "error", error: message };
      setInvestigation(current);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const start = useCallback(
    async (input: RunInvestigationInput) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      await consume(streamInvestigation(input, { signal: controller.signal }), input);
    },
    [consume]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
  }, []);

  return { investigation, isRunning, error, consume, start, cancel, reset };
}
