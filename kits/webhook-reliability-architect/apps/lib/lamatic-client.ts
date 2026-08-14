import { Lamatic } from "lamatic";

export function getLamaticClient(): Lamatic {
  const endpoint = process.env.LAMATIC_API_URL;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Missing Lamatic credentials. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY.",
    );
  }

  return new Lamatic({ endpoint, projectId, apiKey });
}
