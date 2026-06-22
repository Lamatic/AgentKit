import { Lamatic } from "lamatic"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable "${name}". Add it to your .env.local file.`)
  }
  return value
}

let client: Lamatic | null = null

/** Lazily construct the Lamatic client so env is only read when a flow runs. */
export function getLamaticClient(): Lamatic {
  if (!client) {
    client = new Lamatic({
      endpoint: requireEnv("LAMATIC_API_URL"),
      projectId: requireEnv("LAMATIC_PROJECT_ID"),
      apiKey: requireEnv("LAMATIC_API_KEY"),
    })
  }
  return client
}

/** The two deployed flow IDs this kit calls. */
export function getFlowIds(): { judge: string; runTarget: string } {
  return {
    judge: requireEnv("JUDGE_FLOW"),
    runTarget: requireEnv("RUN_TARGET_FLOW"),
  }
}
