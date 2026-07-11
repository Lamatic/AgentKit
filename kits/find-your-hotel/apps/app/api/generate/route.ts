import { NextRequest, NextResponse } from "next/server";
import { getWeatherSummary } from "@/lib/weather";
import { generatePackingList, type Traveler } from "@/lib/lamatic-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, startDate, endDate, tripType, travelers } = body as {
      destination: string;
      startDate: string;
      endDate: string;
      tripType: string;
      travelers: Traveler[];
    };

    if (!destination || !startDate || !endDate || !tripType || !travelers?.length) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const weather = await getWeatherSummary(destination, startDate, endDate);

    const result = await generatePackingList({
      destination,
      startDate,
      endDate,
      tripType,
      travelers,
      weather,
    });

    return NextResponse.json({ weather, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
