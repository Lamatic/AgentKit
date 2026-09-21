import { supabase } from "./supabase.js";

// Bounded fast path: evict the oldest insertion-ordered entries past the cap
// so long-lived processes cannot grow memory without bound. Eviction can only
// re-admit a duplicate check in-process; the durable table below stays the
// source of truth.
const MAX_SEEN = 1000;
const seen = new Map<string, boolean>();

/** Mark a key seen, evicting the oldest entry past the cap. */
function markSeen(key: string): void {
  if (seen.size >= MAX_SEEN) {
    const oldest = seen.keys().next().value;
    if (oldest !== undefined) seen.delete(oldest);
  }
  seen.set(key, true);
}

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

/** Persist an idempotency key; unique violations mean already applied. */
async function persistKey(key: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("idempotency_keys").insert({ key });
    if (error) {
      // 23505 = unique violation → already applied by another instance/restart.
      if (error.code === "23505") return false;
      throw new Error(`[idempotency] persist failed for ${key}: ${error.message}`);
    }
    return true;
  } catch (err) {
    // A 23505 mapped above already returned false; anything else means the
    // durable write is unknown — callers must not markSeen or proceed.
    if ((err as { code?: string })?.code === "23505") return false;
    if ((err as Error)?.message?.startsWith("[idempotency] persist failed")) throw err;
    throw new Error(`[idempotency] persist failed for ${key}: ${(err as Error).message}`);
  }
}

/**
 * Async durable check: returns false when the key already exists in the table.
 * Prefer this in settle/refund paths that must survive restarts.
 */
/** Durably check an idempotency key via the database. */
export async function checkIdempotencyAsync(key: string): Promise<boolean> {
  if (pendingRelease.has(key)) {
    // A previous release never reached the table: retry it now. Success
    // unmarks the key everywhere and the claim below proceeds; another
    // failure keeps it applied.
    const { error } = await supabase.from("idempotency_keys").delete().eq("key", key);
    if (error) {
      console.error(`[idempotency] pending release retry failed for ${key}: ${error.message}`);
      return false;
    }
    pendingRelease.delete(key);
    seen.delete(key);
  }
  if (seen.has(key)) return false;
  const persisted = await persistKey(key);
  if (!persisted) return false;
  markSeen(key);
  return true;
}

/** Clear the in-memory fast path (DB keys persist across restarts). */
export function resetIdempotency(): void {
  seen.clear();
  pendingRelease.clear();
}

// Keys whose durable deletion failed: the in-memory mark stays (safe: the
// table still holds the key), and the next claim for the key retries the
// deletion first so a failed release never permanently blocks retry.
const pendingRelease = new Set<string>();

/**
 * Release a key so a later round can retry after a failed attempt. Safe
 * because the escrow locked -> settled/refunded claim still guards against
 * double-processing; the key only suppresses duplicate submissions.
 */
export async function releaseIdempotency(key: string): Promise<void> {
  seen.delete(key);
  const { error } = await supabase.from("idempotency_keys").delete().eq("key", key);
  if (error) {
    // Durable deletion failed: re-mark in-memory (the table still holds the
    // key, so staying applied is the safe side) and record a pending release
    // that the next claim for this key will retry.
    console.error(`[idempotency] release failed for ${key}: ${error.message} — will retry on next claim`);
    markSeen(key);
    pendingRelease.add(key);
  }
}
