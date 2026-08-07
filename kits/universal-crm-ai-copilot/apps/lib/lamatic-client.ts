import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "https://api.lamatic.ai",
  projectId: config.api.projectId ?? process.env.LAMATIC_PROJECT_ID ?? "",
  apiKey: config.api.apiKey ?? process.env.LAMATIC_API_KEY ?? ""
});
