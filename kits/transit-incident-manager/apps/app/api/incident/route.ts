import { NextRequest, NextResponse } from "next/server";

const query = `
query ExecuteWorkflow(
  $workflowId: String!
  $busNumber: String
  $currentRoute: String
  $affectedStop: String
  $incidentType: String
  $delay: String
) {
  executeWorkflow(
    workflowId: $workflowId
    payload: {
      busNumber: $busNumber
      currentRoute: $currentRoute
      affectedStop: $affectedStop
      incidentType: $incidentType
      delay: $delay
    }
  ) {
    status
    result
  }
}
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Endpoint:", process.env.LAMATIC_ENDPOINT);

    const response = await fetch(process.env.LAMATIC_ENDPOINT!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
        "Content-Type": "application/json",
        "x-project-id": process.env.LAMATIC_PROJECT_ID!,
      },
      body: JSON.stringify({
        query,
        variables: {
          workflowId: process.env.TRANSIT_INCIDENT_RESPONSE_FLOW_ID!,
          busNumber: body.busNumber,
          currentRoute: body.currentRoute,
          affectedStop: body.affectedStop,
          incidentType: body.incidentType,
          delay: body.delay,
        },
      }),
    });

    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);

    const raw = await response.text();

    console.log("===== RAW RESPONSE =====");
    console.log(JSON.stringify(raw));

    if (!raw.trim()) {
      return NextResponse.json(
        { error: "Lamatic returned an empty response." },
        { status: 500 }
      );
    }

    const data = JSON.parse(raw);

    console.log("===== PARSED RESPONSE =====");
    console.log(JSON.stringify(data, null, 2));

    return NextResponse.json(
  data.data.executeWorkflow.result.generatedResponse
);
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      { error: "Failed to execute workflow." },
      { status: 500 }
    );
  }
}