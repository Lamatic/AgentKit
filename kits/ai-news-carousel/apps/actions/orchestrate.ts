'use server';

import { Redis } from '@upstash/redis';
import { revalidatePath } from 'next/cache';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL!,
  token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN!,
});

export type SlideAsset = {
  slideNumber: number;
  role: string;
  headline: string;
  body: string;
  imageUrl: string | null;
  imageSource: string | null;
  imageAttribution: string | null;
};

export type Digest = {
  id: string;
  title: string;
  org: string;
  link: string;
  sourceType: string;
  justification: string;
  corroborated: boolean;
  slides: SlideAsset[];
  caption: string;
  hashtags: string[];
  publishedAt: string;
  status: string;
};

/**
 * Retrieves all digests currently awaiting human review from Redis.
 */
export async function getPendingDigests(): Promise<Digest[]> {
  const ids = await redis.lrange<string>('digest:index', 0, 49);
  if (!ids || ids.length === 0) return [];

  const raw = await Promise.all(ids.map((id) => redis.get<string>(`digest:${id}`)));
  const digests: Digest[] = raw
    .filter((r): r is string => !!r)
    .map((r) => (typeof r === 'string' ? JSON.parse(r) : r))
    .filter((d: Digest) => d.status === 'ready_for_review');

  return digests;
}

/**
 * Updates a digest's status (posted or skipped) after a human reviews it,
 * and revalidates the dashboard page to reflect the change.
 */
export async function markDigestStatus(digestId: string, status: 'posted' | 'skipped') {
  const raw = await redis.get<string>(`digest:${digestId}`);
  if (!raw) return;
  const digest = typeof raw === 'string' ? JSON.parse(raw) : raw;
  digest.status = status;
  digest.postedAt = status === 'posted' ? new Date().toISOString() : null;
  await redis.set(`digest:${digestId}`, JSON.stringify(digest));
  revalidatePath('/');
}
