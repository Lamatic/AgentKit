// Code: Collate Results
// Flow: 2-finance-company-profiles

const loopOutput = {{forLoopEndNode_941.output.loopOutput}};

let profiles = [];
loopOutput.forEach((profile)=>{
  profiles.push(profile['codeNode_453']['output'][0]);
})

output = profiles;
