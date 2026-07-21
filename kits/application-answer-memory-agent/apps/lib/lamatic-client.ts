import { DraftAnswerInput, DraftAnswerOutput } from "@/types";

// Validate env variables up front so failures are obvious, not silent.
const requiredEnv = [
  "LAMATIC_API_URL",
  "LAMATIC_PROJECT_ID",
  "LAMATIC_API_KEY",
  "LAMATIC_FLOW_ID",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
});

// Note: we call the Lamatic GraphQL endpoint directly with fetch rather
// than the `lamatic` npm SDK. The SDK sends the whole payload as a single
// generic `$payload: JSON!` variable, which doesn't line up with the typed
// query this flow's trigger schema actually expects (individual
// `$new_question: String!` / `$past_answers: String!` variables, as shown
// in Lamatic Studio's own "Get API Key" setup snippet). That mismatch made
// the SDK's fetch return an empty body, which crashed on JSON.parse.

const QUERY = `
  query ExecuteWorkflow(
    $workflowId: String!
    $new_question: String!
    $past_answers: String!
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: { new_question: $new_question, past_answers: $past_answers }
    ) {
      status
      result
    }
  }
`;

export async function draftAnswer(
  input: DraftAnswerInput
): Promise<DraftAnswerOutput> {
  const response = await fetch(process.env.LAMATIC_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
      "x-project-id": process.env.LAMATIC_PROJECT_ID!,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        workflowId: process.env.LAMATIC_FLOW_ID,
        new_question: input.new_question,
        past_answers: input.past_answers,
      },
    }),
  });

  const raw = await response.text();

  if (!raw) {
    throw new Error(
      `Lamatic API returned an empty response (HTTP ${response.status}). Check LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY in .env.local.`
    );
  }

  const json = JSON.parse(raw);

  if (json.errors) {
    throw new Error(json.errors[0]?.message || "Lamatic API returned an error.");
  }

  return json.data.executeWorkflow.result as DraftAnswerOutput;
}