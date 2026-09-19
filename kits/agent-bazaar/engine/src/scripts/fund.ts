import { workerWalletAddress } from "./uuid.js";

/** Print deterministic testnet wallet addresses. */
async function fund(): Promise<void> {
  console.log("=== Agent Bazaar Fund Generator ===\n");

  const privateKey = process.env.X402_PRIVATE_KEY;
  if (!privateKey) {
    console.log("No X402_PRIVATE_KEY set. Generating deterministic test wallets...\n");
  }

  const wallets = [
    { name: "Client-Alpha", role: "client" },
    { name: "Summarizer-Alpha", role: "worker" },
    { name: "Researcher-Bravo", role: "worker" },
    { name: "Datagen-Charlie", role: "worker" },
  ];

  console.log("Testnet Wallet Addresses (Base Sepolia):");
  console.log("========================================");
  for (const wallet of wallets) {
    console.log(`${wallet.name} (${wallet.role}): ${workerWalletAddress(wallet.name)}`);
  }

  console.log("\nTo fund these wallets, visit: https://www.alchemy.com/faucets/base-sepolia");
  console.log("Send testnet ETH to the addresses above.");
  console.log("\nNote: These are TESTNET funds only. No real value.");
}

fund().catch(console.error);
