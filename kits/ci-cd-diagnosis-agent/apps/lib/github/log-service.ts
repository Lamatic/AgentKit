import * as fflate from "fflate";
import { truncateLog } from "@/lib/utils";

export interface LogExtractionResult {
  cleanedLog: string;
  fileCount: number;
  failingStepName?: string;
}

/**
 * Downloads workflow logs ZIP archive from GitHub API as an ArrayBuffer in RAM
 */
export async function fetchRunLogsZipBuffer(
  accessToken: string,
  owner: string,
  repo: string,
  runId: number
): Promise<ArrayBuffer | { error: string; status: number }> {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/logs`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "AgentKit-CICD-Diagnoser",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 410) {
        return {
          error: "Workflow logs for this run have expired or been deleted by GitHub (GitHub retains logs for 90 days maximum). Please select a recent failed run or paste the log manually.",
          status: response.status,
        };
      }
      return {
        error: `GitHub log download failed (${response.status}): Workflow logs may have expired or been purged.`,
        status: response.status,
      };
    }

    const zipBuffer = await response.arrayBuffer();
    return zipBuffer;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error downloading logs archive";
    return { error: message, status: 500 };
  }
}

/**
 * Extracts ZIP archive in RAM using fflate, normalizes ANSI color codes, cleans noise, and sanitizes secrets.
 */
export function extractAndNormalizeLogs(zipBuffer: ArrayBuffer): LogExtractionResult {
  const bytes = new Uint8Array(zipBuffer);
  let unzipped: Record<string, Uint8Array>;

  try {
    unzipped = fflate.unzipSync(bytes);
  } catch {
    // If fflate fails, fallback to treating the buffer as raw text if possible
    const rawText = new TextDecoder("utf-8").decode(bytes);
    return {
      cleanedLog: sanitizeAndCleanText(rawText),
      fileCount: 1,
    };
  }

  const fileKeys = Object.keys(unzipped);
  if (fileKeys.length === 0) {
    return {
      cleanedLog: "Empty log archive received from GitHub Actions.",
      fileCount: 0,
    };
  }

  const textDecoder = new TextDecoder("utf-8");
  const extractedFiles: { fileName: string; text: string; isFailure: boolean }[] = [];

  // Parse each text log file in the zip
  for (const fileName of fileKeys) {
    // Ignore non-text files or directories
    if (fileName.endsWith("/") || !unzipped[fileName]) continue;

    const fileContent = textDecoder.decode(unzipped[fileName]);

    // Detect if this specific step file contains failure indicators
    const isFailure =
      fileContent.includes("##[error]") ||
      fileContent.includes("exit code 1") ||
      fileContent.includes("exit code 137") ||
      fileContent.includes("FATAL ERROR") ||
      fileContent.includes("Killed") ||
      /Process completed with exit code [1-9]/.test(fileContent);

    extractedFiles.push({
      fileName,
      text: fileContent,
      isFailure,
    });
  }

  // Prioritize failing step files first
  const failingFiles = extractedFiles.filter((f) => f.isFailure);
  const targetFiles = failingFiles.length > 0 ? failingFiles : extractedFiles;

  let mergedRawText = targetFiles.map((f) => `=== LOG FILE: ${f.fileName} ===\n${f.text}`).join("\n\n");
  const failingStepName = failingFiles.length > 0 ? failingFiles[0].fileName : undefined;

  // Clean, normalize, sanitize, and clip log
  const cleanedLog = sanitizeAndCleanText(mergedRawText);

  return {
    cleanedLog,
    fileCount: extractedFiles.length,
    failingStepName,
  };
}

/**
 * Normalizes log format:
 * 1. Strips ANSI color escape codes (\u001b[...m)
 * 2. Redacts secrets (AWS Keys, GitHub PATs, Bearer tokens)
 * 3. Removes terminal progress bars and excessive empty lines
 * 4. Truncates tail locus to fit token context window
 */
export function sanitizeAndCleanText(raw: string): string {
  if (!raw) return "";

  let cleaned = raw;

  // 1. Strip ANSI escape sequences (terminal color codes)
  cleaned = cleaned.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");
  cleaned = cleaned.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");

  // 2. Secret Redaction
  cleaned = cleaned.replace(/(AKIA|A3T[A-Z0-9]|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, "[REDACTED_AWS_KEY]");
  cleaned = cleaned.replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED_GITHUB_TOKEN]");
  cleaned = cleaned.replace(/github_pat_[a-zA-Z0-9_]{82}/g, "[REDACTED_GITHUB_PAT]");
  cleaned = cleaned.replace(/Bearer\s+[a-zA-Z0-9\-\._~\+\/]+=*/g, "Bearer [REDACTED_BEARER_TOKEN]");

  // 3. Remove progress bar spinner noise
  cleaned = cleaned.replace(/\[[=->\s]{5,}\]\s*\d+%/g, "");
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 4. Collapse duplicate blank lines (max 2 consecutive newlines)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // 5. Truncate using existing utility (preserves tail 10k characters)
  return truncateLog(cleaned.trim());
}
