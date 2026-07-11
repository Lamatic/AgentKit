import { Lamatic } from "lamatic"

const required = ["LAMATIC_API_URL", "LAMATIC_PROJECT_ID", "LAMATIC_API_KEY", "LAMATIC_FLOW_ID"] as const

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `Missing environment variable: ${key}. Copy .env.example to .env.local and fill it in.`
    )
  }
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL ?? "",
  projectId: process.env.LAMATIC_PROJECT_ID ?? "",
  apiKey: process.env.LAMATIC_API_KEY ?? "",
})

export const FLOW_ID = process.env.LAMATIC_FLOW_ID as string
