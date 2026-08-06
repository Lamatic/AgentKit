const llmInput = {{InstructorLLMNode_809.output}};
const searchResults = {{searchNode_833.output.searchResults}};

const confidenceThreshold = 0.70;


// =================================================
// Read structured output directly from Generate JSON
// =================================================

let result = {
  decision: llmInput.decision,
  matched_cluster_id: llmInput.matched_cluster_id,
  confidence: Number(llmInput.confidence || 0),
  evidence: Array.isArray(llmInput.evidence)
    ? llmInput.evidence
    : []
};


// =================================================
// Basic validation
// =================================================

if (!["matched", "new"].includes(result.decision)) {

  console.log(
    "Invalid decision:",
    result.decision
  );

  result = {
    decision: "new",
    matched_cluster_id: null,
    confidence: 0,
    evidence: []
  };

}


// =================================================
// HARD SAFETY GUARD
// If Vector Search found nothing,
// matching is impossible.
// =================================================

if (!searchResults || searchResults.length === 0) {

  result = {
    decision: "new",
    matched_cluster_id: null,
    confidence: 1.0,
    evidence: [
      {
        statement:
          "No candidate clusters were returned from Vector Search.",
        source: "ticket_text"
      }
    ]
  };

}


// =================================================
// Additional validation:
// matched_cluster_id must exist in search results
// =================================================

if (result.decision === "matched") {

  const matchedExists = searchResults.some(
    r => r.cluster_id === result.matched_cluster_id
  );

  if (!matchedExists) {

    console.log(
      "Invalid matched_cluster_id:",
      result.matched_cluster_id
    );

    result = {
      decision: "new",
      matched_cluster_id: null,
      confidence: 0,
      evidence: [
        {
          statement:
            "The predicted cluster was not present in candidate clusters.",
          source: "inferred"
        }
      ]
    };

  }

}


// =================================================
// Final routing logic
// =================================================

let finalRoute;

if (result.confidence < confidenceThreshold) {

  finalRoute = "hold";

} else if (result.decision === "matched") {

  finalRoute = "update_cluster";

} else {

  finalRoute = "create_singleton";

}


// =================================================
// Final output
// =================================================

output = {
  route: finalRoute,
  data: result
};