import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL!,
  token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN!,
});

/**
 * Receives a completed digest from the orchestrator's webhook, validates
 * the shared secret, and stores it in Redis as ready for human review.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('X-Ingest-Secret');
  if (secret !== process.env.INGEST_SHARED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const digest = await req.json();
  if (!digest.id) {
    return NextResponse.json({ error: 'Missing digest id' }, { status: 400 });
  }

  const record = { ...digest, status: 'ready_for_review', postedAt: null };
  await redis.set(`digest:${digest.id}`, JSON.stringify(record));
  await redis.lpush('digest:index', digest.id);

  return NextResponse.json({ success: true, id: digest.id });
}
