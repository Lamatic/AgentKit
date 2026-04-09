const batch = {{batchEndNode_732.output.batchOutput}}
const results = batch.map((item, i) => {
  const text = item.webSearchNode_141.output.output.text;
  return `[Reddit Thread ${i+1}]\n${text}`;
});
output = { allRedditData: results.join("\n\n===\n\n") };
