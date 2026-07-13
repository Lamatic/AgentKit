import { NextRequest, NextResponse } from "next/server";
import { callLamaticGraphQL, isLamaticConfigured } from "../../../lib/lamatic";

const FLOW_ID = process.env.LAMATIC_FLOW_GENERATOR_ID || "";

const GRAPHQL_QUERY = `
  query ExecuteWorkflow(
    $workflowId: String!
    $prompt: String        
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: {
        prompt: $prompt
      }
    ) {
      status
      result
    }
  }
`;

function generateDemoAlert(prompt: string) {
  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10).replace(/-/g, "");
  const randId = String(Math.floor(Math.random() * 9000) + 1000);

  const templates = [
    {
      severity: "P1" as const,
      service: "payments-service",
      environment: "production",
      title: "Payments Service — Database Connection Pool Exhausted",
      description: `The payments-service has exhausted its PostgreSQL connection pool (100/100 active connections). New requests are being rejected with ECONNREFUSED. P99 latency has spiked to 8,200ms. Pods are healthy but DB connections are not being released. Triggered by: "${prompt}"`,
      affected_endpoints: [
        "/api/v1/charge",
        "/api/v1/refund",
        "/api/v1/payment-status",
      ],
      error_rate: "94.3%",
      suggested_runbook_tags: [
        "database",
        "connection-pool",
        "postgresql",
        "payments",
      ],
    },
    {
      severity: "P2" as const,
      service: "auth-api",
      environment: "production",
      title: "Auth API — Redis Session Store Unreachable",
      description: `auth-api pods cannot reach the Redis session store. Login requests are failing with "ECONNREFUSED redis:6379". Session validation is down. Error rate climbing. Triggered by: "${prompt}"`,
      affected_endpoints: [
        "/api/v1/login",
        "/api/v1/token/refresh",
        "/api/v1/logout",
      ],
      error_rate: "67.1%",
      suggested_runbook_tags: ["redis", "auth", "session", "503"],
    },
    {
      severity: "P1" as const,
      service: "order-processor",
      environment: "production",
      title: "Order Processor — CrashLoopBackOff Detected",
      description: `order-processor deployment has 0/3 pods running. All pods are in CrashLoopBackOff with exit code 137 (OOM Kill). Memory limit set to 512Mi but process is consuming 600Mi+. Triggered by: "${prompt}"`,
      affected_endpoints: [
        "/api/v1/orders",
        "/api/v1/orders/confirm",
        "/api/v1/orders/cancel",
      ],
      error_rate: "100%",
      suggested_runbook_tags: [
        "oom-kill",
        "crash-loop",
        "memory",
        "kubernetes",
        "orders",
      ],
    },
  ];

  const t = templates[Math.floor(Math.random() * templates.length)];
  return {
    alert_id: `ALT-${dateStr}-${randId}`,
    timestamp: now,
    ...t,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    if (!isLamaticConfigured() || !FLOW_ID) {
      return NextResponse.json(generateDemoAlert(prompt));
    }

    const res = await callLamaticGraphQL<{ alert?: unknown }>(
      GRAPHQL_QUERY,
      {
        workflowId: FLOW_ID,
        prompt,
      }
    );

    if (res.error) {
      // Fallback to demo alert if live flow errors
      return NextResponse.json(generateDemoAlert(prompt));
    }

    const alertResult = res.result?.alert || res.result;
    return NextResponse.json(alertResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Incident generation failed: " + msg },
      { status: 500 }
    );
  }
}
