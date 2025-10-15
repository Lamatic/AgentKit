import { Lamatic } from "lamatic"
import config from "@/lamatic-config.json"

if (!process.env.LAMATIC_API_KEY) {
  throw new Error("LAMATIC_API_KEY environment variable is not set")
}

export const lamaticClient = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY,
  endpoint: config.api.endpoint,
  projectId: config.api.projectId,
})
