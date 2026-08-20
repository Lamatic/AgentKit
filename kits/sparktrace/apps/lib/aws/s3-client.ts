/**
 * SparkTrace — S3 Helper (live mode, optional in the investigation loop)
 * ------------------------------------------------------------------
 * Small utilities to peek at raw data without going through Athena —
 * useful for eyeballing a sample row or discovering partition
 * folders when the analyst needs more than schema metadata. Not part
 * of the required `QueryExecutor`/`CatalogProvider` contracts; the
 * orchestrator may call these opportunistically.
 *
 * Env vars read:
 *   - AWS_REGION   AWS region for the S3 client
 */

import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var ${name} for S3 helper.`);
  }
  return v;
}

let cachedClient: S3Client | undefined;

function getClient(): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({ region: readEnv("AWS_REGION") });
  }
  return cachedClient;
}

/**
 * Fetches up to `maxBytes` from the start of an S3 object and returns
 * it decoded as UTF-8 text. Intended for sampling small/text-ish
 * objects (CSV/JSON lines, small Parquet footers won't decode
 * meaningfully as text but the byte-range fetch itself still works).
 * Returns `null` instead of throwing if the object can't be read.
 */
export async function sampleObject(
  bucket: string,
  key: string,
  maxBytes: number = 65_536
): Promise<string | null> {
  try {
    const client = getClient();
    const res = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: `bytes=0-${Math.max(0, maxBytes - 1)}`,
      })
    );
    if (!res.Body) return null;
    // AWS SDK v3 Node runtime exposes transformToString on the body stream.
    return await res.Body.transformToString("utf-8");
  } catch {
    return null;
  }
}

/**
 * Lists "partition folders" directly under `prefix` (one level, using
 * `/` as delimiter) — i.e. the S3 equivalent of Hive-style partition
 * directories (`dt=2026-07-19/`). Returns the common-prefix strings
 * as-is (e.g. `"raw/orders/dt=2026-07-19/"`).
 */
export async function listPartitions(
  bucket: string,
  prefix: string,
  maxPartitions = 1000
): Promise<string[]> {
  const client = getClient();
  const partitions: string[] = [];
  let continuationToken: string | undefined;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix.endsWith("/") ? prefix : `${prefix}/`,
        Delimiter: "/",
        ContinuationToken: continuationToken,
      })
    );
    for (const cp of page.CommonPrefixes ?? []) {
      if (cp.Prefix) partitions.push(cp.Prefix);
    }
    if (partitions.length >= maxPartitions) {
      return partitions.slice(0, maxPartitions);
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  return partitions;
}
