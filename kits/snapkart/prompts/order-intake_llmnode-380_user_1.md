Customer name:{{triggerNode_1.output.ProfileName}}
Intent:{{agentClassifierNode_424.output.class}}
Message:{{triggerNode_1.output.Body}}
Order data (only for orders):{{InstructorLLMNode_102.output.items}}| Clarification:{{InstructorLLMNode_102.output.clarification_needed}} {{InstructorLLMNode_102.output.clarification_question}}
Catalog matches (for inquiries):{{hybridSearchNode_745.output.searchResults}}