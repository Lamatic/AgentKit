/**
 * Open the given LaTeX source in Overleaf via a POST form.
 *
 * Why POST and not `?snip_uri=data:...base64,...`:
 *   - Overleaf's `snip_uri` parameter packs the entire document into the URL.
 *     For non-trivial MoUs the encoded URL exceeds Overleaf's nginx URI
 *     limit (~8 KB on the way in) and returns "414 Request-URI Too Large".
 *   - `POST https://www.overleaf.com/docs` with a `snip` form field has no
 *     such limit — it's how Overleaf's own "Open in Overleaf" buttons handle
 *     anything larger than a code snippet.
 *
 * Implementation: build a hidden form, append it to <body>, submit it with
 * target=_blank, then remove it. Browsers treat this as a user-initiated
 * navigation in the new tab.
 */
export function openInOverleaf(latex: string): void {
  const form = document.createElement("form");
  form.action = "https://www.overleaf.com/docs";
  form.method = "POST";
  form.target = "_blank";
  form.rel = "noopener noreferrer";
  form.style.display = "none";

  const snip = document.createElement("input");
  snip.type = "hidden";
  snip.name = "snip";
  snip.value = latex;
  form.appendChild(snip);

  // Hint Overleaf about the engine and name so the new project lands sane.
  const engine = document.createElement("input");
  engine.type = "hidden";
  engine.name = "engine";
  engine.value = "pdflatex";
  form.appendChild(engine);

  const name = document.createElement("input");
  name.type = "hidden";
  name.name = "snip_name";
  name.value = "MoU Draft";
  form.appendChild(name);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
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
