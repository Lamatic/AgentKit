// Assign the value you want to return from this code node to `output`.
// The `output` variable is already declared.

// Taking input from upstream nodes
const llmOutput414 = {{LLMNode_414.output.generatedResponse}};
const topic = {{variablesNode_218.output.topic}};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isSafeUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

// Parse the JSON array of ranked articles
let articles = [];
try {
  articles = JSON.parse(llmOutput414);
} catch (e) {
  articles = [];
}

// Build sanitized HTML deterministically — never trust LLM output directly
let html = `<h1>Daily ${escapeHtml(topic)} Digest</h1>\n`;

articles.forEach((article, i) => {
  const safeUrl = isSafeUrl(article.url) ? article.url : '#';
  html += `<h2>${i + 1}. ${escapeHtml(article.title)}</h2>\n`;
  html += `<p>${escapeHtml(article.summary)}</p>\n`;
  html += `<p><strong>Source:</strong> <a href="${escapeHtml(safeUrl)}">${escapeHtml(safeUrl)}</a></p>\n<hr>\n`;
});

output = {
  status: articles.length > 0 ? "success" : "empty",
  html: html
};