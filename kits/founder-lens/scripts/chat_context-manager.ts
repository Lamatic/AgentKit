let rawBriefRefs = {{RAGNode_brief.output.references}} || [];
let rawMemories = {{memoryRetrieveNode_chat.output.rawMemories}} || [];

let briefRecords = Array.isArray(rawBriefRefs) ? rawBriefRefs : [];

let briefContext = '';
if (briefRecords.length > 0) {
  briefContext = briefRecords.map(function(r) {
    return r.content || r.text || r.memory || JSON.stringify(r);
  }).join('\n\n');
}

if (!briefContext || briefContext.trim() === '' || briefContext === '{}') {
  briefContext = '(Brief not yet indexed for this session — please run the analysis flow first)';
}

let turnCount = Array.isArray(rawMemories) ? rawMemories.length : 0;
let isFirstMessage = turnCount === 0;

let memories = {{memoryRetrieveNode_chat.output.memories}} || [];
let historyString = '';
if (Array.isArray(memories) && memories.length > 0) {
  historyString = memories.slice(-6).map(function(m) {
    return (m.role || 'user') + ': ' + (m.content || '');
  }).join('\n');
}

let conversationWarning = '';
if (turnCount >= 15) {
  conversationWarning = '\n\n---\n⚠️ This conversation has ' + turnCount + ' exchanges. For best results analyzing a new idea, start a fresh chat. Your brief for this session remains fully accessible.';
}

return {
  isFirstMessage: String(isFirstMessage),
  turnCount: String(turnCount),
  briefContext: briefContext,
  historyString: historyString,
  conversationWarning: conversationWarning
};