type RateLimitOptions = {
  limit: number;
  windowMs: number;
  maxBuckets?: number;
};

type Bucket = {
  count: number;
  startedAt: number;
};

export function createRateLimiter({
  limit,
  windowMs,
  maxBuckets = 10_000,
}: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string, now = Date.now()) {
      const existing = buckets.get(key);
      if (!existing || now - existing.startedAt >= windowMs) {
        if (!existing && buckets.size >= maxBuckets) {
          for (const [bucketKey, bucket] of buckets) {
            if (now - bucket.startedAt >= windowMs) buckets.delete(bucketKey);
          }
          while (buckets.size >= maxBuckets) {
            const oldest = buckets.keys().next().value;
            if (oldest === undefined) break;
            buckets.delete(oldest);
          }
        }
        buckets.set(key, { count: 1, startedAt: now });
        return { allowed: true, retryAfterMs: 0 };
      }

      if (existing.count >= limit) {
        return {
          allowed: false,
          retryAfterMs: Math.max(0, windowMs - (now - existing.startedAt)),
        };
      }

      existing.count += 1;
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}
