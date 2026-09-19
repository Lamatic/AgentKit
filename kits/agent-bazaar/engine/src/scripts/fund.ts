import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";

async function fund(): Promise<void> {
  console.log("=== Agent Bazaar Fund Generator ===\n");

  const privateKey = process.env.X402_PRIVATE_KEY;
  if (!privateKey) {
    console.log("No X402_PRIVATE_KEY set. Generating deterministic test wallets...\n");
  }

  const wallets = [
    { name: "Client-Prime", role: "client" },
    { name: "Summarizer-Alpha", role: "worker" },
    { name: "Researcher-Bravo", role: "worker" },
    { name: "Datagen-Charlie", role: "worker" },
  ];

  console.log("Testnet Wallet Addresses (Base Sepolia):");
  console.log("========================================");
  for (const wallet of wallets) {
    const entropy = BigInt(`0x${Buffer.from(wallet.name).toString("hex").padStart(64, "0")}`);
    const pk = `0x${entropy.toString(16).padStart(64, "0")}`;
    console.log(`${wallet.name} (${wallet.role}): ${pk.slice(0, 10)}...`);
  }

  console.log("\nTo fund these wallets, visit: https://www.alchemy.com/faucets/base-sepolia");
  console.log("Send testnet ETH to the addresses above.");
  console.log("\nNote: These are TESTNET funds only. No real value.");
}

fund().catch(console.error);
