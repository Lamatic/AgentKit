const tree = {{postgresNode_817.output.queryResult[0].tree}};
const rawTextRaw = {{postgresNode_817.output.queryResult[0].raw_text}};
const nodeList = {{InstructorLLMNode_432.output.node_list}};

const pages = typeof rawTextRaw === "string" ? JSON.parse(rawTextRaw) : rawTextRaw;

// ── Detect page offset ────────────────────────────────────────────────────────
// The tree uses PRINTED page numbers from the TOC.
// The pages array uses PHYSICAL page indices (0-based).
// Books with roman-numeral front matter have an offset between the two.
//
// Strategy: find the first chapter node in the tree (depth 1, lowest start_index).
// Search physical pages for that chapter's title text.
// offset = physical_page_found - tree_start_index

function detectOffset(tree, pages) {
  // Get all top-level nodes sorted by start_index
  const topLevel = [...tree].sort((a, b) => (a.start_index || 0) - (b.start_index || 0));
  
  for (const node of topLevel) {
    const printedPage = node.start_index;
    if (!printedPage || !node.title) continue;
    
    const titleLower = node.title.toLowerCase().replace(/chapter-?\d+[-:\s]*/i, "").trim();
    if (titleLower.length < 3) continue;

    // Search physical pages around where we expect to find it
    // Front matter is rarely more than 40 pages
    for (let physIdx = 0; physIdx < Math.min(pages.length, 60); physIdx++) {
      const pageText = (pages[physIdx] || "").toLowerCase();
      if (pageText.includes(titleLower)) {
        const offset = physIdx - (printedPage - 1); // physIdx is 0-based, printedPage is 1-based
        if (offset !== 0) {
          console.log(`[offset] "${node.title}" TOC page ${printedPage} → physical index ${physIdx} → offset +${offset}`);
        }
        return offset;
      }
    }
  }
  return 0; // no offset detected
}

const pageOffset = detectOffset(tree, pages);

// ── Flatten tree recursively ──────────────────────────────────────────────────
function flattenTree(nodes, map = {}) {
  for (const n of nodes) {
    map[n.node_id] = n;
    if (n.nodes && n.nodes.length > 0) flattenTree(n.nodes, map);
  }
  return map;
}
const nodeMap = flattenTree(tree);
const selectedNodes = nodeList.map(id => nodeMap[id]).filter(Boolean);

const MAX_PAGES_PER_NODE = 2;
const MAX_CHARS_PER_PAGE = 2000;

const retrieved = selectedNodes.map(node => {
  // Apply offset: convert printed page number → physical array index (0-based)
  const startPhysIdx = (node.start_index || 1) - 1 + pageOffset;
  const endPhysIdx   = (node.end_index   || node.start_index || 1) - 1 + pageOffset;

  const cappedEnd = Math.min(endPhysIdx, startPhysIdx + MAX_PAGES_PER_NODE - 1, pages.length - 1);

  const pageSlices = pages
    .slice(startPhysIdx, cappedEnd + 1)
    .map(p => p && p.length > MAX_CHARS_PER_PAGE ? p.slice(0, MAX_CHARS_PER_PAGE) + "..." : (p || ""));

  const pageContent = pageSlices.join("\n\n").trim();

  return {
    node_id:     node.node_id,
    title:       node.title,
    start_index: node.start_index,
    end_index:   node.end_index,
    summary:     node.summary,
    page_content: pageContent || node.summary,
  };
});

const context = retrieved
  .map(n => `[Section: "${n.title}" | Pages: ${n.start_index}–${n.end_index}]\n${n.page_content}`)
  .join("\n\n---\n\n");

output = {
  context,
  retrieved_nodes: retrieved,
  total_chars: context.length,
  page_offset_detected: pageOffset,
};