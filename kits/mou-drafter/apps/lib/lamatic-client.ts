import { Lamatic } from "lamatic";

if (!process.env.MOU_DRAFTER_FLOW_ID) {
  throw new Error(
    "MOU_DRAFTER_FLOW_ID is not set. Add it to your .env.local file."
  );
}

if (
  !process.env.LAMATIC_API_URL ||
  !process.env.LAMATIC_PROJECT_ID ||
  !process.env.LAMATIC_API_KEY
) {
  throw new Error(
    "Lamatic API credentials not set. Add LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY to .env.local"
  );
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL,
  projectId: process.env.LAMATIC_PROJECT_ID,
  apiKey: process.env.LAMATIC_API_KEY,
});
