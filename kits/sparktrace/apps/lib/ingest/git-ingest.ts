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
 *
 * Rejection messages never echo the raw input: the API route forwards them
 * verbatim to the client and to server logs, so interpolating a URL that
 * carried `user:token@` would reproduce that credential in both places.
 * Post-parse messages quote only the offending component (the protocol or
 * the hostname), which is credential-free by construction.
 */
function validateRemoteRepoUrl(repoUrl: string): void {
  if (repoUrl.startsWith("-")) {
    throw new Error("repoUrl looks like a command-line option, not a URL — rejected.");
  }

  let parsed: URL;
  try {
    parsed = new URL(repoUrl);
  } catch {
    throw new Error(
      `repoUrl is not a valid absolute URL. Only HTTPS URLs on an approved git host ` +
        `(${[...ALLOWED_GIT_HOSTS].join(", ")}) are accepted.`
    );
  }

  // Embedded credentials (`https://user:token@github.com/...`) would sail
  // through the host allowlist and then be handed straight to `git clone`,
  // which authenticates with them. Reject before host validation so such a
  // URL is never treated as an approved-host request at all.
  if (parsed.username !== "" || parsed.password !== "") {
    throw new Error("repoUrl must not embed credentials (user:password@host) — rejected.");
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

/**
 * Credential-free label for an untrusted `repoUrl`, for use in messages
 * that reach the client and the server log. Falls back to a constant
 * rather than echoing input that failed to parse.
 */
function safeUrlLabel(repoUrl: string): string {
  try {
    const { origin, pathname } = new URL(repoUrl);
    return `${origin}${pathname}`;
  } catch {
    return "the requested repository";
  }
}

/**
 * Wall-clock cap on `git clone`. The API route holds the SSE stream open
 * for the whole ingest, so an unresponsive remote would otherwise pin a
 * request indefinitely.
 */
const CLONE_TIMEOUT_MS = 60_000;

/** Shallow-clones `repoUrl` into a fresh temp dir and returns its path. */
async function shallowClone(repoUrl: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sparktrace-ingest-"));
  try {
    // `--` terminates option parsing so a (still-rejected-by-validation,
    // but defense-in-depth) value beginning with `-` can never be parsed
    // as a git option instead of the repository argument.
    await execFileAsync("git", ["clone", "--depth", "1", "--quiet", "--", repoUrl, dir], {
      // SIGKILL rather than the default SIGTERM: git spawns helper
      // processes that can ignore a polite terminate and keep the handle.
      timeout: CLONE_TIMEOUT_MS,
      killSignal: "SIGKILL",
      // Without these, a private/nonexistent repo makes git block forever
      // on an interactive credential prompt reading a stdin that never
      // answers — turning an auth failure into a hung request.
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GIT_ASKPASS: "echo",
        GCM_INTERACTIVE: "never",
      },
    });
  } catch (err) {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    // Identify the repo by origin only — this message reaches the client
    // and the server log, and the raw URL is untrusted request input.
    const safeTarget = safeUrlLabel(repoUrl);
    const timedOut =
      typeof err === "object" && err !== null && (err as { killed?: boolean }).killed === true;
    if (timedOut) {
      throw new Error(
        `Timed out cloning ${safeTarget} after ${CLONE_TIMEOUT_MS / 1000}s — the remote was unreachable or too slow.`
      );
    }
    // git echoes the full command line (and therefore the raw URL) in its
    // failure message, so redact it there too before it is surfaced.
    const detail = (err instanceof Error ? err.message : String(err)).split(repoUrl).join(safeTarget);
    throw new Error(`Failed to clone ${safeTarget}: ${detail}`);
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
