import { Lamatic } from "lamatic";
import {config} from '../actions/config'

if (!process.env.AGENTIC_GENERATE_CONTENT) {
  throw new Error(
    "All Workflow IDs in environment variable are not set. Please add it to your .env.local file."
  );
}

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "All API Credentials in environment variable are not set. Please add it to your .env.local file."
  );
}
console.log("ENV CHECK:", {
  url: process.env.LAMATIC_API_URL,
  project: process.env.LAMATIC_PROJECT_ID,
  key: process.env.LAMATIC_API_KEY
})
export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL ?? "",
  projectId: process.env.LAMATIC_PROJECT_ID ?? "",
  apiKey: process.env.LAMATIC_API_KEY ?? ""
});