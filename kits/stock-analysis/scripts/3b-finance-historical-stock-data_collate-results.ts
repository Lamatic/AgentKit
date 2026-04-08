// Code: Collate Results
// Flow: 3b-finance-historical-stock-data

const loopOutput = {{forLoopEndNode_544.output.loopOutput}};

let stocks = [];
loopOutput.forEach((stock)=>{
  stocks.push({
    "company" : stock['apiNode_336']['output'][0]['symbol'],
    "stock_data" : stock['codeNode_403']['output']
  });
})

output = stocks;
