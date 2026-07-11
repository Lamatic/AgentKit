let entry = {{LLMNode_719.output.generatedResponse}};
let project = {{triggerNode_1.output.project}};
let repo = {{triggerNode_1.output.repo}};
let author = {{triggerNode_1.output.author}};
let date = {{triggerNode_1.output.date}};

let text = '[' + project + '] ' + date + '\n' + entry;

return {
  entryTexts: [text],
  metadata: [{
    content: text,
    project: project,
    repo: repo,
    author: author,
    date: date
  }]
};