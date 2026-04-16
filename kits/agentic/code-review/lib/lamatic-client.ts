import { Lamatic } from "lamatic"

const lamaticApiUrl = process.env.LAMATIC_API_URL?.trim()
const lamaticProjectId = process.env.LAMATIC_PROJECT_ID?.trim()
const lamaticApiKey = process.env.LAMATIC_API_KEY?.trim()

if (!lamaticApiUrl || !lamaticProjectId || !lamaticApiKey) {
  throw new Error(
    "All Lamatic API credentials must be set in the environment before the client can be created."
  )
}

export const lamaticClient = new Lamatic({
  endpoint: lamaticApiUrl,
  projectId: lamaticProjectId,
  apiKey: lamaticApiKey,
})
