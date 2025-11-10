import { Lamatic } from "lamatic"

if (!process.env.LAMATIC_CONFIG_GENERATION) {
  throw new Error("LAMATIC_CONFIG_GENERATION environment variable is not set. Please add it to your .env.local file.")
}

const config = JSON.parse(Buffer.from(process.env.LAMATIC_CONFIG_GENERATION, "base64").toString("utf8"))

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint,
  projectId: config.api.projectId,
  apiKey: config.api.apiKey,
})

export const generationConfig = config
