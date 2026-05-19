import config from "../../lamatic.config";

export const lamaticConfig = config;

export const getStepEnvKey = (stepId: string): string => {
  const step = config.steps.find((s) => s.id === stepId);
  if (!step) throw new Error(`Step "${stepId}" not found in lamatic.config.ts`);
  return step.envKey;
};

export const getLamaticClient = () => {
  return {
    apiUrl: process.env.LAMATIC_API_URL!,
    apiKey: process.env.LAMATIC_API_KEY!,
    projectId: process.env.LAMATIC_PROJECT_ID!,
    travelFlowId: process.env[getStepEnvKey("travel-flow")]!,
    chatbotFlowId: process.env[getStepEnvKey("chatbot-flow")]!,
  };
};