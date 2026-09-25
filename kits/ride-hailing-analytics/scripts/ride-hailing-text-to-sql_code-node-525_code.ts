function buildMemoryInsertPayload(sessionId, question, sql, answer) {
  return {
    payload: JSON.stringify({
      sessionId: sessionId,
      question: question,
      sql: sql,
      answer: answer
    })
  };
}
 
return buildMemoryInsertPayload(
  {{triggerNode_1.output.sessionId}},
  {{triggerNode_1.output.question}},
  {{codeNode_320.output.sql}},
  {{InstructorLLMNode_699.output.answer}}
);