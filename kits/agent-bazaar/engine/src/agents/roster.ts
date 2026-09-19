import { deterministicUUID } from "../scripts/uuid.js";
import { createWorkerAgent } from "./worker-agent.js";
import type { WorkerAgent } from "./worker-agent.js";

function agentId(name: string): string {
  return deterministicUUID(`agent-${name.toLowerCase()}`);
}

/**
 * The dedicated poster agent. It is intentionally NOT part of ROSTER so it can
 * never bid on its own bounties (constitution: no self-dealing). Human-entered
 * tasks are posted by this agent, which lets all three workers compete.
 */
export const CLIENT_AGENT = {
  id: agentId("Client-Alpha"),
  name: "Client-Alpha",
  specialty: "client",
  wallet: "0xc11e17a1c11e17a1c11e17a1c11e17a1c11e17a1",
};

export const ROSTER: WorkerAgent[] = [
  createWorkerAgent(agentId("Summarizer-Alpha"), "Summarizer-Alpha", "summarizer"),
  createWorkerAgent(agentId("Researcher-Bravo"), "Researcher-Bravo", "researcher"),
  createWorkerAgent(agentId("Datagen-Charlie"), "Datagen-Charlie", "datagen"),
];

export function getWorker(id: string): WorkerAgent | undefined {
  return ROSTER.find((w) => w.id === id);
}

export function getWorkersBySpecialty(specialty: string): WorkerAgent[] {
  return ROSTER.filter((w) => w.specialty === specialty);
}
