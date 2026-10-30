import { Lamatic } from 'lamatic';
import lamaticConfig from '../../lamatic.config';

const PLACEHOLDERS = new Set([
  '',
  'LAMATIC_API_URL',
  'LAMATIC_PROJECT_ID',
  'LAMATIC_API_KEY',
  'AUDIT_KB_FLOW_ID',
  'https://your-org.lamatic.dev/graphql',
  'your_lamatic_project_id',
  'your_lamatic_api_key',
  'your_audit_kb_flow_id',
]);

function isConfigured(val: string | undefined): val is string {
  if (!val) return false;
  const trimmed = val.trim();
  return trimmed.length > 0 && !PLACEHOLDERS.has(trimmed);
}

export function getFlowEnvKey(): string {
  const step = lamaticConfig.steps[0];
  return step?.envKey || 'AUDIT_KB_FLOW_ID';
}

export function getAuditFlowId(): string | undefined {
  const envKey = getFlowEnvKey();
  const val = process.env[envKey];
  return isConfigured(val) ? val.trim() : undefined;
}

export function isDemoMode(): boolean {
  return (
    !isConfigured(process.env.LAMATIC_API_URL) ||
    !isConfigured(process.env.LAMATIC_PROJECT_ID) ||
    !isConfigured(process.env.LAMATIC_API_KEY) ||
    !getAuditFlowId()
  );
}

export function getLamaticClient(): Lamatic {
  const endpoint = process.env.LAMATIC_API_URL?.trim();
  const projectId = process.env.LAMATIC_PROJECT_ID?.trim();
  const apiKey = process.env.LAMATIC_API_KEY?.trim();

  if (!isConfigured(endpoint) || !isConfigured(projectId) || !isConfigured(apiKey)) {
    throw new Error(
      'Lamatic API credentials are not configured. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY in .env.local.',
    );
  }

  return new Lamatic({
    endpoint,
    projectId,
    apiKey,
  });
}

export const lamaticClient = {
  executeFlow(flowId: string, payload: Record<string, unknown>) {
    return getLamaticClient().executeFlow(flowId, payload);
  },
};

export { lamaticConfig };
