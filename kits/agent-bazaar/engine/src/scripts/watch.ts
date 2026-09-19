import { runRound } from "../orchestrator.js";

async function watch(): Promise<void> {
  console.log("=== Agent Bazaar Watch Mode ===");
  console.log("Polling every 10 seconds... Press Ctrl+C to stop.\n");

  let round = 0;
  const interval = setInterval(async () => {
    round++;
    console.log(`--- Round ${round} at ${new Date().toISOString()} ---`);

    try {
      const result = await runRound();
      console.log(
        `Processed: ${result.bountiesProcessed}, ` +
          `Settled: ${result.settlements}, ` +
          `Refunded: ${result.refunds}`,
      );
      if (result.errors.length > 0) {
        console.log(`Errors: ${result.errors.join("; ")}`);
      }
    } catch (err) {
      console.error(`Round failed: ${(err as Error).message}`);
    }
  }, 10000);

  process.on("SIGINT", () => {
    clearInterval(interval);
    console.log("\nWatch stopped.");
    process.exit(0);
  });
}

watch().catch(console.error);