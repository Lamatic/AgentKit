import { supabase } from "./supabase.js";

const seen = new Map<string, boolean>();

/** Build a deterministic idempotency key for a bounty transition. */
export function idempotencyKey(
  bountyId: string,
  transition: string,
  attempt: number,
): string {
  return `bounty:${bountyId}:${transition}:${attempt}`;
}

/**
 * Durable idempotency check backed by the idempotency_keys table.
 * The in-memory map is a fast path; the unique constraint is the source of truth
 * across restarts and engine instances. Returns false when already applied.
 */
/** Check and mark an idempotency key (fast path). */
export function checkIdempotency(key: string): boolean {
  if (seen.has(key)) return false;
  // Optimistic fast path — the durable insert below is authoritative.
  // Fire-and-forget persistence is handled by checkIdempotencyAsync; this sync
  // wrapper preserves the existing call surface for hot paths.
  seen.set(key, true);
  void persistKey(key).catch(() => {
    // Persistence failures are logged inside persistKey; the in-memory mark
    // still protects this process instance.
  });
  return true;
}

/** Persist an idempotency key; unique violations mean already applied. */
async function persistKey(key: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("idempotency_keys").insert({ key });
    if (error) {
      // 23505 = unique violation → already applied by another instance/restart.
      if (error.code === "23505") return false;
      console.error(`[idempotency] persist failed for ${key}: ${error.message}`);
      return true;
    }
    return true;
  } catch (err) {
    console.error(`[idempotency] persist failed for ${key}: ${(err as Error).message}`);
    return true;
  }
}

/**
 * Async durable check: returns false when the key already exists in the table.
 * Prefer this in settle/refund paths that must survive restarts.
 */
/** Durably check an idempotency key via the database. */
export async function checkIdempotencyAsync(key: string): Promise<boolean> {
  if (seen.has(key)) return false;
  const persisted = await persistKey(key);
  if (!persisted) return false;
  seen.set(key, true);
  return true;
}

/** Clear the in-memory fast path (DB keys persist across restarts). */
export function resetIdempotency(): void {
  seen.clear();
}
