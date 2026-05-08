import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const query = `
      query ExecuteWorkflow(
        $workflowId: String!
        $language: String!
        $error: String!
        $codeSnippet: String!
      ) {
        executeWorkflow(
          workflowId: $workflowId
          payload: {
            language: $language
            error: $error
            codeSnippet: $codeSnippet
          }
        ) {
          status
          result
        }
      }
    `;

    const variables = {
      workflowId: process.env.BUGPILOT_DEBUGGER_FLOW_ID,
      language: body.language,
      error: body.error,
      codeSnippet: body.codeSnippet,
    };

    const response = await fetch(process.env.LAMATIC_API_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
        "Content-Type": "application/json",
        "x-project-id": process.env.LAMATIC_PROJECT_ID!,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const data = await response.json();

    console.log("LAMATIC RESPONSE:", data);

    // Handle GraphQL errors
    if (data?.errors?.length > 0) {
      return NextResponse.json({
        result: data.errors[0].message,
      });
    }

    const workflowResult = data?.data?.executeWorkflow?.result;

    let finalResult = "";

    // If Lamatic returns stringified JSON
    if (typeof workflowResult === "string") {
      try {
        const parsed = JSON.parse(workflowResult);

        finalResult = parsed.result || workflowResult;
      } catch {
        finalResult = workflowResult;
      }
    }
    // If Lamatic returns object with result
    else if (workflowResult?.result) {
      finalResult = workflowResult.result;
    }
    // If Lamatic returns object with output
    else if (workflowResult?.output) {
      finalResult = workflowResult.output;
    }
    // Fallback
    else {
      finalResult = JSON.stringify(workflowResult, null, 2);
    }

    return NextResponse.json({
      result: finalResult || "No response received.",
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      {
        result: "Failed to analyze bug.",
      },
      {
        status: 500,
      },
    );
  }
}
