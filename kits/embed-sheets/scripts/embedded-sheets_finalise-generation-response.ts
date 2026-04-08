// Code: Finalise Generation Response
// Flow: embedded-sheets

let response = "";

if({{LLMNode_658.output}} && {{LLMNode_658.output.generatedResponse}}){
  response = {{LLMNode_658.output.generatedResponse}};
} else if({{LLMNode_533.output}} && {{LLMNode_533.output.images}}){
  const images = {{LLMNode_533.output.images}};
  response = images[0];
}

output = response || "No output generated";
