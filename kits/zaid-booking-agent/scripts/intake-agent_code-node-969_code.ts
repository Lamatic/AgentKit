// Assign the value you want to return from this code node to `output`.
// The `output` variable is already declared.
const serviceType = {{InstructorLLMNode_254.output.service_type}};
const preferredDate = {{InstructorLLMNode_254.output.preferred_date}};

// One clarifying question at a time (see constitutions/default.md). service_type is the
// Extraction schema's only required field, so ask about it first if it's missing — otherwise
// the only remaining reason this branch fires is a missing date.
let question;
if (serviceType === "") {
  question = "Could you tell me what service you would like to book (e.g. haircut, beard trim, color)?";
} else {
  question = "What date would you like to come in?";
}

output.needs_clarification = true;
output.clarifying_question = question;
output.request = null;
