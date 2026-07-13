import { isIP } from "node:net";
import { isTruthyEnvValue } from "./env.js";

const rateLimitWindowMs = 60000;
const maxRequestsPerWindow = 20;
const maxRateLimitBuckets = 500;
const rateLimitBuckets = new Map();

export function checkAuditRateLimit(request) {
  const key = getClientKey(request);
  if (!key) {
    return { allowed: false, retryAfterSeconds: 60, reason: "missing-client-key" };
  }

  const now = Date.now();
  cleanupRateLimitBuckets(now);
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    evictOldestRateLimitBuckets();
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= maxRequestsPerWindow) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetAuditRateLimitForTests() {
  rateLimitBuckets.clear();
}

function getClientKey(request) {
  if (!isTruthyEnvValue(process.env.TRUST_PROXY_HEADERS)) {
    return "local";
  }

  const realIp = getSingleIpHeaderValue(request.headers.get("x-real-ip"));
  if (realIp) {
    return realIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return "";
  }

  const chain = forwardedFor.split(",").map((value) => value.trim()).filter(Boolean);
  return chain.length === 1 ? getSingleIpHeaderValue(chain[0]) : "";
}

function getSingleIpHeaderValue(value) {
  const trimmed = String(value || "").trim();
  return trimmed && !trimmed.includes(",") && isIP(trimmed) ? trimmed : "";
}

function cleanupRateLimitBuckets(now) {
  for (const [key, bucket] of rateLimitBuckets) {
    if (now >= bucket.resetAt) {
      rateLimitBuckets.delete(key);
    }
  }
}

function evictOldestRateLimitBuckets() {
  while (rateLimitBuckets.size > maxRateLimitBuckets) {
    let oldestKey = "";
    let oldestResetAt = Infinity;
    for (const [key, bucket] of rateLimitBuckets) {
      if (bucket.resetAt < oldestResetAt) {
        oldestKey = key;
        oldestResetAt = bucket.resetAt;
      }
    }
    if (!oldestKey) {
      return;
    }
    rateLimitBuckets.delete(oldestKey);
  }
}
