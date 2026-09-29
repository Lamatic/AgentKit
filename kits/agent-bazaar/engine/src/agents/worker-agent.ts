import { generateBid, type GenerateBidOutput } from "../flows-client.js";

export interface WorkerAgent {
  id: string;
  name: string;
  specialty: string;
  reputation: number;
  balance: number;
  bid(
    bounty: Record<string, unknown>,
    openBids: Record<string, unknown>,
  ): Promise<GenerateBidOutput>;
}

/** Sync an in-memory worker's reputation with the recorded value.
 * A persisted reputation of 0 is valid — fall back to 0.5 only for
 * non-finite values. Keeps bid generation from pricing off stale data. */
export function syncWorkerReputation(worker: WorkerAgent, recorded: unknown): void {
  const parsed = Number(recorded);
  worker.reputation = Number.isFinite(parsed) ? parsed : 0.5;
}

/** Create a worker agent definition. */
export function createWorkerAgent(
  id: string,
  name: string,
  specialty: string,
): WorkerAgent {
  return {
    id,
    name,
    specialty,
    reputation: 0.5,
    balance: 10000,
    async bid(
      bounty: Record<string, unknown>,
      openBids: Record<string, unknown>,
    ) {
      return generateBid({
        bounty,
        agentProfile: {
          id,
          name,
          specialty,
          reputation: this.reputation,
        },
        openBids,
      });
    },
  };
}
