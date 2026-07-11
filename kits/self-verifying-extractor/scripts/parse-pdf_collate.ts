// Code: Collate PDF pages
// Flow: parse-pdf
//
// Turns the raw output of the Extract from File node into a single canonical
// text string with explicit page markers, so the downstream extract/verify
// stages see exactly the same text and can attribute evidence to a page:
//
//   --- Page 1 ---
//   <text of page 1>
//
//   --- Page 2 ---
//   <text of page 2>
//
// `joinPages` is enabled because Lamatic's current Edge deployment requires an
// explicit true value. Depending on the extractor version, `data` may still be
// an array of page strings or it may be one joined string. Normalise both shapes.
// When only joined text is available it receives a Page 1 marker; page-level
// attribution is therefore intentionally unavailable for the remaining pages.

const files = {{extractFromFileNode_10.output.files}};

let pages = [];
let reportedPageCount = null;
try {
  const file = files && files[0] ? files[0] : null;
  const data = file ? file.data : null;
  const raw = file ? file.raw : null;
  const pageCountCandidates = [
    file && file.page_count,
    file && file.pageCount,
    file && file.additional_fields && file.additional_fields.page_count,
    raw && !Array.isArray(raw) && raw.page_count,
    Array.isArray(raw) && raw[0] && raw[0].page_count,
  ];
  const pageCount = pageCountCandidates.find(
    (value) => Number.isInteger(Number(value)) && Number(value) > 0,
  );
  reportedPageCount = pageCount === undefined ? null : Number(pageCount);

  if (Array.isArray(data)) {
    pages = data.map((page) => {
      if (typeof page === "string") return page;
      if (page && typeof page === "object") {
        return page.text || page.content || page.pageContent || "";
      }
      return "";
    });
  } else if (typeof data === "string") {
    pages = [data];
  } else if (data && typeof data === "object") {
    pages = [data.text || data.content || ""];
  }
} catch (e) {
  pages = [];
}

pages = pages.map((page) => String(page).trim()).filter((page) => page.length > 0);

const text = pages
  .map((page, index) => `--- Page ${index + 1} ---\n${page}`)
  .join("\n\n");

output = { text, page_count: reportedPageCount || pages.length };
