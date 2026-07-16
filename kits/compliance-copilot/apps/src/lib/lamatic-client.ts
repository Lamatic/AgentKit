import { Lamatic } from "lamatic";

/**
 * Shared Lamatic SDK client instance.
 * Configured using environment variables for the API key, project ID, and endpoint URL.
 * Used by server actions to execute deployed flows.
 */
const client = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY as string,
  projectId: process.env.LAMATIC_PROJECT_ID as string,
  endpoint: process.env.LAMATIC_API_URL as string,
});

export { client };
