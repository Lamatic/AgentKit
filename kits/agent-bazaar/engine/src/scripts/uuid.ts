/** Generate a deterministic UUID from a seed string. */
export function deterministicUUID(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `${hex}-0000-4000-8000-000000000000`;
}

import { privateKeyToAccount } from "viem/accounts";

/**
 * Derive the deterministic display wallet for a named agent from the shared
 * `wallet-<name>` identifier. Used by both seed.ts (stored wallet_address)
 * and fund.ts (printed addresses) so they always match.
 */
export function workerWalletAddress(name: string): `0x${string}` {
  const entropy = BigInt(`0x${Buffer.from(`wallet-${name}`).toString("hex").padStart(64, "0")}`);
  const pk = `0x${entropy.toString(16).padStart(64, "0")}` as `0x${string}`;
  return privateKeyToAccount(pk).address;
}