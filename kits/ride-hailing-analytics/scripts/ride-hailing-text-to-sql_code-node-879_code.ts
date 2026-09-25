function buildMemoryUpdatePayload(question, sql, answer) {
  return {
    payload: JSON.stringify({
      question: question,
      sql: sql,
      answer: answer
    })
  };
}
 
return buildMemoryUpdatePayload(
  {{triggerNode_1.output.question}},
  {{codeNode_320.output.sql}},
  {{InstructorLLMNode_699.output.answer}}
);