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
