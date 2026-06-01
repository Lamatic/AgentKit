/**
 * Build an Overleaf "Open in Overleaf" URL from raw LaTeX source.
 *
 * Overleaf accepts a base64-encoded LaTeX snippet via its /docs endpoint:
 *   https://www.overleaf.com/docs?snip_uri=data:application/x-tex;base64,<base64>
 *
 * For large documents (>8KB of base64), Overleaf's snip_uri may hit URL
 * length limits in some browsers. The fallback is to download the .tex
 * and upload manually. We encode anyway — a typical MoU is ~6KB raw,
 * ~8KB base64, which is within limits for all modern browsers.
 */
export function buildOverleafUrl(latex: string): string {
  // btoa() works on Latin-1. LaTeX is ASCII, so this is safe.
  // If someone puts UTF-8 in party names, we need the TextEncoder path.
  let base64: string;
  try {
    base64 = btoa(latex);
  } catch {
    // Fallback for non-Latin-1 characters
    const encoder = new TextEncoder();
    const bytes = encoder.encode(latex);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }

  const dataUri = `data:application/x-tex;base64,${base64}`;
  return `https://www.overleaf.com/docs?snip_uri=${encodeURIComponent(dataUri)}`;
}

/**
 * Trigger a browser download of a .tex file from raw LaTeX source.
 */
export function downloadTexFile(latex: string, filename: string = "mou-draft.tex"): void {
  const blob = new Blob([latex], { type: "application/x-tex" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
