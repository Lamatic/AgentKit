// app/api/flights/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Get environment variables
    const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY;
    const LAMATIC_PROJECT_ID = process.env.LAMATIC_PROJECT_ID;
    const LAMATIC_WORKFLOW_ID = process.env.LAMATIC_WORKFLOW_ID;
    const LAMATIC_API_URL = process.env.LAMATIC_API_URL;

    if (
      !LAMATIC_API_KEY ||
      !LAMATIC_PROJECT_ID ||
      !LAMATIC_WORKFLOW_ID ||
      !LAMATIC_API_URL
    ) {
      console.error("Missing Lamatic credentials");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const query = `
      query ExecuteWorkflow($workflowId: String!, $message: String!) {
        executeWorkflow(
          workflowId: $workflowId
          payload: {
            message: $message
          }
        ) {
          status
          result
        }
      }
    `;

    const variables = {
      workflowId: LAMATIC_WORKFLOW_ID,
      message: message,
    };

    const response = await fetch(LAMATIC_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LAMATIC_API_KEY}`,
        "Content-Type": "application/json",
        "x-project-id": LAMATIC_PROJECT_ID,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lamatic API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Lamatic API error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const result = data.data?.executeWorkflow?.result;

    // ✅ Log the full result to debug
    console.log("📥 ===== Lamatic Result ======");
    console.log(JSON.stringify(result, null, 2));
    console.log("   cheapestPrice:", result?.cheapestPrice);
    console.log("   mostExpensive:", result?.mostExpensive);
    console.log("   cabinClass:", result?.cabinClass);
    console.log("   showing:", result?.showing);

    if (result && result.flights && result.flights.length > 0) {
      // ✅ Include ALL fields from the Lamatic result
      return NextResponse.json({
        status: result.status || "success",
        message: result.message || `Found ${result.flights.length} flights`,
        totalAvailable: result.totalAvailable || result.flights.length,
        totalResults: result.totalResults || result.flights.length,
        showing: result.showing || result.flights.length, // ✅ ADDED
        cheapestPrice: result.cheapestPrice || result.flights[0]?.price || null, // ✅ ADDED
        mostExpensive:
          result.mostExpensive ||
          result.flights[result.flights.length - 1]?.price ||
          null, // ✅ ADDED
        currency: result.currency || result.flights[0]?.currency || "USD",
        displayCurrency:
          result.displayCurrency ||
          result.currency ||
          result.flights[0]?.currency ||
          "USD",
        exchangeRate: result.exchangeRate || null,
        requestedCurrency: result.requestedCurrency || "USD",
        cabinClass:
          result.cabinClass || result.flights[0]?.cabinClass || "economy", // ✅ ADDED
        searchParams: result.searchParams || {},
        flights: result.flights,
      });
    } else {
      return NextResponse.json({
        status: "no_results",
        message: result?.message || "No flights found",
        flights: [],
      });
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
