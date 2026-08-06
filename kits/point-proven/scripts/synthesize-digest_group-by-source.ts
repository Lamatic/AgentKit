// PASTE INTO Studio CodeNode174 (Group By Source).
// Binding rule: use (x) ONLY for whole Search output — replace the
// searchNode_### id with whatever (x) inserts. Do NOT type .searchResults
// inside {{ }}. Never leave {{ }} inside // comments.

let searchOut = {{searchNode_244.output}};

if (typeof searchOut === "string") {
  try {
    searchOut = JSON.parse(searchOut);
  } catch (e) {
    searchOut = null;
  }
}

let hits = [];
if (Array.isArray(searchOut)) {
  hits = searchOut;
} else if (searchOut && typeof searchOut === "object") {
  let sr = searchOut.searchResults;

  // Lamatic sometimes stringifies nested searchResults on handoff.
  if (typeof sr === "string") {
    try {
      sr = JSON.parse(sr);
    } catch (e) {
      sr = [];
    }
  }

  // Some runtimes wrap the array again
  if (sr && typeof sr === "object" && !Array.isArray(sr)) {
    if (Array.isArray(sr.searchResults)) sr = sr.searchResults;
    else if (Array.isArray(sr.hits)) sr = sr.hits;
    else if (Array.isArray(sr.data)) sr = sr.data;
    else if (Array.isArray(sr.results)) sr = sr.results;
  }

  if (Array.isArray(sr)) hits = sr;
  else if (Array.isArray(searchOut.hits)) hits = searchOut.hits;
  else if (Array.isArray(searchOut.data)) hits = searchOut.data;
  else if (Array.isArray(searchOut.results)) hits = searchOut.results;
}
if (!Array.isArray(hits)) hits = [];

let maxRaw = {{triggerNode_1.output.max_articles}};
let maxArticles = parseInt(String(maxRaw == null ? "5" : maxRaw), 10);
if (isNaN(maxArticles) || maxArticles < 1) maxArticles = 5;

function asText(v) {
  if (v == null) return "";
  if (typeof v === "string") {
    if (!v.trim() || v === "[object Object]") return "";
    return v.trim();
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function hitUrl(h) {
  if (!h || typeof h !== "object") return "";
  let md = h.metadata && typeof h.metadata === "object" ? h.metadata : {};
  return asText(h.source) || asText(md.source) || asText(h.url) || asText(md.url);
}

function hitTitle(h) {
  if (!h || typeof h !== "object") return "";
  let md = h.metadata && typeof h.metadata === "object" ? h.metadata : {};
  return asText(h.title) || asText(md.title) || "";
}

function hitText(h) {
  if (!h || typeof h !== "object") return "";
  let md = h.metadata && typeof h.metadata === "object" ? h.metadata : {};
  let t =
    asText(h.content) ||
    asText(md.content) ||
    asText(h.pageContent) ||
    asText(md.pageContent) ||
    asText(h.text) ||
    asText(md.text);
  if (!t) {
    t = asText(h.description) || asText(md.description);
  }
  return t;
}

function hitScore(h) {
  if (!h || typeof h !== "object") return 0;
  if (typeof h.certainty === "number") return h.certainty;
  if (typeof h.score === "number") return h.score;
  if (h._additional && typeof h._additional.certainty === "number") {
    return h._additional.certainty;
  }
  return 0;
}

function hostnameFromUrl(u) {
  let s = String(u || "");
  let m = s.match(/^https?:\/\/([^\/?#]+)/i);
  if (m && m[1]) return m[1];
  return s;
}

let bySource = {};

for (let i = 0; i < hits.length; i++) {
  let h = hits[i];
  if (!h || typeof h !== "object") continue;

  let key = hitUrl(h);
  if (!key) continue;

  let text = hitText(h);

  if (!bySource[key]) {
    bySource[key] = {
      chunks: [],
      title: hitTitle(h),
      order: i,
      bestScore: hitScore(h)
    };
  }

  let sc = hitScore(h);
  if (sc > bySource[key].bestScore) bySource[key].bestScore = sc;
  if (!bySource[key].title) bySource[key].title = hitTitle(h);

  if (text) {
    bySource[key].chunks.push({ content: text, score: sc });
  }
}

for (let key of Object.keys(bySource)) {
  let sorted = bySource[key].chunks.slice().sort(function (a, b) {
    return b.content.length - a.content.length;
  });
  let deduped = [];
  for (let c = 0; c < sorted.length; c++) {
    let cur = sorted[c];
    let isDup = false;
    for (let d = 0; d < deduped.length; d++) {
      if (deduped[d].content.indexOf(cur.content) !== -1) {
        isDup = true;
        break;
      }
    }
    if (!isDup) deduped.push(cur);
  }
  bySource[key].chunks = deduped;
}

let ranked = Object.keys(bySource).map(function (url) {
  return {
    url: url,
    title: bySource[url].title,
    chunks: bySource[url].chunks,
    bestScore: bySource[url].bestScore,
    order: bySource[url].order
  };
});

ranked.sort(function (a, b) {
  if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
  return a.order - b.order;
});
ranked = ranked.slice(0, maxArticles);

let numbered = [];
let grouped = [];

for (let i = 0; i < ranked.length; i++) {
  let domain = hostnameFromUrl(ranked[i].url);

  numbered.push({
    id: i + 1,
    domain: domain,
    title: ranked[i].title,
    url: ranked[i].url
  });

  let combined = ranked[i].chunks
    .map(function (c) {
      return c.content;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  if (!combined) {
    combined =
      "(No chunk text stored for this source yet. Title: " +
      (ranked[i].title || domain) +
      ". URL: " +
      ranked[i].url +
      ")";
  }

  grouped.push({
    source_id: i + 1,
    combined_text: combined
  });
}

output = {
  numbered_source_list: numbered,
  grouped_chunks: grouped
};
