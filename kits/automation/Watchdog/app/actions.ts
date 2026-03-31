"use server";

import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. Initialize Rate Limiter
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
  });
}

export async function analyzeCompetitorsAction(competitors: any[]) {
  try {
    // 2. 🛡️ Security Check: Rate Limiting
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";

    if (ratelimit) {
      const { success } = await ratelimit.limit(ip);
      if (!success) throw new Error("Too many requests. Please wait 60 seconds.");
    }

    const {
      LAMATIC_API_URL,
      LAMATIC_API_KEY,
      WATCHDOG_FLOW_ID,
      LAMATIC_PROJECT_ID,
    } = process.env;

    if (!LAMATIC_API_URL || !LAMATIC_API_KEY || !WATCHDOG_FLOW_ID || !LAMATIC_PROJECT_ID) {
      throw new Error("Server configuration error: Missing environment variables.");
    }

    const EXECUTE_WORKFLOW = `
      query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
        executeWorkflow(workflowId: $workflowId, payload: $payload) {
          status
          result
        }
      }
    `;

    // 3. 🚀 Secure Fetch: Performed entirely on the server
    const res = await fetch(LAMATIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LAMATIC_API_KEY}`,
        'x-project-id': LAMATIC_PROJECT_ID,
      },
      body: JSON.stringify({
        query: EXECUTE_WORKFLOW,
        variables: {
          workflowId: WATCHDOG_FLOW_ID,
          payload: { competitors },
        },
      }),
    });

    if (!res.ok) throw new Error(`Lamatic Error: ${res.status}`);
    
    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0]?.message || "GraphQL Error");

    return data?.data?.executeWorkflow; 

  } catch (error: any) {
    throw new Error(error.message || "An unexpected error occurred");
  }
}