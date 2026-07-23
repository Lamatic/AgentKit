import { NextRequest, NextResponse } from "next/server";
import { Lamatic } from "lamatic";

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

    const lamatic = new Lamatic({
      apiKey: LAMATIC_API_KEY,
      projectId: LAMATIC_PROJECT_ID,
      endpoint: LAMATIC_API_URL,
    });

    const response = await lamatic.executeFlow(LAMATIC_WORKFLOW_ID, {
      message,
    });

    const result = response.result;

    if (result && result.flights && result.flights.length > 0) {
      return NextResponse.json({
        status: result.status || "success",
        message: result.message || `Found ${result.flights.length} flights`,
        totalAvailable: result.totalAvailable || result.flights.length,
        totalResults: result.totalResults || result.flights.length,
        showing: result.showing || result.flights.length,
        cheapestPrice: result.cheapestPrice || result.flights[0]?.price || null,
        mostExpensive:
          result.mostExpensive ||
          result.flights[result.flights.length - 1]?.price ||
          null,
        currency: result.currency || result.flights[0]?.currency || "USD",
        displayCurrency:
          result.displayCurrency ||
          result.currency ||
          result.flights[0]?.currency ||
          "USD",
        exchangeRate: result.exchangeRate || null,
        requestedCurrency: result.requestedCurrency || "USD",
        cabinClass:
          result.cabinClass || result.flights[0]?.cabinClass || "economy",
        searchParams: result.searchParams || {},
        flights: result.flights,
      });
    } else {
      return NextResponse.json({
        status: result?.status || "no_results",
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
