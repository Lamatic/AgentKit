export function createLamaticClient() {
  const apiUrl = process.env.LAMATIC_API_URL!;
  const apiKey = process.env.LAMATIC_API_KEY!;
  const projectId = process.env.LAMATIC_PROJECT_ID!;

  return {
    async executeFlow({
      flowId,
      inputs,
    }: {
      flowId: string;
      inputs: Record<string, string>;
    }) {
      console.log("API URL:", apiUrl);
      console.log("Flow ID:", flowId);
      console.log("API Key:", apiKey?.substring(0, 10) + "...");
      console.log("Project ID:", projectId);

      const query = `
        query ExecuteWorkflow(
          $workflowId: String!
          $dataset_summary: String
        ) {
          executeWorkflow(
            workflowId: $workflowId
            payload: {
              dataset_summary: $dataset_summary
            }
          ) {
            status
            result
          }
        }
      `;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "x-project-id": projectId,
        },
        body: JSON.stringify({
          query,
          variables: {
            workflowId: flowId,
            dataset_summary: inputs.dataset_summary,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        throw new Error(`Lamatic API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Response data:", JSON.stringify(data));
      return {
        data: {
          generatedText: data?.data?.executeWorkflow?.result?.preprocessing_script?.generatedResponse,
        },
      };
    },
  };
}