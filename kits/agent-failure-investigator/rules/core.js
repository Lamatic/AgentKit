const CATEGORIES = {
  HALLUCINATION:    { key: "HALLUCINATION",    label: "Hallucination",        color: "var(--cat-hallucination)" },
  TOOL_FAILURE:     { key: "TOOL_FAILURE",     label: "Tool Failure",         color: "var(--cat-tool)" },
  PROMPT_AMBIGUITY: { key: "PROMPT_AMBIGUITY", label: "Prompt Ambiguity",     color: "var(--cat-prompt)" },
  WRONG_TOOL:       { key: "WRONG_TOOL",       label: "Wrong Tool Selection", color: "var(--cat-wrongtool)" },
  RAG_FAILURE:      { key: "RAG_FAILURE",      label: "RAG Failure",          color: "var(--cat-rag)" }
};

const RULES = [];

const definePlugin = spec => { RULES.push(spec); return spec; };

const STOPWORDS = new Set("a,an,the,and,or,for,to,of,in,on,at,is,are,was,were,be,been,with,by,from,as,that,this,it,its,your,our,you,we,i,me,my,per,if,not,no,yes,do,does,did,have,has,had,will,would,can,could,should,into,about,after,before,than,then,them,they,their,there,here,what,which,who,when,where,how,all,any,each,but,so,such,via,use,using,used".split(","));

const tokenize = text => !text ? [] : String(text)
  .toLowerCase()
  .replace(/[^a-z0-9\s.-]/g, " ")
  .split(/\s+/)
  .map(w => w.replace(/^[.-]+|[.-]+$/g, ""))
  .map(w => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w))
  .filter(w => w.length > 2 && !STOPWORDS.has(w));

const overlapRatio = (a, b) => {
  const ta = [...new Set(tokenize(a))];
  if (!ta.length) return 1;
  const tb = new Set(tokenize(b));
  return ta.filter(t => tb.has(t)).length / ta.length;
};

const sharedTokens = (a, b) => {
  const tb = new Set(tokenize(b));
  return [...new Set(tokenize(a))].filter(t => tb.has(t)).length;
};

const CLAIM_SHAPES = [
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\b\d+\s*(?:business\s+)?days?\b/gi,
  /\b\d+\s*(?:hours?|minutes?|weeks?|months?)\b/gi,
  /\bsection\s+\d+(?:\.\d+)*\b/gi,
  /\b\d+(?:\.\d+)?\s*%\b/g,
  /[$€£]\s?\d[\d,]*(?:\.\d+)?\b/g
];

function extractClaims(text) {
  if (!text) return [];
  const bag = [];
  CLAIM_SHAPES.forEach(re => (text.match(re) || []).forEach(m => bag.push(m.trim())));
  return [...new Set(bag)];
}

function groundingCorpus(trace) {
  const parts = [];
  (trace.tool_calls || []).forEach(tc => { if (tc.status === "success" && tc.output) parts.push(tc.output); });
  (trace.retrieved_docs || []).forEach(d => parts.push(d.content || ""));
  return parts.join("\n");
}

function lastUserMessage(trace) {
  const msgs = (trace.conversation || []).filter(m => m.role === "user");
  return msgs.length ? msgs[msgs.length - 1].content : "";
}

const findLogIndex = (trace, predicate) => (trace.logs || []).findIndex(predicate);
