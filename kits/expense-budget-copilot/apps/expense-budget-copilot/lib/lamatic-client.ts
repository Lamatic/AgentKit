import { Lamatic } from "lamatic";

// Reads credentials from environment variables.
// See .env.example for the required keys.
export const lamatic = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY as string,
  projectId: process.env.LAMATIC_PROJECT_ID as string,
  endpoint: process.env.LAMATIC_ENDPOINT as string,
});

export const FLOW_ID = process.env.LAMATIC_FLOW_ID as string;
