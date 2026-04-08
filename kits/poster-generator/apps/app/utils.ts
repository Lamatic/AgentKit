import "server-only"

import { z } from "zod"

const envSchema = z.object({
  LAMATIC_PROJECT_ENDPOINT: z.string().url(),
  LAMATIC_PROJECT_ID: z.string().min(1),
  LAMATIC_PROJECT_API_KEY: z.string().min(1),
  LAMATIC_FLOW_ID: z.string().min(1),
})

export const lamaticEnv = envSchema.parse({
  LAMATIC_PROJECT_ENDPOINT: process.env.LAMATIC_PROJECT_ENDPOINT,
  LAMATIC_PROJECT_ID: process.env.LAMATIC_PROJECT_ID,
  LAMATIC_PROJECT_API_KEY: process.env.LAMATIC_PROJECT_API_KEY,
  LAMATIC_FLOW_ID: process.env.LAMATIC_FLOW_ID,
})