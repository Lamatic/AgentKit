import { Lamatic } from "lamatic";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable "${name}". Add it to apps/.env.local.`);
  }
  return value;
}

export function validateLamaticApiUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("LAMATIC_API_URL must be a valid URL.");
  }

  const isLoopback = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) {
    throw new Error("LAMATIC_API_URL must use https unless it targets a loopback development endpoint.");
  }

  return value;
}

let client: Lamatic | null = null;

export function getLamaticClient(): Lamatic {
  if (!client) {
    client = new Lamatic({
      endpoint: validateLamaticApiUrl(requireEnv("LAMATIC_API_URL")),
      projectId: requireEnv("LAMATIC_PROJECT_ID"),
      apiKey: requireEnv("LAMATIC_API_KEY")
    });
  }

  return client;
}
