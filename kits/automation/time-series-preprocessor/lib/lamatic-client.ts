import Lamatic from "lamatic";

export function createLamaticClient() {
  const apiUrl = process.env.LAMATIC_API_URL!;
  const apiKey = process.env.LAMATIC_API_KEY!;
  const projectId = process.env.LAMATIC_PROJECT_ID!;

  const client = new Lamatic({
    endpoint: apiUrl,
    projectId,
    apiKey,
  });

  return {
    async executeFlow({
      flowId,
      inputs,
    }: {
      flowId: string;
      inputs: Record<string, string>;
    }) {
      const response = await client.executeFlow({
        flowId,
        payload: {
          dataset_summary: inputs.dataset_summary,
        },
      });

      return {
        data: {
          generatedText: response?.result?.preprocessing_script,
        },
      };
    },
  };
}