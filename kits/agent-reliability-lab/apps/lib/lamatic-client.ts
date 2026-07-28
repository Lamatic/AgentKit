import { Lamatic } from "lamatic"

/**
 * Constructs the Lamatic client, validating credentials at call time rather
 * than at module load, so a misconfigured environment surfaces as a normal
 * error from runAudit instead of crashing the whole app on import.
 */
export function getLamaticClient(): Lamatic {
  if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
    throw new Error(
      "Lamatic API credentials are not set. Please add LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY to your .env.local file."
    )
  }
  return new Lamatic({
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  })
}
