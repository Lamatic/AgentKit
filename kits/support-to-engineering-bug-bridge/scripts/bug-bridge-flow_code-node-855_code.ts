const results = {{searchNode_833.output.searchResults}} || [];

let formattedContext = "";

results.forEach((res, index) => {

  const score = res.certainty || res.score || res.distance || "N/A";

  formattedContext += `[Candidate ${index + 1}]\n`;
  formattedContext += `Cluster ID: ${res.cluster_id}\n`;
  formattedContext += `Similarity Score: ${score}\n`;
  formattedContext += `Subject: ${res.subject}\n`;
  formattedContext += `Description: ${res.description || ""}\n`;
  formattedContext += `--------------------------------------------------\n\n`;

});

output = {
  clean_context: formattedContext
};