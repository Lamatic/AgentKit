import { Lamatic } from "lamatic"
import { config } from "../orchestrate.js"

if (!process.env.AUTOMATION_COLD_EMAIL) {
  throw new Error(
    "AUTOMATION_COLD_EMAIL (workflow ID) is not set. Add it to your .env.local file.",
  )
}

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY must be set in .env.local.",
  )
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId ?? null,
  apiKey: config.api.apiKey ?? "",
})
