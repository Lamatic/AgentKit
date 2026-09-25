import { runRound } from "../orchestrator.js";

/** Watch the market by running rounds. */
async function watch(): Promise<void> {
  console.log("=== Agent Bazaar Watch Mode ===");
  console.log("Polling every 10 seconds... Press Ctrl+C to stop.\n");

  let round = 0;
  let stopped = false;
  let inFlight: Promise<void> | null = null;

  /** tick helper. */
  async function tick(): Promise<void> {
    if (stopped) return;
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
    if (!stopped) {
      inFlight = new Promise<void>((resolve) => {
        setTimeout(() => void tick().then(resolve), 10000);
      });
    }
  }

  process.on("SIGINT", () => {
    if (stopped) process.exit(0); // second SIGINT — force exit
    stopped = true;
    console.log("\nWatch stopping after current tick...");
    void inFlight?.finally(() => process.exit(0));
  });

  inFlight = tick();
  await inFlight;
}

watch().catch(console.error);