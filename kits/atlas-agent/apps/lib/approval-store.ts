import { Redis } from "@upstash/redis";
import type { ApprovalRecord } from "@/lib/approval-token";

export interface ApprovalStore {
  createApproval(record: ApprovalRecord): Promise<void>;
  getApproval(nonce: string): Promise<ApprovalRecord | null>;
  consumeApproval(nonce: string, now?: number): Promise<ApprovalRecord>;
}

export class ApprovalAlreadyUsedError extends Error {
  constructor() {
    super("Approval token has already been used.");
  }
}

export class ApprovalNotFoundError extends Error {
  constructor() {
    super("Approval record was not found.");
  }
}

const CONSUME_SCRIPT = `
local value = redis.call("GET", KEYS[1])
if value then
  redis.call("DEL", KEYS[1])
  redis.call("SET", KEYS[2], "1", "PX", ARGV[1])
  return {1, value}
end
if redis.call("EXISTS", KEYS[2]) == 1 then
  return {2, ""}
end
return {0, ""}
`;

function approvalKey(nonce: string) {
  return `atlas:approval:${nonce}`;
}

function consumedKey(nonce: string) {
  return `atlas:approval-consumed:${nonce}`;
}

function parseRecord(value: unknown): ApprovalRecord {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!parsed || typeof parsed !== "object") throw new ApprovalNotFoundError();
  return parsed as ApprovalRecord;
}

export class RedisApprovalStore implements ApprovalStore {
  constructor(private readonly redis: Redis) {}

  async createApproval(record: ApprovalRecord): Promise<void> {
    const ttl = record.expiresAt - Date.now();
    if (ttl <= 0) throw new Error("Approval token has expired");
    const created = await this.redis.set(approvalKey(record.nonce), JSON.stringify(record), { nx: true, px: ttl });
    if (created !== "OK") throw new Error("Approval record could not be created");
  }

  async getApproval(nonce: string): Promise<ApprovalRecord | null> {
    const value = await this.redis.get(approvalKey(nonce));
    return value === null ? null : parseRecord(value);
  }

  async consumeApproval(nonce: string, now = Date.now()): Promise<ApprovalRecord> {
    const markerTtl = 5 * 60 * 1000;
    const result = await this.redis.eval<[number], [number, unknown]>(
      CONSUME_SCRIPT,
      [approvalKey(nonce), consumedKey(nonce)],
      [markerTtl]
    );
    const [status, value] = result;
    if (status === 2) throw new ApprovalAlreadyUsedError();
    if (status !== 1) throw new ApprovalNotFoundError();
    const record = parseRecord(value);
    if (now >= record.expiresAt) throw new Error("Approval token has expired");
    return { ...record, consumedAt: now };
  }
}

export function getApprovalStore(): ApprovalStore {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Missing durable approval store configuration");
  return new RedisApprovalStore(new Redis({ url, token }));
}
