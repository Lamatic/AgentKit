"use server"

import { lamaticClient } from "../lib/lamatic-client"
import { config } from "../orchestrate.js"

export interface PipelineInputs {
  incidentTitle: string;
  alertDetails: string;
  logsOrSymptoms: string;
  gitDiff?: string;
  configSettings?: string;
}

export interface PipelineStepResult {
  stepId: string;
  stepName: string;
  success: boolean;
  data?: any;
  error?: string;
}

// Check if we are running in a mock environment (e.g. if credentials are placeholder/local dev without deploy)
const IS_MOCK = process.env.LAMATIC_API_KEY === "your-lamatic-api-key" || !process.env.LAMATIC_API_KEY;

export async function executePipelineStep(
  stepId: "step1" | "step2" | "step3",
  inputs: PipelineInputs,
  previousResults?: Record<string, any>
): Promise<PipelineStepResult> {
  const stepConfig = config.flows[stepId];
  if (!stepConfig) {
    return {
      stepId,
      stepName: stepId,
      success: false,
      error: `Step ${stepId} not found in configuration.`
    };
  }

  // Handle mock execution fallback for the demo
  if (IS_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay
    if (stepId === "step1") {
      const generatedSteps = `### Diagnostic Investigation Plan\n` +
        `- [ ] Verify the stack trace in \`src/controllers/auth.ts\` around line 42.\n` +
        `- [ ] Check package versions of \`jsonwebtoken\` and related auth libraries in \`package.json\`; investigate if there was a breaking upgrade.\n` +
        `- [ ] Analyze recent git changelog for commits touching authorization and JWT validations.\n` +
        `- [ ] Review database configurations or JWT secrets in env variables.`;
      return {
        stepId,
        stepName: stepConfig.name,
        success: true,
        data: { steps: generatedSteps }
      };
    } else if (stepId === "step2") {
      const gitDiff = inputs.gitDiff || "";
      const generatedResearch = `### Log & Code Findings\n` +
        `- **Stacktrace Fault**: The NullPointerException is originating from \`verifyToken()\` function call at \`auth.ts:45\`.\n` +
        `- **Code Defect Isolated**: The git diff reveals that commit \`ad29df1\` changed \`secret\` lookup to \`process.env.JWT_SECRET_KEY\`, but the deployment manifest remains configured with \`JWT_SECRET\`.\n` +
        `- **Version Check**: No version changes detected in \`jsonwebtoken\`. The issue is entirely due to env var name mismatch.`;
      return {
        stepId,
        stepName: stepConfig.name,
        success: true,
        data: { research: generatedResearch }
      };
    } else {
      const research = previousResults?.step2?.research || "";
      const postmortem = `# SRE Postmortem Incident Report\n\n` +
        `## Executive Summary\n` +
        `On July 11, users experienced authorization failures (HTTP 500) during token verification. The issue started after deploying commit \`ad29df1\`.\n\n` +
        `## Root Cause Analysis\n` +
        `The model verified a mismatch between codebase expects and configuration environment mapping:\n` +
        `- Commit \`ad29df1\` updated verification check to reference \`JWT_SECRET_KEY\`.\n` +
        `- The target environment only exposes \`JWT_SECRET\` variable name.\n` +
        `This led to a null/undefined argument passed to token decoder, raising an unhandled exception.\n\n` +
        `## Remediation\n` +
        `- **Temporary Fix**: Revert commit \`ad29df1\` or update target deployment configuration manifest to inject \`JWT_SECRET_KEY\` matching the new variable name.\n\n` +
        `## Prevention Actions\n` +
        `- [ ] Add schema validations for environment variables on server boot to fail-fast during mismatches.\n` +
        `- [ ] Configure CI pipelines to check for consistency between environment configuration schemas and usage across codebase.`;
      return {
        stepId,
        stepName: stepConfig.name,
        success: true,
        data: { postmortem }
      };
    }
  }

  // Real execution via Lamatic API
  try {
    let flowInputs: Record<string, any> = {};
    if (stepId === "step1") {
      flowInputs = {
        incidentTitle: inputs.incidentTitle,
        alertDetails: inputs.alertDetails,
        logsOrSymptoms: inputs.logsOrSymptoms
      };
    } else if (stepId === "step2") {
      flowInputs = {
        steps: previousResults?.step1?.steps || "",
        gitDiff: inputs.gitDiff || "",
        configSettings: inputs.configSettings || ""
      };
    } else if (stepId === "step3") {
      flowInputs = {
        incidentTitle: inputs.incidentTitle,
        research: previousResults?.step2?.research || ""
      };
    }

    const response = await lamaticClient.executeFlow(stepConfig.workflowId, flowInputs);
    if (!response.result) {
      throw new Error(`Execution returned empty result.`);
    }

    return {
      stepId,
      stepName: stepConfig.name,
      success: true,
      data: response.result
    };
  } catch (error) {
    console.error(`Error in executing ${stepConfig.name}:`, error);
    return {
      stepId,
      stepName: stepConfig.name,
      success: false,
      error: error instanceof Error ? error.message : "Unknown flow error."
    };
  }
}
