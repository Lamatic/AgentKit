import { postBounty, type PostBountyOutput } from "../flows-client.js";

export interface ClientAgent {
  id: string;
  name: string;
  postBounty(goal: string, budget: number): Promise<PostBountyOutput>;
}

/** Create the client agent definition. */
export function createClientAgent(id: string, name: string): ClientAgent {
  return {
    id,
    name,
    async postBounty(goal: string, budget: number) {
      return postBounty({ goal, budget });
    },
  };
}
