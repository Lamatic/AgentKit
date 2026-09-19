import { Lamatic } from "lamatic";

const apiKey = process.env.LAMATIC_API_KEY || "";
const projectId = process.env.LAMATIC_PROJECT_ID || "";
const endpoint = process.env.LAMATIC_API_URL || "";

if (!apiKey || !projectId || !endpoint) {
  throw new Error(
    "[lamatic-client] LAMATIC_API_KEY, LAMATIC_PROJECT_ID, and LAMATIC_API_URL must be set. " +
      "Copy apps/.env.example to .env.local and fill in your values.",
  );
}

export const lamatic = new Lamatic({
  apiKey,
  projectId,
  endpoint,
});
