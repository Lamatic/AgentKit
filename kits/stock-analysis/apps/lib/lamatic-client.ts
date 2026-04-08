import { Lamatic } from "lamatic"

if (!process.env.LAMATIC_CONFIG_FINANCE) {
  throw new Error("LAMATIC_CONFIG_FINANCE environment variable is not set. Please add it to your .env.local file.")
}

const config = JSON.parse(Buffer.from(process.env.LAMATIC_CONFIG_FINANCE, "base64").toString("utf8"))

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint,
  projectId: config.api.projectId,
  apiKey: config.api.apiKey,
})
