import "dotenv/config";
import { pathToFileURL } from "node:url";
import { supabase } from "../supabase.js";
import { seed } from "./seed.js";

const ALL_ZERO = "00000000-0000-0000-0000-000000000000";

/**
 * Deletes every row in the economy in FK-safe order. Used by the engine's
 * Reset endpoint and the `reset` CLI. Not part of the state machine.
 */
/** Clear all marketplace tables (destructive). */
export async function clearAll(): Promise<void> {
  const tables = [
    "settlement_receipts",
    "qa_verdicts",
    "credit_ledger",
    "deliveries",
    "escrows",
    "bids",
    "bounties",
    "agents",
  ];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", ALL_ZERO);
    if (error) throw new Error(`clearAll(${table}): ${error.message}`);
  }
  // idempotency_keys is keyed by key, not id — clear it so reset rounds never
  // inherit consumed keys.
  const { error: idemError } = await supabase.from("idempotency_keys").delete().neq("key", ALL_ZERO);
  if (idemError) throw new Error(`clearAll(idempotency_keys): ${idemError.message}`);
}

export interface ResetOptions {
  reseed?: boolean;
}

/**
 * Clears the economy and, by default, restores the deterministic settled
 * history so the dashboard is never empty.
 */
/** Clear and optionally reseed the economy. */
export async function resetEconomy(opts: ResetOptions = {}): Promise<void> {
  const reseed = opts.reseed ?? true;
  await clearAll();
  if (reseed) await seed();
}

const isEntry =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  if (process.env.AGENT_BAZAAR_ALLOW_DESTRUCTIVE !== "true") {
    console.error(
      "Refusing to reset economy: set AGENT_BAZAAR_ALLOW_DESTRUCTIVE=true to opt in.",
    );
    process.exitCode = 1;
  } else {
    resetEconomy()
      .then(() => console.log("Economy reset and reseeded."))
      .catch((err) => {
        console.error(err);
        process.exitCode = 1;
      });
  }
}
