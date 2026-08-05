import JSZip from "jszip";

import { redactSecrets } from "@/lib/secret-redactor";
import type {
  ExportedFile,
  ExportedWorkflow,
} from "@/types/changegraph";

const MAX_ARCHIVE_BYTES = 10 * 1024 * 1024;
const MAX_FILE_COUNT = 300;
const MAX_SINGLE_FILE_BYTES = 750 * 1024;
const MAX_TOTAL_TEXT_BYTES = 8 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".json",
  ".md",
  ".txt",
  ".yaml",
  ".yml",
  ".html",
  ".css",
  ".sql",
]);

const ALLOWED_FILENAMES = new Set([
  ".gitignore",
  ".env.example",
  "dockerfile",
  "license",
]);

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".turbo",
  "__macosx",
  "node_modules",
  "dist",
  "build",
  "coverage",
]);

export interface ArchiveReadResult extends ExportedWorkflow {
  totalRedactions: number;
  skippedFiles: string[];
}

interface ZipEntryWithUnsafeName {
  unsafeOriginalName?: string;
}

function normalizePath(path: string): string {
  return path
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "");
}

function containsUnsafePath(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");

  return (
    normalized.includes("\0") ||
    normalized.startsWith("/") ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.split("/").includes("..")
  );
}

function shouldIgnorePath(path: string): boolean {
  const segments = path.toLowerCase().split("/");

  return (
    segments.some((segment) => IGNORED_DIRECTORIES.has(segment)) ||
    path.toLowerCase().endsWith("/.ds_store")
  );
}

function isAllowedTextFile(path: string): boolean {
  const lowerPath = path.toLowerCase();
  const filename = lowerPath.split("/").at(-1) ?? "";

  if (ALLOWED_FILENAMES.has(filename)) {
    return true;
  }

  const dotIndex = filename.lastIndexOf(".");

  if (dotIndex === -1) {
    return false;
  }

  return ALLOWED_EXTENSIONS.has(filename.slice(dotIndex));
}

function looksBinary(bytes: Uint8Array): boolean {
  const sampleLength = Math.min(bytes.length, 8_192);

  for (let index = 0; index < sampleLength; index += 1) {
    if (bytes[index] === 0) {
      return true;
    }
  }

  return false;
}

function removeCommonWrapperFolder(
  files: ExportedFile[],
): {
  wrapperName: string | null;
  files: ExportedFile[];
} {
  if (files.length === 0) {
    return {
      wrapperName: null,
      files,
    };
  }

  const firstSegments = files.map((file) => {
    const separatorIndex = file.path.indexOf("/");

    return separatorIndex === -1
      ? null
      : file.path.slice(0, separatorIndex);
  });

  const wrapperName = firstSegments[0];

  if (
    !wrapperName ||
    !firstSegments.every((segment) => segment === wrapperName)
  ) {
    return {
      wrapperName: null,
      files,
    };
  }

  const prefix = `${wrapperName}/`;

  return {
    wrapperName,
    files: files.map((file) => ({
      ...file,
      path: file.path.slice(prefix.length),
    })),
  };
}

function nameFromArchive(filename: string): string {
  return filename
    .replace(/\.zip$/i, "")
    .trim() || "workflow-export";
}

/**
 * Reads a Lamatic-compatible ZIP export without executing any uploaded code.
 */
export async function readWorkflowArchive(
  archive: File,
): Promise<ArchiveReadResult> {
  if (!archive.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Only ZIP workflow exports are supported.");
  }

  if (archive.size === 0) {
    throw new Error("The uploaded archive is empty.");
  }

  if (archive.size > MAX_ARCHIVE_BYTES) {
    throw new Error(
      `Archive exceeds the ${MAX_ARCHIVE_BYTES / 1024 / 1024} MB limit.`,
    );
  }

  let zip: JSZip;

  try {
    zip = await JSZip.loadAsync(archive, {
      checkCRC32: true,
      createFolders: false,
    });
  } catch {
    throw new Error(
      "The archive could not be read. It may be corrupt, encrypted, or unsupported.",
    );
  }

  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  if (entries.length > MAX_FILE_COUNT) {
    throw new Error(
      `Archive contains too many files. Maximum allowed: ${MAX_FILE_COUNT}.`,
    );
  }

  const decoder = new TextDecoder("utf-8", {
    fatal: false,
  });

  const files: ExportedFile[] = [];
  const skippedFiles: string[] = [];

  let totalTextBytes = 0;
  let totalRedactions = 0;

  for (const entry of entries.sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const unsafeOriginalName = (
      entry as typeof entry & ZipEntryWithUnsafeName
    ).unsafeOriginalName;

    if (
      containsUnsafePath(entry.name) ||
      (unsafeOriginalName &&
        containsUnsafePath(unsafeOriginalName))
    ) {
      throw new Error(
        `Archive contains an unsafe path: ${unsafeOriginalName ?? entry.name}`,
      );
    }

    const path = normalizePath(entry.name);

    if (!path || shouldIgnorePath(path)) {
      skippedFiles.push(`${path || entry.name} (ignored directory)`);
      continue;
    }

    if (!isAllowedTextFile(path)) {
      skippedFiles.push(`${path} (unsupported file type)`);
      continue;
    }

    const bytes = await entry.async("uint8array");

    if (bytes.byteLength > MAX_SINGLE_FILE_BYTES) {
      skippedFiles.push(`${path} (file too large)`);
      continue;
    }

    if (looksBinary(bytes)) {
      skippedFiles.push(`${path} (binary content)`);
      continue;
    }

    totalTextBytes += bytes.byteLength;

    if (totalTextBytes > MAX_TOTAL_TEXT_BYTES) {
      throw new Error(
        `Extracted text exceeds the ${MAX_TOTAL_TEXT_BYTES / 1024 / 1024} MB limit.`,
      );
    }

    const rawContent = decoder.decode(bytes);
    const redaction = redactSecrets(rawContent);

    totalRedactions += redaction.redactionCount;

    files.push({
      path,
      content: redaction.content,
      size: bytes.byteLength,
    });
  }

  if (files.length === 0) {
    throw new Error(
      "The ZIP did not contain any supported workflow text files.",
    );
  }

  const stripped = removeCommonWrapperFolder(files);

  return {
    name:
      stripped.wrapperName ??
      nameFromArchive(archive.name),
    files: stripped.files.sort((a, b) =>
      a.path.localeCompare(b.path),
    ),
    totalRedactions,
    skippedFiles,
  };
}