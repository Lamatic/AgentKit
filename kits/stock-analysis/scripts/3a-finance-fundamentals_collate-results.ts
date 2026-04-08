// Code: Collate Results
// Flow: 3a-finance-fundamentals

const loopOutput = {{forLoopEndNode_544.output.loopOutput}};

let fundamentals = [];
loopOutput.forEach((fundamental)=>{
console.log(fundamental);
  fundamentals.push({
    "company" : fundamental['codeNode_211']['output']['income_statement']['symbol'],
    "fundamentals" : fundamental['codeNode_211']['output']
  });
})

output = fundamentals;
