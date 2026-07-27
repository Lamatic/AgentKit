/**
 * SparkTrace — Git Repo Ingestor (live mode)
 * ------------------------------------------------------------------
 * Implements `PipelineIngestor`: given a `repoUrl`, shallow-clones it
 * to a temp dir (or, if `repoUrl` is a local filesystem path, reads
 * it directly), collects `.py`/`.sql`/`.scala` files, and hands them
 * to `pipeline-parser.ts` to build the `PipelineContext`.
 *
 * No env vars required. Relies on `git` being on PATH for remote
 * URLs; local paths need no git at all.
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

function looksLikeRemoteUrl(source: string): boolean {
  return (
    /^https?:\/\//i.test(source) ||
    /^git@/i.test(source) ||
    /\.git$/i.test(source) ||
    /^ssh:\/\//i.test(source)
  );
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Shallow-clones `repoUrl` into a fresh temp dir and returns its path. */
async function shallowClone(repoUrl: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sparktrace-ingest-"));
  try {
    await execFileAsync("git", ["clone", "--depth", "1", "--quiet", repoUrl, dir]);
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
          const buf = Buffer.alloc(MAX_FILE_BYTES);
          await fh.read(buf, 0, MAX_FILE_BYTES, 0);
          await fh.close();
          content = buf.toString("utf-8") + "\n/* ...truncated by ingest (file exceeds size cap)... */";
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
      throw new Error("git-ingest requires source.repoUrl (a git URL or a local filesystem path).");
    }

    let tempDir: string | undefined;
    let rootDir: string;

    try {
      if (looksLikeRemoteUrl(repoUrl)) {
        tempDir = await shallowClone(repoUrl);
        rootDir = tempDir;
      } else if (await pathExists(repoUrl)) {
        rootDir = repoUrl;
      } else {
        throw new Error(`repoUrl "${repoUrl}" is neither a recognized git URL nor an existing local path.`);
      }

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
