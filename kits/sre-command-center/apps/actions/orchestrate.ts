"use server";

import { callLamaticGraphQL } from "../lib/lamatic";
import { AlertObject } from "../lib/types";
import lamaticConfig from "../../lamatic.config";

/**
 * Resolves the configured environment variable value for a given step ID in lamatic.config.ts.
 * @param stepId The flow step ID from lamatic.config.ts.
 * @returns The environment variable value or empty string.
 */
function getFlowId(stepId: string): string {
  const step = lamaticConfig.steps.find((s) => s.id === stepId);
  if (!step || !step.envKey) return "";
  return process.env[step.envKey] || "";
}

const INGESTION_FLOW_ID = getFlowId("data-ingestion");
const GENERATOR_FLOW_ID = getFlowId("incident-generator");
const RESPONDER_FLOW_ID = getFlowId("master-responder");

const GRAPHQL_QUERY = `
  query ExecuteWorkflow(
    $workflowId: String!
    $payload: JSON
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: $payload
    ) {
      status
      result
    }
  }
`;

/**
 * Triggers the Data Ingestion flow to index runbook text into Vector DB.
 * @param runbookText The complete Markdown or plaintext SRE runbook content.
 * @returns Execution status and vector indexing result.
 */
export async function orchestrateIngestion(runbookText: string) {
  return callLamaticGraphQL(GRAPHQL_QUERY, {
    workflowId: INGESTION_FLOW_ID,
    payload: { runbookText },
  });
}

/**
 * Triggers the Incident Generator flow to generate realistic alert JSON from a prompt.
 * @param prompt Natural language description of the incident scenario.
 * @returns Structured alert object matching Datadog/PagerDuty schema.
 */
export async function orchestrateGenerator(prompt: string) {
  return callLamaticGraphQL(GRAPHQL_QUERY, {
    workflowId: GENERATOR_FLOW_ID,
    payload: { prompt },
  });
}

/**
 * Triggers the Master Responder flow to triage and resolve an incident alert.
 * @param alert The structured JSON alert object.
 * @returns Complete Markdown SRE post-mortem report and triage classification.
 */
export async function orchestrateResponder(alert: AlertObject) {
  return callLamaticGraphQL(GRAPHQL_QUERY, {
    workflowId: RESPONDER_FLOW_ID,
    payload: alert,
  });
}
