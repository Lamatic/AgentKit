import { Lamatic } from "lamatic";

const apiKey = process.env.LAMATIC_API_KEY || "";
const projectId = process.env.LAMATIC_PROJECT_ID || "";
const endpoint = process.env.LAMATIC_API_URL || "https://api.lamatic.ai";

export const flowId = process.env.LAMATIC_FLOW_ID || "";

export const lamaticClient = new Lamatic({
  endpoint,
  projectId,
  apiKey,
});
