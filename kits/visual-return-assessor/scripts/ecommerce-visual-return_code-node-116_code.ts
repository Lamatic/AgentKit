// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const llmOut = {{InstructorLLMNode_560.output}}

console.log(llmOut)

// Coerce values safely regardless of type
const isAuth = llmOut?.authenticityMatch == true 
const isTamp = llmOut.tamperingDetected == true 

// Output a single, strict status string
output = {
  route: (isAuth && !isTamp) ? "PASS" : "REJECT"
};