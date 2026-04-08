// Code: Collate Results
// Flow: 3c-finance-market-sentiment

const loopOutput = {{forLoopEndNode_544.output.loopOutput}};

let sentiments = [];
loopOutput.forEach((sentiment)=>{
  sentiments.push({
    "company" : sentiment['webSearchNode_818']['output']['output']['searchParameters']['q'],
    "sentiment" : sentiment['codeNode_159']['output']
  });
})
output = sentiments;
