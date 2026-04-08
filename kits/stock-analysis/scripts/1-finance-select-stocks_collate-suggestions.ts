// Code: Collate Suggestions
// Flow: 1-finance-select-stocks

const results = {{apiNode_431.output}};

let sugestions;
if(Array.isArray(results)){
  sugestions = results;
}
else{ 
  throw Error("Credits Over");
}

output = sugestions;
