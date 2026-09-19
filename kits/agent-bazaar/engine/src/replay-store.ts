import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECORDINGS_DIR = join(__dirname, "..", "replay", "recordings");

export interface RecordedFlowOutput {
  flowId: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  recordedAt: string;
  roundId: string;
}

function ensureDir(): void {
  if (!existsSync(RECORDINGS_DIR)) {
    mkdirSync(RECORDINGS_DIR, { recursive: true });
  }
}

export function recordingPath(roundId: string): string {
  ensureDir();
  return join(RECORDINGS_DIR, `${roundId}.json`);
}

export async function recordOutputs(
  roundId: string,
  outputs: RecordedFlowOutput[],
): Promise<void> {
  const filePath = recordingPath(roundId);
  writeFileSync(filePath, JSON.stringify(outputs, null, 2), "utf8");
}

export async function loadLatestRecording(): Promise<RecordedFlowOutput[] | null> {
  ensureDir();
  const files = readdirSync(RECORDINGS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  const content = readFileSync(join(RECORDINGS_DIR, files[0]), "utf8");
  return JSON.parse(content) as RecordedFlowOutput[];
}

export async function loadRecording(roundId: string): Promise<RecordedFlowOutput[] | null> {
  const filePath = recordingPath(roundId);
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf8");
  return JSON.parse(content) as RecordedFlowOutput[];
}
