import { CLIENT_AGENT, ROSTER } from "../agents/roster.js";
import { workerWalletAddress } from "./uuid.js";

/** Print deterministic testnet wallet addresses. */
async function fund(): Promise<void> {
  console.log("=== Agent Bazaar Fund Generator ===\n");

  const privateKey = process.env.X402_PRIVATE_KEY;
  if (!privateKey) {
    console.log("No X402_PRIVATE_KEY set. Generating deterministic test wallets...\n");
  }

  // The client entry uses the wallet seed.ts persists (CLIENT_AGENT.wallet),
  // not a derived address, so funded funds land where the engine looks.
  // Worker entries derive from the ROSTER source so names never drift.
  const wallets = [
    { name: CLIENT_AGENT.name, role: "client", address: CLIENT_AGENT.wallet },
    ...ROSTER.map((w) => ({ name: w.name, role: "worker", address: workerWalletAddress(w.name) })),
  ];

  console.log("Testnet Wallet Addresses (Base Sepolia):");
  console.log("========================================");
  for (const wallet of wallets) {
    console.log(`${wallet.name} (${wallet.role}): ${wallet.address}`);
  }

  console.log("\nTo fund these wallets, visit: https://www.alchemy.com/faucets/base-sepolia");
  console.log("Send testnet ETH to the addresses above.");
  console.log("\nNote: These are TESTNET funds only. No real value.");
}

fund().catch(console.error);
