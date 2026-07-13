"use server";

import { callLamaticGraphQL } from "../lib/lamatic";
import { AlertObject } from "../lib/types";

const INGESTION_FLOW_ID = process.env.LAMATIC_FLOW_INGESTION_ID || "";
const GENERATOR_FLOW_ID = process.env.LAMATIC_FLOW_GENERATOR_ID || "";
const RESPONDER_FLOW_ID = process.env.LAMATIC_FLOW_RESPONDER_ID || "";

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
