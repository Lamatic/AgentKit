// Code: Collate Data
// Flow: 3d-finance-analysis

const oneYearAgo = new Date();
const fundamentals = {{flowNode_507.output.flowOutput.fundamental_data}};
const historicalStockData = {{flowNode_127.output.flowOutput.historic_data}};
const marketSentiment = {{flowNode_114.output.flowOutput.sentiment_data}};

output = {
   "date" : oneYearAgo.toDateString(),
   "fundamentals" : fundamentals,
   "historical_data" : historicalStockData,
   "sentiment_data" : marketSentiment   
}
