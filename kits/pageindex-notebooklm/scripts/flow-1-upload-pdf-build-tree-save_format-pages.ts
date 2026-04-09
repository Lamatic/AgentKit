const files = {{extractFromFileNode_1.output.files}};
const file = files[0];
const pages = file.data;  // array of page strings
const tocItems = {{extractFromFileNode_1.output.toc_items}} || [];

// Build raw_text with [PAGE N] markers (same format your query flow expects)
const rawText = pages
  .map((text, i) => `[PAGE ${i + 1}]\n${text}`)
  .join("\n\n");

output = {
  raw_text: rawText,
  pages: pages,
  page_count: pages.length,
  toc_items: tocItems,
  has_native_toc: tocItems.length > 0,
  pages_json: JSON.stringify(pages)
};