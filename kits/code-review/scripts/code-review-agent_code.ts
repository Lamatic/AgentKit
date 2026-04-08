// Code: Code
// Flow: code-review-agent

const files = {{apiNode_688.output}};
let diff = "";
for (const file of files) {
  diff += `File: ${file.filename}\n${file.patch || ""}\n\n`;
}
output = { diff: diff };
