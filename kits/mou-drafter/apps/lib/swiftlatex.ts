// SwiftLaTeX engine loader (browser only).
//
// Files live in apps/public/swiftlatex/ (downloaded from
// https://github.com/SwiftLaTeX/SwiftLaTeX/releases):
//   - PdfTeXEngine.js
//   - swiftlatexpdftex.js   (the worker)
//   - swiftlatexpdftex.wasm
//
// Why we override window.ENGINE_PATH:
//   PdfTeXEngine.js hardcodes `var ENGINE_PATH = 'swiftlatexpdftex.js'` at the
//   top of the file. That `var` becomes a property of `window` when loaded as
//   a regular <script>. When `new Worker(ENGINE_PATH)` runs, the relative URL
//   resolves against the *page* URL (e.g. http://localhost:3000/), so the
//   browser asks for /swiftlatexpdftex.js → 404. Setting window.ENGINE_PATH
//   after the script loads but before loadEngine() runs lets the Worker
//   constructor pick up the corrected path.

declare global {
  interface Window {
    PdfTeXEngine?: any;
    ENGINE_PATH?: string;
  }
}

const ENGINE_SCRIPT_PATH = "/swiftlatex/PdfTeXEngine.js";
const WORKER_PATH = "/swiftlatex/swiftlatexpdftex.js";

let enginePromise: Promise<any> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-swiftlatex="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.swiftlatex = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export async function getEngine(): Promise<any> {
  if (enginePromise) return enginePromise;
  enginePromise = (async () => {
    await loadScript(ENGINE_SCRIPT_PATH);
    if (typeof window.PdfTeXEngine !== "function") {
      throw new Error(
        "SwiftLaTeX engine script loaded but PdfTeXEngine constructor is missing."
      );
    }
    // Override the engine's hardcoded relative worker path (see comment above).
    window.ENGINE_PATH = WORKER_PATH;
    const engine = new window.PdfTeXEngine();
    await engine.loadEngine();
    return engine;
  })();
  return enginePromise;
}

export interface CompileResult {
  pdf: Uint8Array;
  log: string;
  status: number;
}

export async function compileLatex(latex: string): Promise<CompileResult> {
  const engine = await getEngine();
  engine.writeMemFSFile("main.tex", latex);
  engine.setEngineMainFile("main.tex");
  const res = await engine.compileLaTeX();
  if (!res || !res.pdf || res.status !== 0) {
    const err = new Error(
      `LaTeX compile failed (status ${res?.status ?? "?"}). See log for details.`
    ) as Error & { log?: string; status?: number };
    err.log = res?.log ?? "";
    err.status = res?.status ?? -1;
    throw err;
  }
  return { pdf: res.pdf, log: res.log ?? "", status: res.status };
}

export function pdfBlobUrl(pdf: Uint8Array): string {
  // Copy into a fresh ArrayBuffer so the Blob isn't aliasing engine memory.
  // SharedArrayBuffer-backed Uint8Arrays cannot be passed to Blob directly.
  const ab = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(ab).set(pdf);
  const blob = new Blob([ab], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
