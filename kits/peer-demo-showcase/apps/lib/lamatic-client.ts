import { Lamatic } from 'lamatic';

export const lamaticClient = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY || '',
  projectId: process.env.LAMATIC_PROJECT_ID || '',
  endpoint: process.env.LAMATIC_API_URL || 'https://api.lamatic.ai',
});

export const flowId = process.env.LAMATIC_SUBMISSION_FLOW_ID || process.env.LAMATIC_FLOW_ID || '';