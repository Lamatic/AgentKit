const results = workflow.webSearchNode_810.output.output.organic || [];
const companyName = (workflow.codeNode_512.output.company_name || "").toLowerCase();

const relevant = results.filter(r => {
  const text = ((r.title || "") + " " + (r.snippet || "")).toLowerCase();
  return companyName && text.includes(companyName);
});

const toUse = relevant.length > 0 ? relevant : results;

const search_results = toUse
  .slice(0, 3)
  .map(r => `${r.title}: ${r.snippet}`)
  .join(" | ");

return { search_results };