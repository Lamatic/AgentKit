import { Lamatic } from "lamatic";

if (!process.env.VISUAL_RETURN_ASSESSOR || !process.env.POLICY_DATA_INGESTION) {
  throw new Error(
    "All Workflow IDs in environment variable are not set. Please add it to your .env.local file.",
  );
}

if (
  !process.env.LAMATIC_API_URL ||
  !process.env.LAMATIC_PROJECT_ID ||
  !process.env.LAMATIC_API_KEY
) {
  throw new Error(
    "All API Credentials in environment variable are not set. Please add it to your .env.local file.",
  );
}

export const config = {
  apiKey: process.env.LAMATIC_API_KEY!,
  endpoint: process.env.LAMATIC_API_URL!,
  ingestion: process.env.POLICY_DATA_INGESTION!,
  visual: process.env.VISUAL_RETURN_ASSESSOR!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
};

export const lamaticClient = new Lamatic({
  endpoint: config.endpoint ?? "",
  projectId: config.projectId ?? null,
  apiKey: config.apiKey ?? "",
});
