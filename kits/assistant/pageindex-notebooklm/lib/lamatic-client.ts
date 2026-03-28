import { Lamatic } from "lamatic";

if (
  !process.env.FLOW_ID_UPLOAD ||
  !process.env.FLOW_ID_CHAT ||
  !process.env.FLOW_ID_LIST ||
  !process.env.FLOW_ID_TREE
) {
  throw new Error(
    "One or more Flow IDs are missing. Set FLOW_ID_UPLOAD, FLOW_ID_CHAT, FLOW_ID_LIST, FLOW_ID_TREE in your .env file."
  );
}

if (
  !process.env.LAMATIC_API_URL ||
  !process.env.LAMATIC_PROJECT_ID ||
  !process.env.LAMATIC_API_KEY
) {
  throw new Error(
    "Lamatic API credentials missing. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY in your .env file."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  apiKey: process.env.LAMATIC_API_KEY!,
});
