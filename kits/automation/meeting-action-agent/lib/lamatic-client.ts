import { Lamatic } from "lamatic"

if (!process.env.MEETING_ACTION_FLOW_ID) {
  throw new Error(
    "MEETING_ACTION_FLOW_ID environment variable is not set. Please add it to your .env.local file."
  )
}

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY must all be set in your .env.local file."
  )
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL ?? "",
  projectId: process.env.LAMATIC_PROJECT_ID ?? null,
  apiKey: process.env.LAMATIC_API_KEY ?? "",
})