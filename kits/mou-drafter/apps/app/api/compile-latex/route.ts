// Server-side LaTeX → PDF compile.
//
// Accepts POST { latex: string }, shells out to `pdflatex` in a fresh temp
// dir, returns the PDF bytes on success or the relevant slice of the
// compile log on failure.
//
// Requires `pdflatex` on PATH (MiKTeX on Windows, TeX Live elsewhere).
// Vercel serverless functions cannot run this — see README. For prod,
// either deploy to a host with TeXLive baked in (Docker on Fly.io,
// Railway, a VPS) or front this route with a separate compile service.

import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { mkdtemp, writeFile, readFile, rm, stat } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const PDFLATEX_BIN = process.env.PDFLATEX_BIN || "pdflatex";
const COMPILE_TIMEOUT_MS = 45_000;
const MAX_LATEX_BYTES = 512 * 1024; // 512 KB cap — an MoU is ~10 KB

interface CompileFailure {
  ok: false;
  error: string;
  log?: string;
}

export async function POST(req: NextRequest) {
  // Safety net for prod: the UI doesn't call this route on Vercel (the
  // preview card is dev-only), but if someone hits it directly we should
  // fail fast instead of waiting for the 45 s pdflatex timeout on a host
  // that has no LaTeX installed. Set ENABLE_PDF_COMPILE=1 in env to opt
  // in on hosts that DO have texlive available.
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.ENABLE_PDF_COMPILE !== "1"
  ) {
    return Response.json(
      {
        ok: false,
        error:
          "PDF compile is disabled in this environment. Use the .tex download or Overleaf instead.",
      },
      { status: 503 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError(400, "Body must be JSON.");
  }

  const latex = (payload as { latex?: unknown })?.latex;
  if (typeof latex !== "string" || latex.length === 0) {
    return jsonError(400, "Body must include a non-empty `latex` string.");
  }
  if (Buffer.byteLength(latex, "utf8") > MAX_LATEX_BYTES) {
    return jsonError(
      413,
      `LaTeX source exceeds ${MAX_LATEX_BYTES} bytes — refusing to compile.`
    );
  }

  const workDir = await mkdtemp(join(tmpdir(), "moudraft-"));
  try {
    const texPath = join(workDir, "main.tex");
    const pdfPath = join(workDir, "main.pdf");
    await writeFile(texPath, latex, "utf8");

    const result = await runPdflatex(workDir, texPath);

    // pdflatex may exit non-zero on warnings yet still emit a PDF; rely on
    // the PDF file existing as the source of truth.
    const pdfExists = await stat(pdfPath).then(
      () => true,
      () => false
    );

    if (!pdfExists) {
      return Response.json(
        {
          ok: false,
          error:
            result.timedOut
              ? "pdflatex timed out."
              : result.notFound
              ? "pdflatex was not found. Install MiKTeX or TeX Live and ensure it's on PATH."
              : "pdflatex failed to produce a PDF.",
          log: extractRelevantLog(result.log),
        } satisfies CompileFailure,
        { status: 422 }
      );
    }

    const pdf = await readFile(pdfPath);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="mou-draft.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return jsonError(
      500,
      err instanceof Error ? err.message : "Unexpected compile error."
    );
  } finally {
    rm(workDir, { recursive: true, force: true }).catch(() => {
      /* leak temp dir rather than crash the response */
    });
  }
}

interface PdflatexResult {
  code: number;
  log: string;
  timedOut: boolean;
  notFound: boolean;
}

function runPdflatex(cwd: string, texPath: string): Promise<PdflatexResult> {
  return new Promise((resolve) => {
    const child = spawn(
      PDFLATEX_BIN,
      [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-no-shell-escape",
        "-output-directory",
        cwd,
        texPath,
      ],
      { cwd, windowsHide: true }
    );

    let log = "";
    let timedOut = false;
    let notFound = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, COMPILE_TIMEOUT_MS);

    child.stdout.on("data", (d: Buffer) => {
      log += d.toString("utf8");
    });
    child.stderr.on("data", (d: Buffer) => {
      log += d.toString("utf8");
    });
    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") notFound = true;
      log += `\n[spawn error] ${err.message}`;
      clearTimeout(timer);
      resolve({ code: -1, log, timedOut, notFound });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, log, timedOut, notFound });
    });
  });
}

// pdflatex logs are noisy (~2000 lines for a small doc). Surface just the
// blocks that look like errors plus a tail of the log.
function extractRelevantLog(log: string): string {
  const lines = log.split(/\r?\n/);
  const errorBlocks: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^!\s/.test(line) || /^l\.\d+/.test(line)) {
      const start = Math.max(0, i - 1);
      const end = Math.min(lines.length, i + 6);
      errorBlocks.push(lines.slice(start, end).join("\n"));
    }
  }
  const tail = lines.slice(-25).join("\n");
  if (errorBlocks.length === 0) return tail;
  return errorBlocks.join("\n\n---\n\n") + "\n\n--- log tail ---\n" + tail;
}

function jsonError(status: number, error: string) {
  return Response.json({ ok: false, error } satisfies CompileFailure, {
    status,
  });
}
