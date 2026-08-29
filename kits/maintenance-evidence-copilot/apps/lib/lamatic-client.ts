import { Lamatic } from "lamatic";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable "${name}". Add it to apps/.env.local.`);
  }
  return value;
}

let client: Lamatic | null = null;

export function getLamaticClient(): Lamatic {
  if (!client) {
    client = new Lamatic({
      endpoint: requireEnv("LAMATIC_API_URL"),
      projectId: requireEnv("LAMATIC_PROJECT_ID"),
      apiKey: requireEnv("LAMATIC_API_KEY")
    });
  }

  return client;
}
