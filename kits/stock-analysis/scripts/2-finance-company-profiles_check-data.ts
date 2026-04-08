// Code: Check Data
// Flow: 2-finance-company-profiles

const results = {{apiNode_946.output}};

let companyProfile;
if(Array.isArray(results)){
  companyProfile = results;
}
else{ 
  throw Error("Credits Over");
}

output = companyProfile;
