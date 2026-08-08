import { Lamatic } from "lamatic";

/** Creates a Lamatic SDK client from app-local environment variables. */
export function getLamaticClient() {
  if (
    !process.env.LAMATIC_API_URL ||
    !process.env.LAMATIC_PROJECT_ID ||
    !process.env.LAMATIC_API_KEY
  ) {
    throw new Error(
      "Lamatic API credentials are not set. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY in the application environment.",
    );
  }

  return new Lamatic({
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  });
}
