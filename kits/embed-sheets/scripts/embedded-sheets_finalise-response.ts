// Code: Finalise Response
// Flow: embedded-sheets

let response = "";

if({{LLMNode_658.output.generatedResponse}} || {{LLMNode_533.output.images}}){
  response = {{codeNode_750.output}};
}
else if({{LLMNode_588.output.generatedResponse}}){
  response = {{codeNode_302.output}};
}
else if({{LLMNode_447.output.generatedResponse}}){
  response = {{codeNode_319.output}};
}
else{
  response = {{codeNode_494.output}};
}

output = response;
