import { Lamatic } from "lamatic";
import { flows } from "../orchestrate.js";

if (!process.env.RESEARCH_PAPER_ANALYZER_FLOW_ID) {
  throw new Error(
    "RESEARCH_PAPER_ANALYZER_FLOW_ID is not set. Add it to your .env.local file."
  );
}

if (
  !process.env.LAMATIC_API_URL ||
  !process.env.LAMATIC_PROJECT_ID ||
  !process.env.LAMATIC_API_KEY
) {
  throw new Error(
    "Lamatic API credentials are not set. Add LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY to your .env.local file."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL,
  projectId: process.env.LAMATIC_PROJECT_ID,
  apiKey: process.env.LAMATIC_API_KEY,
});
