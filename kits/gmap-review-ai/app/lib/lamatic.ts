// lib/lamatic.ts

const GQL_QUERY = `
query ExecuteWorkflow(
  $workflowId: String!
  $business_name: String
  $business_maps_url: String
  $competitor_maps_urls: [String]
  $max_reviews_per_place: Int
  $reviews_since: String        
) {
  executeWorkflow(
    workflowId: $workflowId
    payload: {
      business_name: $business_name
      business_maps_url: $business_maps_url
      competitor_maps_urls: $competitor_maps_urls
      max_reviews_per_place: $max_reviews_per_place
      reviews_since: $reviews_since
    }
  ) {
      status
      result
  }
}`;

export const triggerGMapAnalysis = async (formData: any) => {
  const apiKey = process.env.NEXT_PUBLIC_LAMATIC_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_LAMATIC_PROJECT_ID;
  const workflowId = process.env.NEXT_PUBLIC_LAMATIC_FLOW_ID;
  const url = process.env.NEXT_PUBLIC_LAMATIC_GRAPHQL_URL;

  // Validate variables exist
  if (!apiKey || !projectId) {
    throw new Error("Missing Lamatic API Key or Project ID in .env.local");
  }


  const variables = {
    workflowId: workflowId,
    business_name: formData.business_name,
    business_maps_url: formData.business_maps_url,
    competitor_maps_urls: formData.competitor_maps_urls.filter((u: string) => u.trim() !== ""),
    max_reviews_per_place: 30, 
    reviews_since: "3 months"
  };

  const response = await fetch(url!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'x-project-id': projectId,
    },
    body: JSON.stringify({
      query: GQL_QUERY,
      variables: variables
    }),
  });



  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lamatic API Error Response:", errorText);
    throw new Error(`Lamatic API Error: ${response.status} - ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
    console.error("GraphQL Errors:", json.errors);
    throw new Error(json.errors[0].message);
  }

  const executionData = json.data.executeWorkflow;
  
  // Lamatic Synchronous flows return the result as a stringified JSON
  if (typeof executionData.result === 'string') {
    return JSON.parse(executionData.result);
  }
  
  return executionData.result;
};


