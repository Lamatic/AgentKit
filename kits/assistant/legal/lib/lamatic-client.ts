import { Lamatic } from "lamatic"
import { config } from "../orchestrate.js"

export function getLamaticClient() {
  if (!process.env.ASSISTANT_LEGAL_ADVISOR) {
    throw new Error(
      "ASSISTANT_LEGAL_ADVISOR is not set. Please add it to your .env.local file."
    )
  }

  if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
    throw new Error(
      "LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY must be set in your .env.local file."
    )
  }

  return new Lamatic({
    endpoint: config.api.endpoint ?? "",
    projectId: config.api.projectId ?? "",
    apiKey: config.api.apiKey ?? "",
  })
}
