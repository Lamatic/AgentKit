import { Lamatic } from "lamatic";

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_PROJECT_ENDPOINT ?? "",
  projectId: process.env.LAMATIC_PROJECT_ID ?? "",
  apiKey: process.env.LAMATIC_PROJECT_API_KEY ?? "",
});