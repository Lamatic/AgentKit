import { Lamatic } from "lamatic";
import config from "../../lamatic.config";

let clientInstance: Lamatic | null = null;

export function getLamaticClient(): Lamatic {
  if (!clientInstance) {
    if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
      throw new Error(
        "All API Credentials in environment variables are not set. Please add them to your .env.local file."
      );
    }
    clientInstance = new Lamatic({
      endpoint: process.env.LAMATIC_API_URL,
      projectId: process.env.LAMATIC_PROJECT_ID,
      apiKey: process.env.LAMATIC_API_KEY
    });
  }
  return clientInstance;
}
