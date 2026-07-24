import { Lamatic } from "lamatic";
import lamaticConfig from "../../lamatic.config";

// Initialize the Lamatic Server SDK
// Using the credentials provided via environment variables
export const lamatic = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY || "",
  projectId: process.env.LAMATIC_PROJECT_ID || "",
  endpoint: process.env.LAMATIC_API_URL || "",
});

// Export the config metadata for use in the application if needed
export { lamaticConfig };
