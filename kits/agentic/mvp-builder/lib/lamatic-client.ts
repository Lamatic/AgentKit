import { Lamatic } from 'lamatic';
import { config } from '@/orchestrate';

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint!,
  projectId: config.api.projectId!,
  apiKey: config.api.apiKey!
});
