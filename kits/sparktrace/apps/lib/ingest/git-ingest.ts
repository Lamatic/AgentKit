/**
 * SparkTrace — Git Repo Ingestor (live mode)
 * ------------------------------------------------------------------
 * Implements `PipelineIngestor`: given a `repoUrl`, shallow-clones it
 * to a temp dir, collects `.py`/`.sql`/`.scala` files, and hands them
 * to `pipeline-parser.ts` to build the `PipelineContext`.
 *
 * `repoUrl` is request-supplied (untrusted): only HTTPS URLs on an
 * approved git host allowlist are accepted (see `ALLOWED_GIT_HOSTS` /
 * `validateRemoteRepoUrl`) — local filesystem paths are rejected to
 * close off SSRF and arbitrary local-file-read via this ingestor.
 *
 * No env vars required. Relies on `git` being on PATH.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

import type { FileLanguage, IngestSource, PipelineContext, PipelineFile, PipelineIngestor } from "../contracts";
import { parsePipelineContext } from "./pipeline-parser";

const execFileAsync = promisify(execFile);

/** File extensions collected as pipeline source files. */
const EXTENSION_LANGUAGE: Record<string, FileLanguage> = {
  ".py": "python",
  ".sql": "sql",
  ".scala": "scala",
};

/** Directories skipped during the file walk (build artifacts, VCS internals, envs). */
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "__pycache__",
  ".venv",
  "venv",
  ".idea",
  ".vscode",
  "dist",
  "build",
  "target",
  ".mypy_cache",
  ".pytest_cache",
]);

/** Safety bounds so a huge/unexpected repo can't blow up memory or hang the loop. */
const MAX_FILES = 500;
const MAX_FILE_BYTES = 300_000;

/**
 * Approved public git hosts for request-supplied `repoUrl`. Live ingestion
 * is restricted to HTTPS URLs on this allowlist to close off SSRF against
 * arbitrary/private network hosts. Extend deliberately.
 */
const ALLOWED_GIT_HOSTS = new Set(["github.com", "gitlab.com", "bitbucket.org"]);

/** Matches a dotted-quad IPv4 literal. */
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * True for hostnames that resolve (or are already written as) loopback,
 * private, link-local, or otherwise non-public/reserved addresses — the
 * targets an SSRF-hardened allowlist must still reject even if the host
 * string were somehow accepted.
 */
function isPrivateOrReservedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".local")) return true;
  if (lower === "0.0.0.0" || lower === "::1" || lower === "[::1]") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;

  const m = IPV4_RE.exec(lower);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // link-local
    if (a === 0) return true;
  }
  return false;
}

/**
 * Validates a request-supplied `repoUrl` before it ever reaches `git
 * clone`: must be an HTTPS URL on `ALLOWED_GIT_HOSTS`, must not resolve to
 * a private/reserved address, and must not look like a `git` CLI option
 * (a leading `-`/`--` could otherwise be parsed as a flag instead of a
 * positional argument). Local filesystem paths are not accepted for
 * request-supplied input — only `git clone` of an approved remote host is
 * permitted. Throws with a descriptive message on rejection.
 */
function validateRemoteRepoUrl(repoUrl: string): void {
  if (repoUrl.startsWith("-")) {
    throw new Error(`repoUrl "${repoUrl}" looks like a command-line option, not a URL — rejected.`);
  }

  let parsed: URL;
  try {
    parsed = new URL(repoUrl);
  } catch {
    throw new Error(
      `repoUrl "${repoUrl}" is not a valid absolute URL. Only HTTPS URLs on an approved git host ` +
        `(${[...ALLOWED_GIT_HOSTS].join(", ")}) are accepted.`
    );
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`repoUrl must use https:// (got "${parsed.protocol}").`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_GIT_HOSTS.has(hostname)) {
    throw new Error(
      `repoUrl host "${hostname}" is not an approved git host (allowed: ${[...ALLOWED_GIT_HOSTS].join(", ")}).`
    );
  }

  if (isPrivateOrReservedHost(hostname)) {
    throw new Error(`repoUrl host "${hostname}" resolves to a private/reserved address — rejected.`);
  }
}

/** Shallow-clones `repoUrl` into a fresh temp dir and returns its path. */
async function shallowClone(repoUrl: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sparktrace-ingest-"));
  try {
    // `--` terminates option parsing so a (still-rejected-by-validation,
    // but defense-in-depth) value beginning with `-` can never be parsed
    // as a git option instead of the repository argument.
    await execFileAsync("git", ["clone", "--depth", "1", "--quiet", "--", repoUrl, dir]);
  } catch (err) {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    throw new Error(
      `Failed to clone ${repoUrl}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  return dir;
}

/** Recursively walks `rootDir`, collecting matching files as `PipelineFile`s. */
async function collectFiles(rootDir: string): Promise<PipelineFile[]> {
  const files: PipelineFile[] = [];

  async function walk(dir: string): Promise<void> {
    if (files.length >= MAX_FILES) return;
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= MAX_FILES) return;
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
        await walk(path.join(dir, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      const language = EXTENSION_LANGUAGE[ext];
      if (!language) continue;

      const fullPath = path.join(dir, entry.name);
      let content: string;
      try {
        const stat = await fs.stat(fullPath);
        if (stat.size > MAX_FILE_BYTES) {
          const fh = await fs.open(fullPath, "r");
          try {
            const buf = Buffer.alloc(MAX_FILE_BYTES);
            const { bytesRead } = await fh.read(buf, 0, MAX_FILE_BYTES, 0);
            content =
              buf.subarray(0, bytesRead).toString("utf-8") +
              "\n/* ...truncated by ingest (file exceeds size cap)... */";
          } finally {
            await fh.close();
          }
        } else {
          content = await fs.readFile(fullPath, "utf-8");
        }
      } catch {
        continue;
      }

      files.push({
        path: path.relative(rootDir, fullPath).split(path.sep).join("/"),
        language,
        role: "unknown", // filled in by pipeline-parser.classifyFile
        content,
      });
    }
  }

  await walk(rootDir);
  return files;
}

export class GitPipelineIngestor implements PipelineIngestor {
  readonly mode = "live" as const;

  async ingest(source: IngestSource): Promise<PipelineContext> {
    const repoUrl = source.repoUrl;
    if (!repoUrl) {
      throw new Error(
        `git-ingest requires source.repoUrl (an HTTPS URL on an approved git host: ` +
          `${[...ALLOWED_GIT_HOSTS].join(", ")}).`
      );
    }

    // Request-supplied repoUrl is untrusted: restrict to HTTPS + an
    // approved host allowlist (SSRF/arg-injection hardening). Local
    // filesystem paths are intentionally not accepted here.
    validateRemoteRepoUrl(repoUrl);

    let tempDir: string | undefined;
    let rootDir: string;

    try {
      tempDir = await shallowClone(repoUrl);
      rootDir = tempDir;

      const files = await collectFiles(rootDir);
      return parsePipelineContext(files, repoUrl);
    } finally {
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  }
}

/** Factory the orchestrator should import for live mode. */
export function makeGitIngestor(): PipelineIngestor {
  return new GitPipelineIngestor();
}
