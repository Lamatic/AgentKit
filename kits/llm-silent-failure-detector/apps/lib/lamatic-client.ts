import { Lamatic } from "lamatic"

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "Missing Lamatic API credentials. Copy .env.example to .env.local and fill in LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY."
  )
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL,
  projectId: process.env.LAMATIC_PROJECT_ID,
  apiKey: process.env.LAMATIC_API_KEY,
})
