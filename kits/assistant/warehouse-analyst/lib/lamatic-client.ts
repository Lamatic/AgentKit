import { Lamatic } from "lamatic";

if (
  !process.env.LAMATIC_PROJECT_ENDPOINT ||
  !process.env.LAMATIC_PROJECT_ID ||
  !process.env.LAMATIC_PROJECT_API_KEY
) {
  throw new Error("Lamatic env variables not set in .env.local");
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_PROJECT_ENDPOINT,
  projectId: process.env.LAMATIC_PROJECT_ID,
  apiKey: process.env.LAMATIC_PROJECT_API_KEY,
});

export const FLOW_ID = process.env.LAMATIC_FLOW_ID!;
