"use server";

import { callLamaticGraphQL } from "../lib/lamatic";
import { AlertObject } from "../lib/types";
import lamaticConfig from "../../lamatic.config";

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

export async function orchestrateIngestion(runbookText: string) {
  return callLamaticGraphQL(GRAPHQL_QUERY, {
    workflowId: INGESTION_FLOW_ID,
    payload: { runbookText },
  });
}

export async function orchestrateGenerator(prompt: string) {
  return callLamaticGraphQL(GRAPHQL_QUERY, {
    workflowId: GENERATOR_FLOW_ID,
    payload: { prompt },
  });
}

export async function orchestrateResponder(alert: AlertObject) {
  return callLamaticGraphQL(GRAPHQL_QUERY, {
    workflowId: RESPONDER_FLOW_ID,
    payload: alert,
  });
}
