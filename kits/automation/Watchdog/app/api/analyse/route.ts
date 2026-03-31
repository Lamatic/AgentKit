// import { NextRequest, NextResponse } from 'next/server'
// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";

// const EXECUTE_WORKFLOW = `
//   query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
//     executeWorkflow(
//       workflowId: $workflowId
//       payload: $payload
//     ) {
//       status
//       result
//     }
//   }
// `
// let ratelimit: Ratelimit | null = null;

// if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
//   ratelimit = new Ratelimit({
//     redis: Redis.fromEnv(),
//     limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests per minute
//     analytics: true,
//   });
// }

// const localRateLimitMap = new Map<string, { count: number; reset: number }>();

// export async function POST(req: NextRequest) {
//   try {

//     // if (APP_SECRET && authHeader !== `Bearer ${APP_SECRET}`) {
//     //   return NextResponse.json(
//     //     { error: "Unauthorized access. Bot-like behavior detected." },
//     //     { status: 401 }
//     //   );
//     // }

//     const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
//     const APP_SECRET = process.env.WATCHDOG_APP_SECRET;

//     if (!APP_SECRET && process.env.NODE_ENV === "production") {
//       return NextResponse.json({ error: "Security Configuration Error" }, { status: 500 });
//     }

//     const authHeader = req.headers.get("Authorization");
//     if (APP_SECRET && authHeader !== `Bearer ${APP_SECRET}`) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     if (ratelimit) {
//       const { success } = await ratelimit.limit(ip);
//       if (!success) {
//         return NextResponse.json({ error: "Too many requests. Please wait 60s." }, { status: 429 });
//       }
//     } else {
//       const now = Date.now();
//       const limit = localRateLimitMap.get(ip) || { count: 0, reset: now + 60000 };
      
//       if (now > limit.reset) {
//         limit.count = 1;
//         limit.reset = now + 60000;
//       } else {
//         limit.count++;
//       }
//       localRateLimitMap.set(ip, limit);
      
//       if (limit.count > 10) { // Slightly higher limit for local dev
//         return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
//       }
//     }

//     const {
//       LAMATIC_API_URL,
//       LAMATIC_API_KEY,
//       WATCHDOG_FLOW_ID,
//       LAMATIC_PROJECT_ID,
//     } = process.env;

//     // ✅ ENV VALIDATION
//     if (!LAMATIC_API_URL || !LAMATIC_API_KEY || !WATCHDOG_FLOW_ID || !LAMATIC_PROJECT_ID) {
//       console.error("Missing env vars:", {
//         hasURL: !!LAMATIC_API_URL,
//         hasKey: !!LAMATIC_API_KEY,
//         hasFlow: !!WATCHDOG_FLOW_ID,
//         hasProject: !!LAMATIC_PROJECT_ID,
//       });

//       return NextResponse.json(
//         { error: "Missing required environment variables" },
//         { status: 500 }
//       );
//     }

//     // ✅ BODY PARSE
//     let body: any;
//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json(
//         { error: 'Invalid JSON in request body' },
//         { status: 400 }
//       );
//     }

//     const competitors = Array.isArray(body?.competitors) ? body.competitors : [];

//     // ✅ VALIDATION
//     const isValid =
//       competitors.length > 0 &&
//       competitors.length <= 10 &&
//       competitors.every(
//         (c: any) =>
//           typeof c?.org_name === 'string' &&
//           c.org_name.trim() &&
//           typeof c?.url === 'string' &&
//           c.url.trim() &&
//          /^https?:\/\/.+/.test(c.url.trim())
//       );

//     if (!isValid) {
//       return NextResponse.json(
//         { error: 'Invalid competitors data. Provide 1-10 competitors with org_name and url.' },
//         { status: 400 }
//       );
//     }

//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 60000);

//     let res: Response;
//     try {
//       res = await fetch(LAMATIC_API_URL, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${LAMATIC_API_KEY}`,
//           'x-project-id': LAMATIC_PROJECT_ID,
//         },
//         body: JSON.stringify({
//           query: EXECUTE_WORKFLOW,
//           variables: {
//             workflowId: WATCHDOG_FLOW_ID,
//             payload: { competitors },
//           },
//         }),
//         signal: controller.signal,
//       });
//     } finally {
//       clearTimeout(timeoutId);
//     }

//     // ✅ HANDLE NON-200 RESPONSES
//     if (!res.ok) {
//       const errorText = await res.text();
//       return NextResponse.json(
//         { error: `Lamatic HTTP ${res.status}`, details: errorText },
//         { status: res.status }
//       );
//     }

//     // ✅ SAFE PARSE
//     let data: any;
//     try {
//       data = await res.json();
//     } catch {
//       return NextResponse.json(
//         { error: `Invalid JSON from Lamatic` },
//         { status: 500 }
//       );
//     }

//     // ✅ GRAPHQL ERROR HANDLING
//     if (data.errors) {
//       return NextResponse.json(
//         { error: data.errors[0]?.message || 'GraphQL error' },
//         { status: 500 }
//       );
//     }

//     // ✅ SAFE RESPONSE ACCESS
//     const result = data?.data?.executeWorkflow;

//     if (!result) {
//       return NextResponse.json(
//         { error: "Unexpected Lamatic response structure" },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json(result);

//   } catch (err: any) {
//     console.error('Analyze route error:', err);
//     if (err.name === 'AbortError') {
//       return NextResponse.json(
//         { error: 'Request timeout - Lamatic API did not respond in time' },
//         { status: 504 }
//       );
//     }

//     return NextResponse.json(
//       { error: err.message || 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }