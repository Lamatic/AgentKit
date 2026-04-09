let response = {{LLMNode_chat.output.generatedResponse}} || '';
let warning = {{codeNode_contextManager.output.conversationWarning}} || '';
return {
  finalAnswer: String(response) + String(warning)
};