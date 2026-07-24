import { Lamatic } from "lamatic";
import { getLamaticEnvironment } from "./environment";

let client: Lamatic | undefined;

export function getLamaticClient(): Lamatic {
  if (client) return client;
  const environment = getLamaticEnvironment();
  client = new Lamatic({
    endpoint: environment.LAMATIC_API_URL,
    projectId: environment.LAMATIC_PROJECT_ID,
    apiKey: environment.LAMATIC_API_KEY,
  });
  return client;
}
