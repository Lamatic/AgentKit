import { Lamatic } from "lamatic";

// Initialize without throwing at import-time to allow Next.js to build the app
// without requiring production credentials in the environment.
export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL || "https://api.lamatic.ai",
  projectId: process.env.LAMATIC_PROJECT_ID || "missing_project_id",
  apiKey: process.env.LAMATIC_API_KEY || "missing_api_key",
});
