// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
let raw = {{LLMNode_516.output.generatedResponse}};

  let answer;
  try {
    answer = JSON.parse(raw);
  } catch (e) {
    answer = {
      assessment: String(raw),
      leverage: [],
      strategy: { summary: "", target_base: "", target_total: "", 
  approach: "" },
      talking_points: [],
      counter_email: "",
      call_script: "",
      risks: [],
      assumptions: []
    };
  }

output = answer;