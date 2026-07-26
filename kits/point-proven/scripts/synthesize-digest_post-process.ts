// Lamatic Code nodes must assign to `output` (not only `return`).
//
// CRITICAL (Studio):
// - NEVER leave {{ node.output }} in // comments — Lamatic expands them anyway.
// - Insert LLM generatedResponse and Group By numbered_source_list via (x) only.
// - If you recreated Group By, re-bind — old codeNode_174 id may be stale.

let llmRaw = {{ LLMNode_812.output.generatedResponse }};
let numbered = {{ codeNode_551.output.numbered_source_list }};
if (!Array.isArray(numbered)) numbered = [];

let validIds = numbered.map(function (s) { return s.id; });
let warnings = [];

let parsed = null;
let parseError = null;
try {
  let cleaned = String(llmRaw).trim();
  if (cleaned.indexOf("```") === 0) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  parsed = JSON.parse(cleaned);
} catch (e) {
  parseError = e;
}

if (!parsed) {
  output = {
    error: "llm_output_not_json",
    query: "",
    executive_brief: [],
    article_summaries: [],
    cross_cutting_themes: [],
    cross_source_contradictions: [],
    consensus_points: [],
    warnings: [{ type: "parse_failure", message: String(parseError) }],
    raw: String(llmRaw).slice(0, 2000)
  };
} else {
  function extractIdsFromBracket(inner) {
    let ids = [];
    let parts = String(inner).split(",");
    for (let i = 0; i < parts.length; i++) {
      let n = parseInt(String(parts[i]).trim(), 10);
      if (!isNaN(n)) ids.push(n);
    }
    return ids;
  }

  function validateCitations(text, context) {
    return String(text).replace(/\[([0-9,\s]+)\]/g, function (m, inner) {
      let ids = extractIdsFromBracket(inner);
      if (!ids.length) {
        warnings.push({ type: "invalid_citation_dropped", raw: m, context: context });
        return "";
      }
      let kept = [];
      for (let i = 0; i < ids.length; i++) {
        if (validIds.indexOf(ids[i]) === -1) {
          warnings.push({
            type: "invalid_citation_dropped",
            raw: "[" + ids[i] + "]",
            context: context
          });
        } else {
          kept.push(ids[i]);
        }
      }
      if (!kept.length) return "";
      return "[" + kept.join(", ") + "]";
    });
  }

  function highlight(text) {
    return String(text).replace(/\*\*([^*]+)\*\*/g, "<mark>$1</mark>");
  }

  function collectIds(text, citedOrder, seen) {
    let matches = String(text).match(/\[([0-9,\s]+)\]/g) || [];
    for (let j = 0; j < matches.length; j++) {
      let inner = matches[j].slice(1, -1);
      let ids = extractIdsFromBracket(inner);
      for (let k = 0; k < ids.length; k++) {
        let id = ids[k];
        if (validIds.indexOf(id) !== -1 && !seen[id]) {
          seen[id] = true;
          citedOrder.push(id);
        }
      }
    }
  }

  let ebRaw = parsed.executive_brief || [];
  let ebStrings = [];
  for (let i = 0; i < ebRaw.length; i++) {
    let item = ebRaw[i];
    if (typeof item === "string") {
      let ctx = "executive_brief[" + ebStrings.length + "]";
      ebStrings.push(highlight(validateCitations(item, ctx)));
    }
  }

  let citedOrder = [];
  let seen = {};
  for (let i = 0; i < ebStrings.length; i++) {
    collectIds(ebStrings[i], citedOrder, seen);
  }

  let sources = citedOrder.map(function (id) {
    return numbered.find(function (s) { return s.id === id; });
  }).filter(function (s) { return !!s; });

  let executive_brief = ebStrings.slice();
  executive_brief.push({
    type: "sources",
    items: sources
  });

  let cct = (parsed.cross_cutting_themes || []).map(function (theme, idx) {
    return highlight(validateCitations(theme, "cross_cutting_themes[" + idx + "]"));
  });

  output = {
    query: parsed.query || "",
    executive_brief: executive_brief,
    article_summaries: parsed.article_summaries || [],
    cross_cutting_themes: cct,
    cross_source_contradictions: parsed.cross_source_contradictions || [],
    consensus_points: parsed.consensus_points || [],
    warnings: warnings
  };
}
