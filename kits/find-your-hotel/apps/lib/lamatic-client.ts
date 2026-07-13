import { Lamatic } from "lamatic";

const endpoint = process.env.LAMATIC_PROJECT_ENDPOINT;
const projectId = process.env.LAMATIC_PROJECT_ID;
const apiKey = process.env.LAMATIC_PROJECT_API_KEY;

export const lamaticClient =
  endpoint && projectId && apiKey
    ? new Lamatic({ endpoint, projectId, apiKey })
    : null;

export const LAMATIC_FLOW_ID = process.env.LAMATIC_FLOW_ID ?? "";
export const LAMATIC_AGENT_ID = process.env.LAMATIC_AGENT_ID ?? "";
