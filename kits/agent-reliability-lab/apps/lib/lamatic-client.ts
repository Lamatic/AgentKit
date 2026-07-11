import { Lamatic } from "lamatic"

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "Lamatic API credentials are not set. Please add LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY to your .env.local file."
  )
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL,
  projectId: process.env.LAMATIC_PROJECT_ID,
  apiKey: process.env.LAMATIC_API_KEY,
})

export const AUDIT_FLOW_ENV_KEY = "AGENT_RELIABILITY_AUDIT_FLOW_ID"
