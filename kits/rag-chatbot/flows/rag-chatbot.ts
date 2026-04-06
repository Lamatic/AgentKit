// Flow definition for rag-chatbot
// When @lamatic/sdk ships: import { defineFlow, nodes, edges } from '@lamatic/sdk'

export default {
  nodes: [
    {
      id: 'triggerNode_1',
      type: 'triggerNode',
      position: { x: 0, y: 0 },
      data: {
        nodeId: 'chatTriggerNode',
        trigger: true,
        values: {
          nodeName: 'Chat Widget',
          chat: '',
          domains: [],
        },
      },
    },
    {
      id: 'RAGNode_919',
      type: 'dynamicNode',
      position: { x: 0, y: 0 },
      data: {
        nodeId: 'RAGNode',
        values: {
          nodeName: 'RAG',
          limit: 5,
          filters: '',
          prompts: [
            {
              id: '187c2f4b-c23d-4545-abef-73dc897d6b7b',
              role: 'system',
              // Prompt externalized to prompts/system.md
              // At build time, this is resolved from the markdown file
              content: '{{@prompt/system}}',
            },
          ],
          memories: '[]',
          messages: '[]',
          vectorDB: '',
          certainty: '0.5',
          queryField: '{{triggerNode_1.output.chatMessage}}',
          embeddingModelName: {},
          generativeModelName: {},
        },
      },
    },
    {
      id: 'chatResponseNode_988',
      type: 'dynamicNode',
      position: { x: 0, y: 0 },
      data: {
        nodeId: 'chatResponseNode',
        values: {
          nodeName: 'Chat Response',
          content: '{{RAGNode_919.output.modelResponse}}',
        },
      },
    },
  ],

  edges: [
    {
      id: 'triggerNode_1-RAGNode_919',
      source: 'triggerNode_1',
      target: 'RAGNode_919',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'defaultEdge',
    },
    {
      id: 'RAGNode_919-chatResponseNode_988',
      source: 'RAGNode_919',
      target: 'chatResponseNode_988',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'defaultEdge',
    },
    {
      id: 'response-chatResponseNode_988',
      source: 'triggerNode_1',
      target: 'chatResponseNode_988',
      sourceHandle: 'to-response',
      targetHandle: 'from-trigger',
      type: 'responseEdge',
    },
  ],
};
