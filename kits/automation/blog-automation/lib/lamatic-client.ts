import { Lamatic } from "lamatic";
import { config } from '../orchestrate.js'

interface LamaticConfig {
  api: {
    endpoint?: string;
    projectId?: string | null;
    apiKey?: string;
  }
}

const lamaticConfig = config as LamaticConfig;

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  console.warn("Lamatic API Credentials are not fully set in environment variables. Set them in .env for production usage.");
}

export const lamaticClient = new Lamatic({
  endpoint: lamaticConfig?.api?.endpoint ?? "",
  projectId: lamaticConfig?.api?.projectId ?? null,
  apiKey: lamaticConfig?.api?.apiKey ?? ""
});