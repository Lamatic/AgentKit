/**
 * Type definitions for Lamatic API responses and flow configuration
 * Based on best practices from agentic/deep-search and agentic/generation kits
 */

/**
 * Response from Lamatic GraphQL API executeWorkflow mutation
 */
export interface LamaticWorkflowResponse {
  status: 'success' | 'error' | 'pending' | 'completed';
  result?: Record<string, any> | string | null;
  message?: string;
  error?: string;
  data?: Record<string, any>;
}

/**
 * Validated result from flow execution
 */
export interface FlowExecutionResult {
  success: boolean;
  status: string;
  result?: string | Record<string, any>;
  error?: string;
}

/**
 * System design analysis result
 */
export interface SystemDesignAnalysis {
  issues?: Array<{
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    recommendation?: string;
  }>;
  recommendations?: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    impact?: string;
  }>;
  summary?: {
    overallScore?: number;
    strengths?: string[];
    weaknesses?: string[];
    nextSteps?: string[];
  };
}

/**
 * Input schema for system design flow
 */
export interface SystemDesignInput {
  system_design: string;
}

/**
 * Orchestration configuration
 */
export interface FlowConfig {
  type: 'atomic' | 'sequential' | 'conditional';
  flows: Record<
    string,
    {
      name: string;
      type: 'graphQL' | 'rest';
      workflowId: string;
      description: string;
      expectedOutput: string[];
      inputSchema: Record<string, string>;
      outputSchema: Record<string, string>;
      mode: 'sync' | 'async';
      polling: boolean | string;
    }
  >;
  api: {
    endpoint: string;
    projectId: string;
    apiKey: string;
  };
}

/**
 * Server action response format
 */
export interface ServerActionResponse<T = any> {
  success: boolean;
  status?: string;
  result?: T;
  error?: string;
}
