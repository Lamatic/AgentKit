// Code: Finalise Output
// Flow: agentic-generate-content

let answer = "";

if({{LLMNode_430.output.generatedResponse}}){
  answer = {{LLMNode_430.output.generatedResponse}};
}
else if({{ImageGenNode_535.output.imageUrl}}){
  answer = {{ImageGenNode_535.output.imageUrl}};
}
else if({{LLMNode_255.output.generatedResponse}}){
  answer = {{codeNode_904.output}};
}

output = answer;
