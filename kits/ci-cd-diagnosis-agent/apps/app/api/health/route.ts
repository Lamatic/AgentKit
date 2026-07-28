import { NextResponse } from "next/server";
import { logger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  let githubStatus = "healthy";
  let lamaticStatus = "healthy";

  // 1. Probe GitHub REST API reachability
  try {
    const ghRes = await fetch("https://api.github.com/zen", {
      headers: { "User-Agent": "AgentKit-Diagnosis-HealthProbe" },
      next: { revalidate: 0 },
    });
    if (!ghRes.ok) githubStatus = "degraded";
  } catch {
    githubStatus = "unreachable";
  }

  // 2. Probe Lamatic AI Endpoint config
  const lamaticEndpoint = process.env.LAMATIC_API_URL;
  if (!lamaticEndpoint) {
    lamaticStatus = "unconfigured";
  }

  const durationMs = Date.now() - startTime;

  const healthPayload = {
    status: githubStatus === "healthy" && lamaticStatus === "healthy" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: durationMs,
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    checks: {
      githubRestApi: githubStatus,
      lamaticAiEngine: lamaticStatus,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  };

  logger.info("Health probe executed", healthPayload);

  return NextResponse.json(healthPayload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
