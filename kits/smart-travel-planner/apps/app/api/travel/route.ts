import { NextResponse } from "next/server";
import { runTravelAgent } from "../../../actions/orchestrate";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const destination = String(body?.destination || "").trim();
    const days = Number(body?.days);
    const budget = Number(body?.budget);
    const destination_type = String(body?.destination_type || "").trim();

    if (!destination || !days || !budget) {
      return NextResponse.json(
        {
          success: false,
          error: "destination, days, budget and destination_type are required",
        },
        { status: 400 }
      );
    }

    const agentResponse = await runTravelAgent({
      destination,
      days,
      budget,
      destination_type,
    });

    const finalData =
      agentResponse?.result?.result ||
      agentResponse?.result ||
      agentResponse;

    return NextResponse.json({
      success: true,
      itinerary: finalData,
    });
  } catch (error) {
    console.error("Travel route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate travel itinerary",
      },
      { status: 500 }
    );
  }
}