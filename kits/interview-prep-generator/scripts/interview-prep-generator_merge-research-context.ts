// Code: Merge Research Context
// Flow: interview-prep-generator
//
// Combines the two independent research arms - Fact Lookup (Tavily search)
// and Context Assembly (Browser Use live browsing) - into one clean text
// block for the generation prompt. Either, both, or neither may have run;
// this node never throws, it just returns whatever is actually available.

function summarizeTavily(raw) {
    try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const results = (parsed && parsed.results) || [];
          if (!Array.isArray(results) || results.length === 0) return '';
          return results
            .slice(0, 5)
            .map((r) => `- ${r.title || 'Untitled'}: ${(r.content || '').slice(0, 300)}`)
            .join('\n');
    } catch (e) {
          return '';
    }
}

const tavilyRaw = `{{apiNode_365.output}}`;
const tavilySummary = summarizeTavily(tavilyRaw);

const browserSummaryRaw = `{{codeNode_718.output.contextSummary}}`;
const browserSummary = typeof browserSummaryRaw === 'string' ? browserSummaryRaw.trim() : '';

const parts = [];
if (tavilySummary) parts.push(`Search results:\n${tavilySummary}`);
if (browserSummary && browserSummary !== 'undefined') parts.push(`Live browsing summary:\n${browserSummary}`);

output = {
    researchContext: parts.join('\n\n'),
    usedCompanyResearch: parts.length > 0
};
