const OPENROUTER_API_KEY = "{{ env.OPENROUTER_API_KEY }}";
// 2. Map Lamatic UI Variables to Standard JavaScript Variables
// (Click "Add Variable" to inject the Lamatic tag on the right side of the equals sign)
const rowCount = {{ codeNode_951.output.row_count }};
const colCount = {{ codeNode_951.output.col_count }};
const columnTypes = {{ codeNode_183.output.column_types }};
const score = {{ codeNode_724.output.health_score }};
const status = "{{codeNode_724.output.health_status}}";
const issues = {{ codeNode_724.output.issues }};
const relationships = {{ codeNode_568.output.relationships }};

const systemPrompt = `You are an elite Senior Data Engineer evaluating a dataset. Your task is to output ONLY raw JSON mapping exactly to this schema:
{
  "summary": "A comprehensive, multi-paragraph executive summary detailing the dataset's structural integrity, completeness, and statistical anomalies. Be highly analytical and thorough.",
  "dataset_readiness": "READY | NEEDS_CLEANING | NOT_READY",
  "major_risks": [ 
    { 
      "issue_id": "string", 
      "impact": "A highly detailed explanation of how this risk will impact machine learning models or business logic.", 
      "priority": "HIGH|MEDIUM|LOW" 
    } 
  ],
  "recommendations": [ 
    { 
      "issue_id": "string", 
      "action": "Specific, actionable data engineering steps required to fix the issue (e.g., 'winsorize outliers', 'drop column').", 
      "reason": "Detailed justification for the recommendation." 
    } 
  ]
}
Do NOT output markdown outside of the JSON. Do not hallucinate data.`;

const userPrompt = `Dataset Context: ${rowCount} rows and ${colCount} columns.
Schema & Inferred Types: ${JSON.stringify(columnTypes)}

Overall Health Score: ${score}/100 (${status})

Detected Issues: ${JSON.stringify(issues)}
High Correlations: ${JSON.stringify(relationships)}

Based on this rich context, generate the final JSON report.`;

// ----------------------------------------------------
// ROBUST LLM CALL WITH RETRIES & CLEANUP
// ----------------------------------------------------
let aiJson = null;
let attempts = 0;
let lastError = null;

while (attempts < 3 && !aiJson) {
  attempts++;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lamatic.ai",
          "X-Title": "AgentKit JSON API"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      let rawContent = data.choices[0].message.content;
      // Strip markdown backticks if the model hallucinates them
      rawContent = rawContent.replace(/^```json/mi, "").replace(/```$/m, "").trim();
      const parsed = JSON.parse(rawContent);
      if (
        parsed && 
        typeof parsed.summary === "string" &&
        ["READY", "NEEDS_CLEANING", "NOT_READY"].includes(parsed.dataset_readiness) &&
        Array.isArray(parsed.major_risks) &&
        Array.isArray(parsed.recommendations)
      ) {
        aiJson = parsed;
      } else {
        throw new Error("Invalid schema returned by LLM");
      }
    } else {
      lastError = data;
    }
  } catch (error) {
    lastError = error.message;
  }
}

// Final Output routing
if (aiJson) {
  output = { ai_interpretation: aiJson };
} else {
  // GRACEFUL FALLBACK: If API fails 3 times, output a safe schema so the workflow doesn't crash!
  output = {
    ai_interpretation: {
      summary: "The AI analysis engine was temporarily unavailable or timed out after 3 attempts. Please run the workflow again later.",
      dataset_readiness: "NOT_READY",
      major_risks: [],
      recommendations: []
    },
    error_logs: lastError
  };
}
