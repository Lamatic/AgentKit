import { Lamatic } from "lamatic";

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_ENDPOINT ?? "",
  projectId: process.env.LAMATIC_PROJECT_ID ?? "",
  apiKey: process.env.LAMATIC_API_KEY ?? "",
});