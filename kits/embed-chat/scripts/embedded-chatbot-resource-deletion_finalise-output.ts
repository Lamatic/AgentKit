// Code: Finalise Output
// Flow: embedded-chatbot-resource-deletion

let check = {}

const pdfSkipCheck = {
  "executionMsg": "Skipped the node execution"
}

const vectorOutput = typeof {{vectorNode_537.output}} === 'string' 
  ? JSON.parse({{vectorNode_537.output}}) 
  : {{vectorNode_537.output}};

if(vectorOutput.executionMsg !== "Skipped the node execution"){
  check = {
    "status": vectorOutput
  }
}
else if({{codeNode_571.output}}){
  check = {
    "status": {{codeNode_571.output}}
  }
}

output = check;
