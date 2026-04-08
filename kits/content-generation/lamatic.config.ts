export default {
  name: 'Generative AI',
  description: 'It uses intelligent workflows to generate text, images, and JSON content through a modern Next.js interface with markdown rendering support.',
  version: '1.0.0',
  type: 'kit' as const,
  author: { name: 'Lamatic AI', email: 'info@lamatic.ai' },
  tags: ['agentic', 'generative'],
  steps: [
    { id: 'agentic-generate-content', type: 'mandatory' as const, envKey: 'AGENTIC_GENERATE_CONTENT' }
  ],
  links: {
    demo: 'https://agent-kit-generation.vercel.app/',
    github: 'https://github.com/Lamatic/AgentKit/tree/main/kits/content-generation',
    deploy: 'https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/content-generation/apps&env=AGENTIC_GENERATE_CONTENT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY',
    docs: 'https://lamatic.ai/templates/agentkits/agentic/agent-kit-generation',
  },
};
