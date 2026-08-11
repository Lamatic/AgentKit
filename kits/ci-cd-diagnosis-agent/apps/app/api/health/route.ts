import { NextResponse } from "next/server";
import { logger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  let githubStatus = "healthy";
  let lamaticStatus = "healthy";

  // 1. Probe GitHub REST API reachability (with 3s timeout to prevent hanging)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const ghRes = await fetch("https://api.github.com/zen", {
      headers: { "User-Agent": "AgentKit-Diagnosis-HealthProbe" },
      next: { revalidate: 0 },
      signal: controller.signal,
    });
    if (ghRes.ok) {
      await ghRes.text(); // Consume body to release sockets
    } else {
      await ghRes.text().catch(() => {}); // Consume or discard non-ok body to prevent socket leak
      githubStatus = "degraded";
    }
  } catch (err) {
    githubStatus = err instanceof Error && err.name === "AbortError" ? "timeout" : "unreachable";
  } finally {
    clearTimeout(timeoutId);
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
