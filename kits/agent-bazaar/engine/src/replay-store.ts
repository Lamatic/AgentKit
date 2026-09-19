import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "node:fs";
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

/** ensureDir helper. */
function ensureDir(): void {
  if (!existsSync(RECORDINGS_DIR)) {
    mkdirSync(RECORDINGS_DIR, { recursive: true });
  }
}

/** Resolve the replay recording path for a round. */
export function recordingPath(roundId: string): string {
  ensureDir();
  return join(RECORDINGS_DIR, `${roundId}.json`);
}

/** Persist flow outputs for replay mode. */
export async function recordOutputs(
  roundId: string,
  outputs: RecordedFlowOutput[],
): Promise<void> {
  const filePath = recordingPath(roundId);
  writeFileSync(filePath, JSON.stringify(outputs, null, 2), "utf8");
}

/** Load the most recent replay recording. */
export async function loadLatestRecording(): Promise<RecordedFlowOutput[] | null> {
  ensureDir();
  const files = readdirSync(RECORDINGS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => statSync(join(RECORDINGS_DIR, b)).mtimeMs - statSync(join(RECORDINGS_DIR, a)).mtimeMs);

  if (files.length === 0) return null;

  try {
    const content = readFileSync(join(RECORDINGS_DIR, files[0]), "utf8");
    return JSON.parse(content) as RecordedFlowOutput[];
  } catch (err) {
    console.error(`[replay] failed to load recording ${files[0]}: ${(err as Error).message}`);
    return null;
  }
}

/** Load a replay recording by round id. */
export async function loadRecording(roundId: string): Promise<RecordedFlowOutput[] | null> {
  const filePath = recordingPath(roundId);
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf8");
  return JSON.parse(content) as RecordedFlowOutput[];
}
