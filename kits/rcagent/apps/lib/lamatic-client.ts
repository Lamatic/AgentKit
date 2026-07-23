import { Lamatic } from "lamatic";
import { config } from '../orchestrate.js'

const IS_MOCK = !process.env.LAMATIC_API_KEY || process.env.LAMATIC_API_KEY === "your-lamatic-api-key";

if (!IS_MOCK) {
  const missingFlows = [];
  if (!process.env.RC_PLANNER_FLOW_ID) missingFlows.push("RC_PLANNER_FLOW_ID");
  if (!process.env.RC_ANALYZER_FLOW_ID) missingFlows.push("RC_ANALYZER_FLOW_ID");
  if (!process.env.RC_SYNTHESIZER_FLOW_ID) missingFlows.push("RC_SYNTHESIZER_FLOW_ID");

  if (missingFlows.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingFlows.map(v => `- ${v}`).join("\n")}\nPlease add them to your .env.local file.`
    );
  }

  const missingCreds = [];
  if (!process.env.LAMATIC_API_KEY) missingCreds.push("LAMATIC_API_KEY");
  if (!process.env.LAMATIC_PROJECT_ID) missingCreds.push("LAMATIC_PROJECT_ID");
  if (!process.env.LAMATIC_API_URL) missingCreds.push("LAMATIC_API_URL");

  if (missingCreds.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingCreds.map(v => `- ${v}`).join("\n")}\nPlease add them to your .env.local file.`
    );
  }
}

export const lamaticClient = IS_MOCK
  ? null as any
  : new Lamatic({
    endpoint: config.api.endpoint ?? "",
    projectId: config.api.projectId ?? null,
    apiKey: config.api.apiKey ?? ""
  });

