import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { job_description, freelancer_skills } = body;

    const response = await fetch('https://abisheksorganization598-abisheksproject244.lamatic.dev', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LAMATIC_API_KEY}`,
        'Content-Type': 'application/json',
        'x-project-id': '0a2dd138-b081-4f43-a507-6d8e912be4f3',
      },
      body: JSON.stringify({
        // Added the "!" after JSON to satisfy the strict GraphQL schema
        query: `query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
          executeWorkflow(workflowId: $workflowId, payload: $payload) {
            status
            result
          }
        }`,
        variables: {
          workflowId: "c3c37e20-3484-40b2-b133-0babff9de0dc",
          payload: {
            job_description: job_description,
            freelancer_skills: freelancer_skills
          }
        }
      })
    });

    const data = await response.json();
    
    // Extracting the proposal from the "result" object
    const generatedProposal = data?.data?.executeWorkflow?.result?.proposal 
                           || data?.data?.executeWorkflow?.result 
                           || `Raw API Error: ${JSON.stringify(data)}`;

    return NextResponse.json({ proposal: generatedProposal });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate proposal' }, { status: 500 });
  } 
}