// lamatic.config.ts — Project configuration for RAG Chatbot
// When @lamatic/sdk ships, use: import { defineConfig } from '@lamatic/sdk'

export default {
  name: 'RAG Chatbot',
  description:
    'This flow builds a chatbot that answers questions based on a context database containing all relevant information. User queries are answered using the existing documentation.',
  version: '1.0.0',
  type: 'template' as const,

  author: {
    name: 'Naitik Kapadia',
    email: 'naitikk@lamatic.ai',
  },

  tags: ['support', 'startup'],

  steps: [
    {
      id: 'rag-chatbot',
      type: 'mandatory' as const,
    },
  ],

  links: {
    deploy: 'https://studio.lamatic.ai/template/rag-chatbot',
    github:
      'https://github.com/Lamatic/AgentKit/tree/main/kits/rag-chatbot',
  },
};
