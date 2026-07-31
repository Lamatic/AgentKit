import { Lamatic } from "lamatic"
import { config } from "../orchestrate.js"

if (!process.env.API_BREAKING_CHANGE_DETECTOR) {
  throw new Error(
    "API_BREAKING_CHANGE_DETECTOR is not set. Please add it to your .env.local file.",
  )
}

if (
  !process.env.LAMATIC_API_URL ||
  !process.env.LAMATIC_PROJECT_ID ||
  !process.env.LAMATIC_API_KEY
) {
  throw new Error(
    "Lamatic API credentials are not set. Please add LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY to your .env.local file.",
  )
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId ?? null,
  apiKey: config.api.apiKey ?? "",
})
